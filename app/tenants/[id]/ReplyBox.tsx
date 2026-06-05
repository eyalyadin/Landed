"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReplyBox({
  tenantId,
  linked,
}: {
  tenantId: string;
  linked: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function suggest() {
    setSuggesting(true);
    setError(null);
    const res = await fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    });
    setSuggesting(false);
    if (res.ok) {
      const data = await res.json();
      setBody(data.suggestion ?? "");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "הצעה נכשלה / suggestion failed");
    }
  }

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, body }),
    });
    setSending(false);
    if (res.ok) {
      setBody("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "שליחה נכשלה / failed to send");
    }
  }

  if (!linked) {
    return (
      <div className="border-2 border-dashed border-ink bg-surface px-4 py-3 text-center text-sm text-muted">
        השוכר עדיין לא קושר לטלגרם — אי אפשר לשלוח הודעה.
      </div>
    );
  }

  return (
    <div className="pixel-card p-3">
      <textarea
        dir="auto"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="כתוב תשובה…"
        rows={3}
        className="pixel-input"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
        }}
      />
      {error && (
        <p className="mt-2 text-sm font-medium" style={{ color: "#DC2626" }}>
          {error}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          onClick={suggest}
          disabled={suggesting || sending}
          className="pixel-btn"
        >
          {suggesting ? "חושב…" : "הצעת תשובה (AI)"}
        </button>
        <button
          onClick={send}
          disabled={sending || suggesting || !body.trim()}
          className="pixel-btn pixel-btn-cta"
        >
          {sending ? "שולח…" : "שליחה"}
        </button>
      </div>
    </div>
  );
}
