"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS: { value: string; label: string }[] = [
  { value: "open", label: "פתוח" },
  { value: "in_progress", label: "בטיפול" },
  { value: "resolved", label: "טופל" },
];

export default function MaintenanceStatusSelect({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
  label?: string;
}) {
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
      className="pixel-input w-auto shrink-0 cursor-pointer"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
