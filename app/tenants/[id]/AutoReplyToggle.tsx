"use client";

import { useState } from "react";
import { useI18n } from "@/app/i18n-context";

export default function AutoReplyToggle({
  tenantId,
  autoReply,
}: {
  tenantId: string;
  autoReply: boolean;
}) {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState(autoReply);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/tenants/${tenantId}/auto-reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoReply: !enabled }),
    });
    setBusy(false);
    if (res.ok) {
      setEnabled((prev) => !prev);
    } else {
      setError(t.thread.autoReplyError);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={busy}
        aria-pressed={enabled}
        className={`btn ${enabled ? "btn-primary" : ""}`}
        style={enabled ? { opacity: busy ? 0.6 : 1 } : { opacity: busy ? 0.6 : 1 }}
      >
        {enabled ? t.thread.autoReplyActive : t.thread.autoReplyEnable}
      </button>
      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
