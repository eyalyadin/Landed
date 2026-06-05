"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/app/i18n-context";

export default function MaintenanceStatusSelect({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
  label?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function onChange(next: string) {
    const prev = value;
    setValue(next);
    setSaving(true);
    const res = await fetch(`/api/maintenance/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    if (res.ok) {
      router.refresh();
    } else {
      setValue(prev);
    }
  }

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(e) => onChange(e.target.value)}
      className="input w-auto shrink-0 cursor-pointer"
    >
      <option value="open">{t.maintenance.status.open}</option>
      <option value="in_progress">{t.maintenance.status.in_progress}</option>
      <option value="resolved">{t.maintenance.status.resolved}</option>
    </select>
  );
}
