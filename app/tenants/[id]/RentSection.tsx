"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatILS, formatDate } from "@/lib/format";
import { useI18n } from "@/app/i18n-context";

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

const INVOICE_PILL: Record<Invoice["status"], string> = {
  pending: "pill pill--pending",
  paid:    "pill pill--paid",
  overdue: "pill pill--overdue",
};

export default function RentSection({
  tenantId,
  schedules,
  invoices,
}: {
  tenantId: string;
  schedules: Schedule[];
  invoices: Invoice[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createSchedule(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
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
    setBusy(false);
    if (res.ok) {
      setAmount("");
      setStartDate("");
      setDueDay("1");
      router.refresh();
    } else {
      setError(t.rent.createError);
    }
  }

  async function setPaid(id: string, paid: boolean) {
    setBusy(true);
    const res = await fetch(`/api/rent/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: paid ? "paid" : "pending" }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Existing schedules */}
      {schedules.length > 0 && (
        <ul
          className="rounded-lg border p-3 text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          {schedules.map((s) => (
            <li key={s.id} style={{ color: "var(--muted)" }}>
              {t.rent.scheduleSummary(
                formatILS(s.amount),
                s.dueDayOfMonth,
                formatDate(new Date(s.startDate)),
              )}
            </li>
          ))}
        </ul>
      )}

      {/* New schedule form */}
      <form onSubmit={createSchedule} className="card">
        <p className="mb-3 text-xs font-semibold" style={{ color: "var(--muted)" }}>
          {t.rent.newSchedule}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium" style={{ color: "var(--muted)" }}>
              {t.rent.amount}
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input mt-1 w-32"
            />
          </div>
          <div>
            <label className="block text-xs font-medium" style={{ color: "var(--muted)" }}>
              {t.rent.dueDay}
            </label>
            <input
              type="number"
              min="1"
              max="28"
              required
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              className="input mt-1 w-24"
            />
          </div>
          <div>
            <label className="block text-xs font-medium" style={{ color: "var(--muted)" }}>
              {t.rent.startDate}
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input mt-1"
            />
          </div>
          <button type="submit" disabled={busy} className="btn btn-primary">
            {t.rent.createBtn}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm font-medium" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
      </form>

      {/* Invoices */}
      {invoices.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.rent.noInvoices}
        </p>
      ) : (
        <ul className="card p-0 overflow-hidden">
          {invoices.map((inv, i) => (
            <li
              key={inv.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
              style={{
                borderTop: i > 0 ? "1px solid var(--border)" : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                <span className={INVOICE_PILL[inv.status]}>
                  {t.rent.status[inv.status]}
                </span>
                <span className="text-sm" style={{ color: "var(--text)" }}>
                  {formatDate(new Date(inv.dueDate))}
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  {formatILS(inv.amount)}
                </span>
              </div>
              {inv.status === "paid" ? (
                <button
                  onClick={() => setPaid(inv.id, false)}
                  disabled={busy}
                  className="btn btn-ghost text-xs"
                >
                  {t.rent.unmarkPaid}
                </button>
              ) : (
                <button
                  onClick={() => setPaid(inv.id, true)}
                  disabled={busy}
                  className="btn btn-success text-xs"
                >
                  {t.rent.markPaid}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
