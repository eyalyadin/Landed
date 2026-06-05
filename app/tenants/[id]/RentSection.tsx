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

const STATUS: Record<Invoice["status"], { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  overdue: { label: "Overdue", cls: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
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
      setError(data.error ?? "Failed to create schedule");
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
        <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          {schedules.map((s) => (
            <li key={s.id}>
              {formatILS(s.amount)} · Every {s.dueDayOfMonth}{s.dueDayOfMonth === 1 ? "st" : s.dueDayOfMonth === 2 ? "nd" : s.dueDayOfMonth === 3 ? "rd" : "th"} of month · From {formatDate(new Date(s.startDate))}
            </li>
          ))}
        </ul>
      )}

      {/* New schedule form */}
      <form
        onSubmit={createSchedule}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950"
      >
        <div>
          <label className="block text-xs text-zinc-500">Amount (₪)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-32 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500">Day of month (1–28)</label>
          <input
            type="number"
            min="1"
            max="28"
            required
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            className="mt-1 w-24 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500">Start date</label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Create schedule + 12 invoices
        </button>
        {error && <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>}
      </form>

      {/* Invoices */}
      {invoices.length === 0 ? (
        <p className="text-sm text-zinc-400">No invoices yet</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-black/[.08] dark:divide-zinc-800 dark:border-white/[.145]">
          {invoices.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[inv.status].cls}`}>
                  {STATUS[inv.status].label}
                </span>
                <span className="text-sm">{formatDate(new Date(inv.dueDate))}</span>
                <span className="text-sm font-medium">{formatILS(inv.amount)}</span>
              </div>
              {inv.status === "paid" ? (
                <button
                  onClick={() => setPaid(inv.id, false)}
                  disabled={busy}
                  className="text-xs text-zinc-500 hover:underline disabled:opacity-50"
                >
                  Undo payment
                </button>
              ) : (
                <button
                  onClick={() => setPaid(inv.id, true)}
                  disabled={busy}
                  className="rounded-lg border border-emerald-300 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950"
                >
                  Mark as paid
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
