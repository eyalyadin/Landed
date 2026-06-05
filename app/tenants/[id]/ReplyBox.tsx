"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/app/i18n-context";

export default function ReplyBox({
  tenantId,
  linked,
}: {
  tenantId: string;
  linked: boolean;
}) {
  const { t } = useI18n();
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
      setError(t.thread.suggestError);
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
      setError(t.thread.sendError);
    }
  }

  if (!linked) {
    return (
      <div
        className="rounded-lg border px-4 py-3 text-center text-sm"
        style={{
          borderColor: "var(--border)",
          borderStyle: "dashed",
          background: "var(--surface)",
          color: "var(--muted)",
        }}
      >
        {t.thread.notLinked}
      </div>
    );
  }

  return (
    <div className="card p-3">
      <textarea
        dir="auto"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t.thread.replyPlaceholder}
        rows={3}
        className="input"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
        }}
      />
      {error && (
        <p className="mt-2 text-sm font-medium" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          onClick={suggest}
          disabled={suggesting || sending}
          className="btn"
        >
          {suggesting ? t.thread.suggesting : t.thread.suggest}
        </button>
        <button
          onClick={send}
          disabled={sending || suggesting || !body.trim()}
          className="btn btn-primary"
        >
          {sending ? t.thread.sending : t.thread.send}
        </button>
      </div>
    </div>
  );
}
