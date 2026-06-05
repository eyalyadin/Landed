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
      <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700">
        השוכר עדיין לא קושר לטלגרם — אי אפשר לשלוח הודעה.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/[.08] bg-white p-3 dark:border-white/[.145] dark:bg-zinc-950">
      <textarea
        dir="auto"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="כתוב תשובה…"
        rows={3}
        className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
        }}
      />
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          onClick={suggest}
          disabled={suggesting || sending}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {suggesting ? "חושב…" : "הצעת תשובה (AI)"}
        </button>
        <button
          onClick={send}
          disabled={sending || suggesting || !body.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {sending ? "שולח…" : "שליחה"}
        </button>
      </div>
    </div>
  );
}
