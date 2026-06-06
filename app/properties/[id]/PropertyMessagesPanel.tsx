"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, Copy, Link2, Lightbulb, Loader2 } from "lucide-react";

type Msg = {
  id: number;
  direction: "inbound" | "outbound";
  body: string;
  createdAt: string;
};

interface Props {
  tenantId: number;
  threadId: number | null;
  tenantName: string;
  telegramLinked: boolean;
  inviteLink: string | null;
  initialMessages: Msg[];
}

export function PropertyMessagesPanel({
  tenantId,
  threadId,
  tenantName,
  telegramLinked,
  inviteLink,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send() {
    const text = body.trim();
    if (!text || !telegramLinked) return;
    setSending(true);
    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, body: text }),
    });
    if (res.ok) {
      setBody("");
      if (threadId) {
        const data = await fetch(`/api/threads/${threadId}`).then((r) =>
          r.json()
        );
        if (Array.isArray(data)) setMessages(data);
      }
    }
    setSending(false);
  }

  async function suggest() {
    setSuggesting(true);
    setSuggestError(null);
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
      setSuggestError(data.error ?? "Suggestion failed");
    }
  }

  function copyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Thread */}
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto space-y-2 rounded-lg border border-border bg-muted/20 p-3"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-[13px] ${
                  msg.direction === "outbound"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm border border-border bg-card"
                }`}
              >
                <p dir="auto" className="leading-relaxed">
                  {msg.body}
                </p>
                <p className="mt-0.5 text-right text-[10px] opacity-60">
                  {new Date(msg.createdAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply or invite */}
      {telegramLinked ? (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={`Message ${tenantName}…`}
              rows={2}
              className="flex-1 resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="flex flex-col gap-1.5 self-end shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={suggest}
                disabled={suggesting || sending}
                className="h-8 text-[12px] w-full"
              >
                {suggesting ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Thinking…
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-1 h-3 w-3" />
                    Suggest
                  </>
                )}
              </Button>
              <Button
                onClick={send}
                disabled={sending || !body.trim()}
                size="icon"
                className="h-8 w-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {suggestError && (
            <p className="text-xs text-destructive">{suggestError}</p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-[13px] text-muted-foreground">
              Telegram not linked — share the invite link to start messaging.
            </p>
          </div>
          {inviteLink && (
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded border border-border bg-card px-2 py-1.5 text-xs text-foreground">
                {inviteLink}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyLink}
                className="h-7 shrink-0 text-[12px]"
              >
                <Copy className="mr-1 h-3 w-3" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
