// lib/property-health.ts
//
// Deterministic property health scoring from live PostgreSQL data.
// No AI, no invented numbers — every value is derived directly from DB rows.
//
// Call computeAndSavePropertyHealth(propertyId) from a server component.
// It queries jobs + payments + occupancy, calculates a 0-100 score, compares
// against the most recent stored snapshot, and saves a new one when appropriate.
//
// Save policy (avoids flooding the snapshots table):
//   • No snapshot exists for this property → always save
//   • Last snapshot is older than 23 hours → save (daily cadence)
//   • Score has changed by ≥ 5 points since the last snapshot → save immediately
//   • Otherwise → return the existing snapshot data without writing

import { prisma } from "@/lib/prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export type RiskLevel = "excellent" | "good" | "needs_attention" | "high_risk";
export type Trend = "improving" | "stable" | "declining";

export type HealthMetrics = {
  openJobs: number;
  urgentJobs: number;
  recentRepairs: number;       // repairs + maintenance in the last 12 months
  overduePayments: number;
  repeatedCategories: string[]; // categories with ≥3 job occurrences
  categoryBreakdown: Record<string, number>;
  last60DaysByCategory: Record<string, number>;
  occupancyStatus: string;
};

export type PropertyHealthData = {
  score: number;
  riskLevel: RiskLevel;
  reasons: string[];          // ordered by impact, most impactful first
  metrics: HealthMetrics;
  recommendation: string;
  trend: Trend | null;        // null = no prior snapshot to compare against
  previousScore: number | null;
  snapshotAge: string | null; // "2 days ago" — displayed in the card
};

// ── Scoring constants ─────────────────────────────────────────────────────────
// Centralised so changes here propagate everywhere and snapshots remain auditable.

const PENALTY = {
  openJobPerTask: 5,
  openJobCap: 25,
  urgentJobPerTask: 10,
  recentRepairPerJob: 3,
  recentRepairCap: 15,
  repeatedCategoryPerCat: 10,
  overduePaymentPerPayment: 15,
  vacant: 5,
} as const;

const RISK_THRESHOLDS: { min: number; level: RiskLevel }[] = [
  { min: 85, level: "excellent" },
  { min: 70, level: "good" },
  { min: 50, level: "needs_attention" },
  { min: 0,  level: "high_risk" },
];

// ── Core scoring function ────────────────────────────────────────────────────

function scoreFromData(
  jobs: { status: string; category: string; priority: string; createdAt: Date }[],
  payments: { status: string }[],
  occupancyStatus: string,
): { score: number; riskLevel: RiskLevel; metrics: HealthMetrics; reasons: string[]; recommendation: string } {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const openJobs = jobs.filter((j) => j.status !== "completed");
  const urgentJobs = openJobs.filter(
    (j) => j.priority === "urgent" || j.priority === "high",
  );

  const recentRepairs = jobs.filter(
    (j) =>
      new Date(j.createdAt) >= oneYearAgo &&
      (j.category === "repair" || j.category === "maintenance"),
  );

  const categoryBreakdown: Record<string, number> = {};
  for (const j of jobs) {
    categoryBreakdown[j.category] = (categoryBreakdown[j.category] ?? 0) + 1;
  }
  const repeatedCategories = Object.entries(categoryBreakdown)
    .filter(([, n]) => n >= 3)
    .map(([c]) => c);

  const overduePayments = payments.filter((p) => p.status === "overdue");

  const last60DaysByCategory: Record<string, number> = {};
  for (const j of jobs.filter((j) => new Date(j.createdAt) >= sixtyDaysAgo)) {
    last60DaysByCategory[j.category] = (last60DaysByCategory[j.category] ?? 0) + 1;
  }

  // ── Calculate score ──────────────────────────────────────────────────────
  let score = 100;
  score -= Math.min(openJobs.length * PENALTY.openJobPerTask, PENALTY.openJobCap);
  score -= urgentJobs.length * PENALTY.urgentJobPerTask;
  score -= Math.min(recentRepairs.length * PENALTY.recentRepairPerJob, PENALTY.recentRepairCap);
  score -= repeatedCategories.length * PENALTY.repeatedCategoryPerCat;
  score -= overduePayments.length * PENALTY.overduePaymentPerPayment;
  if (occupancyStatus === "vacant") score -= PENALTY.vacant;
  score = Math.max(0, Math.min(100, score));

  const riskLevel = RISK_THRESHOLDS.find((t) => score >= t.min)!.level;

  // ── Build reasons (ordered by impact) ───────────────────────────────────
  const reasons: string[] = [];

  if (overduePayments.length > 0) {
    reasons.push(
      `${overduePayments.length} overdue payment${overduePayments.length > 1 ? "s" : ""} (−${overduePayments.length * PENALTY.overduePaymentPerPayment} pts)`,
    );
  }
  if (urgentJobs.length > 0) {
    reasons.push(
      `${urgentJobs.length} urgent open task${urgentJobs.length > 1 ? "s" : ""} (−${urgentJobs.length * PENALTY.urgentJobPerTask} pts)`,
    );
  }
  if (repeatedCategories.length > 0) {
    const topCat = Object.entries(categoryBreakdown)
      .filter(([c]) => repeatedCategories.includes(c))
      .sort(([, a], [, b]) => b - a)[0];
    reasons.push(
      `"${topCat[0].replace(/_/g, " ")}" issues recurred ${topCat[1]} times (−${repeatedCategories.length * PENALTY.repeatedCategoryPerCat} pts)`,
    );
  }
  if (openJobs.length > 0) {
    const penalty = Math.min(openJobs.length * PENALTY.openJobPerTask, PENALTY.openJobCap);
    reasons.push(
      `${openJobs.length} open task${openJobs.length > 1 ? "s" : ""} (−${penalty} pts)`,
    );
  }
  if (recentRepairs.length > 0) {
    const penalty = Math.min(
      recentRepairs.length * PENALTY.recentRepairPerJob,
      PENALTY.recentRepairCap,
    );
    reasons.push(
      `${recentRepairs.length} repair${recentRepairs.length > 1 ? "s" : ""} in the past 12 months (−${penalty} pts)`,
    );
  }
  if (occupancyStatus === "vacant") {
    reasons.push(`Property is vacant (−${PENALTY.vacant} pts)`);
  }
  if (reasons.length === 0) {
    reasons.push("No significant issues — all checks passing");
  }

  // ── Recommendation ───────────────────────────────────────────────────────
  let recommendation: string;
  if (overduePayments.length > 0) {
    recommendation = `Follow up on ${overduePayments.length > 1 ? overduePayments.length + " overdue payments" : "the overdue payment"}. Contact the tenant to arrange a payment plan.`;
  } else if (urgentJobs.length > 0) {
    recommendation = `Address the ${urgentJobs.length > 1 ? urgentJobs.length + " urgent tasks" : "urgent task"} immediately — each costs ${PENALTY.urgentJobPerTask} points while open.`;
  } else if (repeatedCategories.length > 0) {
    const [topCat, topCount] = Object.entries(categoryBreakdown).sort(
      ([, a], [, b]) => b - a,
    )[0];
    recommendation = `Schedule a root-cause inspection for "${topCat.replace(/_/g, " ")}" — it has recurred ${topCount} times. Preventing recurrence would recover ${repeatedCategories.length * PENALTY.repeatedCategoryPerCat} points.`;
  } else if (openJobs.length > 3) {
    recommendation = `Clear the ${openJobs.length} open tasks to prevent the build-up penalty from growing.`;
  } else {
    recommendation = "Property is in good shape. A routine inspection will maintain the current score.";
  }

  const metrics: HealthMetrics = {
    openJobs: openJobs.length,
    urgentJobs: urgentJobs.length,
    recentRepairs: recentRepairs.length,
    overduePayments: overduePayments.length,
    repeatedCategories,
    categoryBreakdown,
    last60DaysByCategory,
    occupancyStatus,
  };

  return { score, riskLevel, metrics, reasons, recommendation };
}

