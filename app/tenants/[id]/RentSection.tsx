"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatILS, formatDate } from "@/lib/format";

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

const STATUS: Record<Invoice["status"], { label: string; pillCls: string }> = {
  pending: { label: "ממתין",  pillCls: "pixel-pill pixel-pill--pending" },
  paid:    { label: "שולם",   pillCls: "pixel-pill pixel-pill--paid"    },
  overdue: { label: "באיחור", pillCls: "pixel-pill pixel-pill--overdue" },
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
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "יצירת לוח נכשלה");
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
    <div className="space-y-4">
      {/* Existing schedules */}
      {schedules.length > 0 && (
        <ul className="pixel-card space-y-1 text-sm">
          {schedules.map((s) => (
            <li key={s.id} className="font-vt">
              {formatILS(s.amount)} · כל {s.dueDayOfMonth} בחודש · החל מ-{formatDate(new Date(s.startDate))}
            </li>
          ))}
        </ul>
      )}

      {/* New schedule form */}
      <form onSubmit={createSchedule} className="pixel-card">
        <p className="mb-3 text-xs font-bold text-muted">לוח תשלומים חדש</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted">סכום (₪)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pixel-input mt-1 w-32"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted">יום בחודש (1–28)</label>
            <input
              type="number"
              min="1"
              max="28"
              required
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              className="pixel-input mt-1 w-24"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted">תאריך התחלה</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pixel-input mt-1"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="pixel-btn pixel-btn-ink"
          >
            צור לוח + 12 חשבוניות
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm font-medium" style={{ color: "#DC2626" }}>
            {error}
          </p>
        )}
      </form>

      {/* Invoices */}
      {invoices.length === 0 ? (
        <p className="text-sm text-muted">אין חשבוניות עדיין</p>
      ) : (
        <ul className="pixel-card p-0">
          {invoices.map((inv, i) => (
            <li
              key={inv.id}
              className={`flex items-center justify-between gap-3 px-4 py-2.5 ${
                i > 0 ? "border-t-2 border-ink" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={STATUS[inv.status].pillCls}>
                  {STATUS[inv.status].label}
                </span>
                <span className="font-vt text-sm">{formatDate(new Date(inv.dueDate))}</span>
                <span className="font-vt text-sm font-bold">{formatILS(inv.amount)}</span>
              </div>
              {inv.status === "paid" ? (
                <button
                  onClick={() => setPaid(inv.id, false)}
                  disabled={busy}
                  className="pixel-btn text-xs"
                >
                  בטל תשלום
                </button>
              ) : (
                <button
                  onClick={() => setPaid(inv.id, true)}
                  disabled={busy}
                  className="pixel-btn pixel-btn-success text-xs"
                >
                  סמן כשולם
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
