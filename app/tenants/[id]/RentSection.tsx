"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarClock,
  Receipt,
  Bell,
  BellOff,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { formatILS, formatDate } from "@/lib/format";

// ── Types ──────────────────────────────────────────────────────────────────────

type Schedule = {
  id: string;
  amount: number;
  dueDayOfMonth: number;
  startDate: string;
  active: boolean;
};

type Invoice = {
  id: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  paidDate: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** English ordinal suffix — correct for 1st/2nd/3rd/4th ... 11th/12th/13th ... 21st/22nd/23rd */
function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return `${n}th`;
  const last = n % 10;
  if (last === 1) return `${n}st`;
  if (last === 2) return `${n}nd`;
  if (last === 3) return `${n}rd`;
  return `${n}th`;
}

const STATUS: Record<Invoice["status"], { label: string; cls: string }> = {
  pending: {
    label: "Pending",
    cls: "bg-muted text-muted-foreground",
  },
  paid: {
    label: "Paid",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  overdue: {
    label: "Overdue",
    cls: "bg-destructive/10 text-destructive",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function RentSection({
  tenantId,
  schedules,
  invoices,
  hasOverdue,
  telegramLinked,
}: {
  tenantId: string;
  schedules: Schedule[];
  invoices: Invoice[];
  /** True when at least one invoice is status "overdue" */
  hasOverdue: boolean;
  /** True when tenant.telegramChatId is set */
  telegramLinked: boolean;
}) {
  const router = useRouter();

  // New-schedule form state
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(schedules.length === 0);

  // Per-row loading: stores the invoice id being mutated
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Reminder state
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function createSchedule(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    const res = await fetch("/api/rent/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        amount: Number(amount),
        dueDayOfMonth: Number(dueDay),
        startDate,
      }),
    });
    setCreating(false);
    if (res.ok) {
      setAmount("");
      setStartDate("");
      setDueDay("1");
      setShowAddForm(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setCreateError(data.error ?? "Failed to create schedule");
    }
  }

  async function togglePaid(id: string, paid: boolean) {
    setPendingId(id);
    const res = await fetch(`/api/rent/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: paid ? "paid" : "pending" }),
    });
    setPendingId(null);
    if (res.ok) router.refresh();
  }

  async function sendReminder() {
    setSendingReminder(true);
    setReminderMsg(null);
    const res = await fetch("/api/rent/remind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    });
    const data = await res.json().catch(() => ({}));
    setSendingReminder(false);
    if (!res.ok) {
      setReminderMsg("Failed to send reminder");
    } else if (data.sent) {
      setReminderMsg("✓ Reminder sent");
    } else {
      setReminderMsg(data.reason ?? "No overdue payments");
    }
    setTimeout(() => setReminderMsg(null), 4000);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Existing schedules ── */}
      {schedules.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Rent Schedule
          </p>
          <ul className="space-y-1.5">
            {schedules.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2.5 rounded-md border border-border bg-muted/30 px-3 py-2"
              >
                <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 min-w-0 text-sm text-foreground">
                  <span className="font-medium">{formatILS(s.amount)}</span>
                  <span className="text-muted-foreground">
                    {" "}· due on the {ordinal(s.dueDayOfMonth)} · from{" "}
                    {formatDate(new Date(s.startDate))}
                  </span>
                </span>
                <span
                  className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    s.active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.active ? "Active" : "Inactive"}
                </span>
              </li>
            ))}
          </ul>

          {/* Add another schedule — collapsed by default */}
          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              + Add another schedule
            </button>
          )}
        </div>
      )}

      {/* ── New-schedule form ── */}
      {showAddForm && (
        <form
          onSubmit={createSchedule}
          className="space-y-3 rounded-lg border border-border bg-muted/30 p-4"
        >
          <p className="text-xs text-muted-foreground">
            Sets up recurring monthly rent — payment rows are generated automatically and kept
            up to date by the nightly process.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Amount (₪)
              </label>
              <Input
                type="number"
                min="1"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5 500"
                className="h-9 text-[13px]"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Due day (1–28)
              </label>
              <Input
                type="number"
                min="1"
                max="28"
                required
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="h-9 text-[13px]"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Start date
              </label>
              <Input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-[13px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={creating} size="sm" className="h-9">
                {creating ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create schedule"
                )}
              </Button>
              {schedules.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9"
                  onClick={() => { setShowAddForm(false); setCreateError(null); }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
          {createError && (
            <p className="text-xs text-destructive">{createError}</p>
          )}
        </form>
      )}

      {/* ── Payment history ── */}
      <div>
        {/* Header: label + reminder button */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Payment History
          </p>
          <div className="flex items-center gap-2">
            {reminderMsg && (
              <span className="text-[11px] text-muted-foreground">{reminderMsg}</span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-[12px]"
              disabled={!hasOverdue || sendingReminder}
              title={
                !telegramLinked
                  ? "Tenant not linked to Telegram"
                  : !hasOverdue
                  ? "No overdue payments"
                  : "Send overdue reminder via Telegram"
              }
              onClick={sendReminder}
            >
              {sendingReminder ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : hasOverdue ? (
                <Bell className="h-3 w-3" />
              ) : (
                <BellOff className="h-3 w-3 opacity-40" />
              )}
              {!telegramLinked ? "Not linked" : "Send reminder"}
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border py-8 text-center">
            <Receipt className="mb-2 h-7 w-7 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">No invoices yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create a rent schedule above to generate monthly invoices
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {/* Table header */}
            <div className="grid grid-cols-[80px_1fr_110px_100px] gap-3 bg-muted/40 border-b border-border px-4 py-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Due date
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground text-right">
                Amount
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground text-right">
                Action
              </span>
            </div>

            {/* Invoice rows */}
            {invoices.map((inv, i) => (
              <div
                key={inv.id}
                className={[
                  "grid grid-cols-[80px_1fr_110px_100px] gap-3 items-center px-4 py-2.5 transition-colors hover:bg-muted/20",
                  inv.status === "overdue"
                    ? "border-l-2 border-destructive"
                    : "border-l-2 border-transparent",
                  i < invoices.length - 1 ? "border-b border-border" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {/* Status badge */}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium w-fit ${STATUS[inv.status].cls}`}
                >
                  {STATUS[inv.status].label}
                </span>

                {/* Due date + paid date */}
                <div>
                  <p className="text-[13px] text-foreground">
                    {formatDate(new Date(inv.dueDate))}
                  </p>
                  {inv.status === "paid" && inv.paidDate && (
                    <p className="text-[11px] text-muted-foreground">
                      Paid {formatDate(new Date(inv.paidDate))}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <p className="text-[13px] font-semibold tabular-nums text-foreground text-right">
                  {formatILS(inv.amount)}
                </p>

                {/* Action */}
                <div className="flex justify-end">
                  {inv.status === "paid" ? (
                    <button
                      onClick={() => togglePaid(inv.id, false)}
                      disabled={pendingId === inv.id}
                      className="text-[11px] text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50 transition-colors"
                    >
                      {pendingId === inv.id ? (
                        <Loader2 className="inline mr-1 h-3 w-3 animate-spin" />
                      ) : null}
                      Undo
                    </button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-6 px-2 text-[11px] gap-1 ${
                        inv.status === "overdue"
                          ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950"
                          : ""
                      }`}
                      onClick={() => togglePaid(inv.id, true)}
                      disabled={pendingId === inv.id}
                    >
                      {pendingId === inv.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      Mark paid
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
