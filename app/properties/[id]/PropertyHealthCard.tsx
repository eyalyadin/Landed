"use client";

import { useState } from "react";
import { Activity, ChevronDown, TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import type { PropertyHealthData, RiskLevel, Trend } from "@/lib/property-health";

// ── Style maps ────────────────────────────────────────────────────────────────

const scoreColor: Record<RiskLevel, string> = {
  excellent:        "text-emerald-600 dark:text-emerald-400",
  good:             "text-blue-600 dark:text-blue-400",
  needs_attention:  "text-amber-600 dark:text-amber-400",
  high_risk:        "text-red-600 dark:text-red-400",
};

const labelBadge: Record<RiskLevel, string> = {
  excellent:        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  good:             "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  needs_attention:  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  high_risk:        "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const labelDisplay: Record<RiskLevel, string> = {
  excellent:       "Excellent",
  good:            "Good",
  needs_attention: "Needs Attention",
  high_risk:       "High Risk",
};

const trendIcon: Record<Trend, React.ReactNode> = {
  improving: <TrendingUp  className="h-3 w-3 text-emerald-500" />,
  stable:    <Minus       className="h-3 w-3 text-zinc-400" />,
  declining: <TrendingDown className="h-3 w-3 text-red-500" />,
};

const trendColor: Record<Trend, string> = {
  improving: "text-emerald-600 dark:text-emerald-400",
  stable:    "text-muted-foreground",
  declining: "text-red-600 dark:text-red-400",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function PropertyHealthCard({ health }: { health: PropertyHealthData }) {
  const [isOpen, setIsOpen] = useState(false);

  const delta =
    health.previousScore !== null ? health.score - health.previousScore : null;

  return (
    <div className="mt-4 border-t border-border pt-4">

      {/* ── Toggle row (always visible) ── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-md py-0.5 hover:opacity-80 transition-opacity"
      >
        {/* Left: icon + label */}
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Property Health
          </p>
        </div>

        {/* Right: score + risk badge + trend + chevron */}
        <div className="flex items-center gap-2">
          {/* Trend indicator — only when we have a prior snapshot */}
          {health.trend && delta !== null && (
            <span className={`flex items-center gap-0.5 text-[11px] font-medium tabular-nums ${trendColor[health.trend]}`}>
              {trendIcon[health.trend]}
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
          <span className={`text-sm font-bold tabular-nums ${scoreColor[health.riskLevel]}`}>
            {health.score}/100
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${labelBadge[health.riskLevel]}`}>
            {labelDisplay[health.riskLevel]}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* ── Collapsible details ── */}
      {isOpen && (
        <div className="mt-3 space-y-3">

          {/* Trend context row */}
          {health.trend && health.snapshotAge && delta !== null && (
            <div className={`flex items-center gap-1.5 text-xs font-medium ${trendColor[health.trend]}`}>
              {trendIcon[health.trend]}
              <span className="capitalize">{health.trend}</span>
              <span className="text-muted-foreground font-normal">
                — {delta > 0 ? `+${delta}` : delta} pts vs. {health.snapshotAge}
              </span>
            </div>
          )}
          {!health.trend && (
            <p className="text-xs text-muted-foreground">First snapshot — trend will appear after the next daily check.</p>
          )}

          {/* Why this score */}
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Score Factors
            </p>
            <ul className="space-y-1">
              {health.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendation */}
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <p className="text-xs text-foreground leading-relaxed">
              {health.recommendation}
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
