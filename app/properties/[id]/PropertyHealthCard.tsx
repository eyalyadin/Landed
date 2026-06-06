// PropertyHealthCard — MVP Property Health diagnostic section.
// "use client" is required for the collapsible toggle (useState).
//
// Architecture note: scoring logic can be swapped for a real Gemini API call.
// Replace computePropertyHealth() body with a call to /api/property-health.
//
// Future learning signals to feed the LLM:
//   • New tasks added (category, priority, recurrence pattern)
//   • Tasks marked completed (resolution time, contractor used)
//   • Repeated issue patterns (same category 3+ times within 12 months)
//   • User feedback: "Was this recommendation helpful?" thumbs up/down

"use client";

import { useState } from "react";
import { Activity, ChevronDown, Zap } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface HealthInput {
  jobs: {
    status: string;
    category: string;
    priority: string;
    createdAt: string;
    title: string;
  }[];
  payments: { status: string; amount: number; dueDate: string }[];
  occupancyStatus: string;
}

type HealthLabel = "Excellent" | "Good" | "Needs Attention" | "High Risk";
type Sentiment = "good" | "neutral" | "warning" | "bad";

interface HealthResult {
  score: number;
  label: HealthLabel;
  summary: string;
  keyFactors: { label: string; value: string; sentiment: Sentiment }[];
  recentSignals: string[];
  recommendation: string;
}

// ── Mock scoring logic ────────────────────────────────────────────────────────
// When connecting Gemini: replace this entire function body with an async API
// call. The function signature and HealthResult shape stay the same, so the
// rendering code below does not need to change.

function computePropertyHealth(input: HealthInput): HealthResult {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const openJobs = input.jobs.filter((j) => j.status !== "completed");
  const urgentOpen = openJobs.filter((j) => j.priority === "urgent" || j.priority === "high");

  const recentRepairs = input.jobs.filter(
    (j) =>
      new Date(j.createdAt) >= oneYearAgo &&
      (j.category === "repair" || j.category === "maintenance")
  );

  const catCounts: Record<string, number> = {};
  input.jobs.forEach((j) => {
    catCounts[j.category] = (catCounts[j.category] ?? 0) + 1;
  });
  const repeatedCats = Object.entries(catCounts)
    .filter(([, n]) => n >= 3)
    .map(([c]) => c);

  const overduePayments = input.payments.filter((p) => p.status === "overdue");

  const last60CatCounts: Record<string, number> = {};
  input.jobs
    .filter((j) => new Date(j.createdAt) >= sixtyDaysAgo)
    .forEach((j) => {
      last60CatCounts[j.category] = (last60CatCounts[j.category] ?? 0) + 1;
    });

  let score = 100;
  score -= Math.min(openJobs.length * 5, 25);
  score -= urgentOpen.length * 10;
  score -= Math.min(recentRepairs.length * 3, 15);
  score -= repeatedCats.length * 10;
  score -= overduePayments.length * 15;
  if (input.occupancyStatus === "vacant") score -= 5;
  score = Math.max(0, Math.min(100, score));

  const label: HealthLabel =
    score >= 85
      ? "Excellent"
      : score >= 70
      ? "Good"
      : score >= 50
      ? "Needs Attention"
      : "High Risk";

  let summary: string;
  if (score >= 85) {
    summary = "This property is in excellent condition with no major open issues and payments on track.";
  } else if (score >= 70) {
    summary = `This property is in good condition overall.${
      repeatedCats.length > 0
        ? ` Repeated ${repeatedCats[0].replace(/_/g, " ")} issues suggest this area should be monitored.`
        : ""
    }${
      openJobs.length > 0
        ? ` ${openJobs.length} open task${openJobs.length > 1 ? "s need" : " needs"} attention.`
        : ""
    }`;
  } else if (score >= 50) {
    summary = `This property needs attention.${
      urgentOpen.length > 0
        ? ` ${urgentOpen.length} high-priority task${urgentOpen.length > 1 ? "s are" : " is"} currently open.`
        : ""
    }${overduePayments.length > 0 ? " Overdue payments need follow-up." : ""}`;
  } else {
    summary = `This property is at high risk.${
      overduePayments.length > 0 ? " Overdue payments are a serious concern." : ""
    }${
      urgentOpen.length > 0
        ? ` ${urgentOpen.length} urgent task${urgentOpen.length > 1 ? "s" : ""} need immediate action.`
        : ""
    }`;
  }

  const keyFactors: HealthResult["keyFactors"] = [
    {
      label: "Open tasks",
      value: openJobs.length === 0 ? "None" : `${openJobs.length} open`,
      sentiment:
        openJobs.length === 0 ? "good" : openJobs.length <= 2 ? "neutral" : openJobs.length <= 4 ? "warning" : "bad",
    },
    {
      label: "Repairs (12 mo.)",
      value: recentRepairs.length === 0 ? "None" : `${recentRepairs.length} repair${recentRepairs.length > 1 ? "s" : ""}`,
      sentiment:
        recentRepairs.length === 0 ? "good" : recentRepairs.length <= 2 ? "neutral" : recentRepairs.length <= 5 ? "warning" : "bad",
    },
    {
      label: "Repeated issues",
      value: repeatedCats.length === 0 ? "None" : repeatedCats.map((c) => c.replace(/_/g, " ")).join(", "),
      sentiment: repeatedCats.length === 0 ? "good" : repeatedCats.length === 1 ? "warning" : "bad",
    },
    {
      label: "Rent payments",
      value: overduePayments.length === 0 ? "Up to date" : `${overduePayments.length} overdue`,
      sentiment: overduePayments.length === 0 ? "good" : "bad",
    },
  ];

  const signals: string[] = [];
  Object.entries(last60CatCounts).forEach(([cat, n]) => {
    if (n >= 2) signals.push(`${n} ${cat.replace(/_/g, " ")} issues reported in the last 60 days`);
  });
  if (urgentOpen.length === 0) {
    signals.push("No urgent repairs currently open");
  } else {
    signals.push(`${urgentOpen.length} urgent task${urgentOpen.length > 1 ? "s" : ""} require immediate attention`);
  }
  if (overduePayments.length === 0) {
    signals.push("Rent payments are up to date");
  } else {
    signals.push(`${overduePayments.length} payment${overduePayments.length > 1 ? "s are" : " is"} overdue`);
  }
  const lastCompleted = [...input.jobs]
    .filter((j) => j.status === "completed")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  if (lastCompleted) signals.push(`"${lastCompleted.title}" completed recently`);
  if (signals.length === 0) signals.push("No recent activity on this property");

  let recommendation: string;
  if (overduePayments.length > 0) {
    recommendation = "Follow up on overdue payments. Contact the tenant to arrange a payment plan.";
  } else if (urgentOpen.length > 0) {
    recommendation = `Address the ${urgentOpen.length > 1 ? `${urgentOpen.length} ` : ""}urgent open task${urgentOpen.length > 1 ? "s" : ""} as soon as possible.`;
  } else if (repeatedCats.length > 0) {
    const [topCat, topCount] = Object.entries(catCounts).sort(([, a], [, b]) => b - a)[0];
    recommendation = `Schedule a preventive ${topCat.replace(/_/g, " ")} inspection — this issue type has appeared ${topCount} times.`;
  } else if (openJobs.length > 3) {
    recommendation = "Clear the backlog of open tasks to keep the property in good shape.";
  } else {
    recommendation = "Property is healthy. Schedule a routine inspection to maintain current condition.";
  }

  return { score, label, summary, keyFactors, recentSignals: signals, recommendation };
}