// ── Snapshot age label ────────────────────────────────────────────────────────

function snapshotAgeLabel(createdAt: Date): string {
  const diffMs = Date.now() - createdAt.getTime();
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function computeAndSavePropertyHealth(
  propertyId: number,
  ownerId: number,
): Promise<PropertyHealthData> {
  const now = new Date();

  // Fetch live data in parallel.
  const [jobs, rentPayments, property, previousSnapshot] = await Promise.all([
    prisma.job.findMany({
      where: { propertyId, property: { ownerId } },
      select: { status: true, category: true, priority: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { propertyId, type: "rent", property: { ownerId } },
      select: { status: true },
    }),
    prisma.property.findFirst({
      where: { id: propertyId, ownerId },
      select: { occupancyStatus: true },
    }),
    prisma.propertyHealthSnapshot.findFirst({
      where: { propertyId, property: { ownerId } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!property) {
    throw new Error("Property not found");
  }

  const occupancyStatus = property?.occupancyStatus ?? "vacant";
  const { score, riskLevel, metrics, reasons, recommendation } = scoreFromData(
    jobs,
    rentPayments,
    occupancyStatus,
  );

  // ── Decide whether to save a new snapshot ───────────────────────────────
  const hoursSinceLast = previousSnapshot
    ? (now.getTime() - previousSnapshot.createdAt.getTime()) / (60 * 60 * 1000)
    : Infinity;

  const scoreDelta = previousSnapshot ? Math.abs(score - previousSnapshot.score) : Infinity;

  const shouldSave =
    !previousSnapshot ||
    hoursSinceLast >= 23 ||
    scoreDelta >= 5;

  if (shouldSave) {
    await prisma.propertyHealthSnapshot.create({
      data: {
        propertyId,
        score,
        riskLevel,
        reasons,
        metrics: metrics as object,
      },
    });
  }

  // ── Derive trend ─────────────────────────────────────────────────────────
  // Compare against the snapshot that was in place BEFORE this call.
  let trend: Trend | null = null;
  let previousScore: number | null = null;
  let snapshotAge: string | null = null;

  if (previousSnapshot) {
    previousScore = previousSnapshot.score;
    snapshotAge = snapshotAgeLabel(previousSnapshot.createdAt);
    const delta = score - previousSnapshot.score;
    trend = delta >= 5 ? "improving" : delta <= -5 ? "declining" : "stable";
  }

  return {
    score,
    riskLevel,
    reasons,
    metrics,
    recommendation,
    trend,
    previousScore,
    snapshotAge,
  };
}
