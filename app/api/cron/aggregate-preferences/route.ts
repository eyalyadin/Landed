// GET /api/cron/aggregate-preferences?secret=CRON_SECRET
//
// Reads recent SuggestionFeedback rows for each landlord, derives learned
// preferences, and upserts LandlordPreferences. Called nightly by Railway cron.
//
// Preference derivation (no ML — pure SQL + heuristics):
//   avgReplyLength   — average word count of used texts (accepted or edited finalText)
//   preferredLanguage — majority language detected in used texts via Hebrew char presence
//   preferredTone    — detected from word-length ratio; formal = longer avg sentence
//   editPatterns     — heuristics from comparing suggestedText vs finalText in "edited" rows

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const LOOK_BACK = 50; // analyse the most recent N feedback records per landlord

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasHebrew(text: string): boolean {
  return /[֐-׿]/.test(text);
}

function avgSentenceLength(text: string): number {
  const sentences = text.split(/[.!?؟]\s+/).filter((s) => s.trim().length > 2);
  if (sentences.length === 0) return countWords(text);
  return sentences.reduce((sum, s) => sum + countWords(s), 0) / sentences.length;
}

type FeedbackRow = {
  action: string;
  suggestedText: string;
  finalText: string | null;
};

function derivePreferences(rows: FeedbackRow[]) {
  const used = rows.map((r) =>
    r.action === "edited" && r.finalText ? r.finalText : r.suggestedText,
  );

  // ── avgReplyLength ────────────────────────────────────────────────────────
  const avgReplyLength =
    used.length > 0
      ? Math.round(used.reduce((s, t) => s + countWords(t), 0) / used.length)
      : 30;

  // ── preferredLanguage ─────────────────────────────────────────────────────
  const hebrewRatio = used.filter(hasHebrew).length / (used.length || 1);
  const preferredLanguage =
    hebrewRatio > 0.7 ? "he" : hebrewRatio < 0.3 ? "en" : "auto";

  // ── preferredTone ─────────────────────────────────────────────────────────
  // Heuristic: formal texts tend to have longer average sentence length (>12 words/sentence).
  const avgSentLen =
    used.length > 0
      ? used.reduce((s, t) => s + avgSentenceLength(t), 0) / used.length
      : 0;
  const preferredTone =
    avgSentLen >= 12 ? "formal" : avgSentLen <= 6 ? "casual" : "neutral";

  // ── editPatterns ──────────────────────────────────────────────────────────
  // Compare suggestedText vs finalText for "edited" rows to find habits.
  const editedRows = rows.filter((r) => r.action === "edited" && r.finalText);
  const patterns: string[] = [];

  if (editedRows.length >= 3) {
    const sugAvg =
      editedRows.reduce((s, r) => s + countWords(r.suggestedText), 0) / editedRows.length;
    const finAvg =
      editedRows.reduce((s, r) => s + countWords(r.finalText!), 0) / editedRows.length;

    if (finAvg < sugAvg * 0.75) patterns.push("prefers shorter replies");
    if (finAvg > sugAvg * 1.35) patterns.push("prefers more detailed replies");

    // Language switch: suggestion was Hebrew but edit was English (or vice-versa)
    const switchedToEn = editedRows.filter(
      (r) => hasHebrew(r.suggestedText) && !hasHebrew(r.finalText!),
    ).length;
    const switchedToHe = editedRows.filter(
      (r) => !hasHebrew(r.suggestedText) && hasHebrew(r.finalText!),
    ).length;
    if (switchedToEn / editedRows.length > 0.5) patterns.push("prefers English replies");
    if (switchedToHe / editedRows.length > 0.5) patterns.push("prefers Hebrew replies");
  }

  return { avgReplyLength, preferredLanguage, preferredTone, editPatterns: patterns };
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = req.nextUrl.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const landlords = await prisma.landlord.findMany({ select: { id: true } });
  const results: { landlordId: number; preferences: ReturnType<typeof derivePreferences> }[] = [];

  for (const { id: landlordId } of landlords) {
    const rows = await prisma.suggestionFeedback.findMany({
      where: {
        landlordId,
        action: { in: ["accepted", "edited"] },
      },
      orderBy: { createdAt: "desc" },
      take: LOOK_BACK,
      select: { action: true, suggestedText: true, finalText: true },
    });

    // Need at least 5 data points before overwriting defaults.
    if (rows.length < 5) continue;

    const prefs = derivePreferences(rows);
    results.push({ landlordId, preferences: prefs });

    await prisma.landlordPreferences.upsert({
      where:  { landlordId },
      create: { landlordId, ...prefs, editPatterns: prefs.editPatterns },
      update: {
        preferredTone:     prefs.preferredTone,
        preferredLanguage: prefs.preferredLanguage,
        avgReplyLength:    prefs.avgReplyLength,
        editPatterns:      prefs.editPatterns,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
  });
}