// ── Style maps ───────────────────────────────────────────────────────────────

const sentimentText: Record<Sentiment, string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  neutral: "text-foreground",
  warning: "text-amber-600 dark:text-amber-400",
  bad: "text-red-600 dark:text-red-400",
};

const sentimentDot: Record<Sentiment, string> = {
  good: "bg-emerald-500",
  neutral: "bg-zinc-400",
  warning: "bg-amber-500",
  bad: "bg-red-500",
};

const labelBadge: Record<HealthLabel, string> = {
  Excellent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Good: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "Needs Attention": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "High Risk": "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const scoreColor: Record<HealthLabel, string> = {
  Excellent: "text-emerald-600 dark:text-emerald-400",
  Good: "text-blue-600 dark:text-blue-400",
  "Needs Attention": "text-amber-600 dark:text-amber-400",
  "High Risk": "text-red-600 dark:text-red-400",
};

// ── Component ────────────────────────────────────────────────────────────────

export function PropertyHealthCard({
  jobs,
  payments,
  occupancyStatus,
}: {
  jobs: HealthInput["jobs"];
  payments: HealthInput["payments"];
  occupancyStatus: string;
}) {
  const health = computePropertyHealth({ jobs, payments, occupancyStatus });
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4 border-t border-border pt-4">

      {/* ── Toggle row (always visible) ── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-md py-0.5 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Property Health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold tabular-nums ${scoreColor[health.label]}`}>
            {health.score}/100
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${labelBadge[health.label]}`}
          >
            {health.label}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* ── Collapsible details ── */}
      {isOpen && (
        <div className="mt-3 space-y-3">

          {/* Summary */}
          <p className="text-xs text-muted-foreground leading-relaxed">{health.summary}</p>

          {/* Key Factors */}
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Key Factors
            </p>
            <div className="space-y-1.5">
              {health.keyFactors.map((f) => (
                <div key={f.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${sentimentDot[f.sentiment]}`} />
                    <span className="text-xs text-muted-foreground">{f.label}</span>
                  </div>
                  <span className={`text-xs font-medium ${sentimentText[f.sentiment]}`}>
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Signals */}
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Recent Signals
            </p>
            <ul className="space-y-1">
              {health.recentSignals.map((signal, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                  {signal}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Next Step */}
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <p className="text-xs text-foreground leading-relaxed">{health.recommendation}</p>
          </div>

        </div>
      )}
    </div>
  );
}
