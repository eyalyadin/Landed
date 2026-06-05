'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { UrgencyBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/data'
import {
  Search,
  Send,
  Building2,
  MessageSquare,
  Info,
  Lightbulb,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  ExternalLink,
} from 'lucide-react'

// ─── API shapes ──────────────────────────────────────────────────────────────

type Thread = {
  id: number
  tenantId: number
  tenantName: string
  tenantPhone: string | null
  propertyId: number | null
  propertyAddress: string | null
  propertyUnitLabel: string | null
  unreadCount: number
  lastMessageAt: string | null
  lastMessagePreview: string | null
  status: 'open' | 'resolved'
  urgency: 'normal' | 'urgent'
  summary: string | null
  suggestedNextAction: string | null
  linked: boolean
  inviteLink: string | null
}

type Message = {
  id: number
  threadId: number
  tenantId: number
  direction: 'inbound' | 'outbound'
  body: string
  detectedLanguage: string | null
  isInternalNote: boolean
  createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      title="Copy invite link"
      className={cn('text-muted-foreground hover:text-foreground transition-colors', className)}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

// ─── ConversationRow ─────────────────────────────────────────────────────────

function ConversationRow({
  thread,
  isSelected,
  onClick,
}: {
  thread: Thread
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-2.5 rounded-md transition-colors',
        isSelected ? 'bg-accent' : 'hover:bg-muted/50',
        thread.unreadCount > 0 && !isSelected && 'bg-primary/5',
      )}
    >
      <div className="flex items-start gap-2.5">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
            {initials(thread.tenantName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={cn(
              'text-[13px] text-foreground truncate',
              thread.unreadCount > 0 && 'font-semibold',
            )}>
              {thread.tenantName}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {thread.lastMessageAt ? formatRelativeTime(thread.lastMessageAt) : ''}
            </span>
          </div>
          {thread.propertyAddress && (
            <p className="text-xs text-muted-foreground truncate mb-0.5">
              {[thread.propertyAddress, thread.propertyUnitLabel].filter(Boolean).join(' ')}
            </p>
          )}
          {thread.lastMessagePreview && (
            <p dir="auto" className={cn(
              'text-xs truncate',
              thread.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground',
            )}>
              {thread.lastMessagePreview}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5">
            <UrgencyBadge urgency={thread.urgency} unreadCount={thread.unreadCount} />
            {!thread.linked && (
              <span className="text-[10px] text-zinc-400">Not linked</span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === 'outbound'
  return (
    <div className={cn('flex gap-2.5', isOutbound && 'justify-end')}>
      {!isOutbound && (
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">T</AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        'max-w-[75%] rounded-lg px-3 py-2',
        isOutbound ? 'bg-foreground text-background' : 'bg-muted',
      )}>
        <p dir="auto" className="text-[13px] whitespace-pre-wrap break-words">{message.body}</p>
        <p className={cn(
          'text-[10px] mt-1',
          isOutbound ? 'text-background/60' : 'text-muted-foreground',
        )}>
          {formatRelativeTime(message.createdAt)}
        </p>
      </div>
      {isOutbound && (
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="bg-foreground text-background text-[10px]">You</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

// ─── ContextPanel ─────────────────────────────────────────────────────────────

function ContextPanel({ thread }: { thread: Thread }) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h2 className="text-[13px] font-medium text-foreground">Conversation Details</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Tenant */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Tenant</h3>
            <p className="text-[13px] font-medium text-foreground">{thread.tenantName}</p>
            {thread.tenantPhone && (
              <p className="text-xs text-muted-foreground mt-0.5">{thread.tenantPhone}</p>
            )}
          </div>

          {(thread.propertyAddress || thread.propertyUnitLabel) && (
            <>
              <div className="h-px bg-border" />
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Property
                </h3>
                <p className="text-xs text-foreground">
                  {[thread.propertyAddress, thread.propertyUnitLabel].filter(Boolean).join(' ')}
                </p>
              </div>
            </>
          )}

          {/* Telegram link status */}
          <div className="h-px bg-border" />
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Telegram</h3>
            {thread.linked ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Linked ✓</span>
            ) : (
              <div className="space-y-2">
                <span className="text-xs text-zinc-400">Not linked yet</span>
                {thread.inviteLink ? (
                  <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1.5 min-w-0">
                    <a
                      href={thread.inviteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline truncate flex-1 min-w-0"
                    >
                      {thread.inviteLink}
                    </a>
                    <CopyButton text={thread.inviteLink} className="shrink-0" />
                    <a
                      href={thread.inviteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Set <code className="text-[10px]">TELEGRAM_BOT_USERNAME</code> in Railway to generate the invite link.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* AI summary */}
          {thread.summary && (
            <>
              <div className="h-px bg-border" />
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Summary
                </h3>
                <p className="text-xs text-foreground">{thread.summary}</p>
              </div>
            </>
          )}

          {/* Suggested next action */}
          {thread.suggestedNextAction && (
            <>
              <div className="h-px bg-border" />
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Suggested Action
                </h3>
                <p className="text-xs text-foreground">{thread.suggestedNextAction}</p>
              </div>
            </>
          )}

          {/* Full thread link */}
          <div className="h-px bg-border" />
          <Link
            href={`/tenants/${thread.tenantId}`}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Open full profile (maintenance + rent)
          </Link>
        </div>
      </ScrollArea>
    </div>
  )
}

// ─── ReplyArea ────────────────────────────────────────────────────────────────

function ReplyArea({
  thread,
  onSent,
}: {
  thread: Thread
  onSent: () => void
}) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function suggest() {
    setSuggesting(true)
    setError(null)
    const res = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: thread.tenantId }),
    })
    setSuggesting(false)
    if (res.ok) {
      const data = await res.json()
      setBody(data.suggestion ?? '')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Suggestion failed')
    }
  }

  async function send() {
    if (!body.trim()) return
    setSending(true)
    setError(null)
    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: thread.tenantId, body }),
    })
    setSending(false)
    if (res.ok) {
      setBody('')
      onSent()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to send')
    }
  }

  if (!thread.linked) {
    return (
      <div className="p-3 border-t border-border bg-card">
        <div className="max-w-2xl mx-auto rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-3 text-center text-xs text-zinc-500 space-y-1.5">
          <p>This tenant hasn&apos;t linked Telegram yet — sending is disabled.</p>
          {thread.inviteLink && (
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-muted-foreground">Invite link:</span>
              <a
                href={thread.inviteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate max-w-[220px]"
              >
                {thread.inviteLink}
              </a>
              <CopyButton text={thread.inviteLink} />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 border-t border-border bg-card">
      <div className="max-w-2xl mx-auto space-y-2">
        <Textarea
          dir="auto"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          className="min-h-[60px] max-h-28 bg-background text-[13px] resize-none"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send()
          }}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={suggest}
            disabled={suggesting || sending}
          >
            {suggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lightbulb className="h-3.5 w-3.5" />}
            {suggesting ? 'Thinking…' : 'Suggest reply (AI)'}
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5"
            onClick={send}
            disabled={sending || suggesting || !body.trim()}
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileThread, setShowMobileThread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ── Load thread list ───────────────────────────────────────────────────────
  const loadThreads = useCallback(async () => {
    const res = await fetch('/api/threads')
    if (res.ok) {
      const data: Thread[] = await res.json()
      setThreads(data)
      // Auto-select first thread with unread messages, or just the first
      setSelectedId(prev => {
        if (prev !== null) return prev
        const first = data.find(t => t.unreadCount > 0) ?? data[0]
        return first?.id ?? null
      })
    }
    setLoadingThreads(false)
  }, [])

  useEffect(() => { loadThreads() }, [loadThreads])

  // ── Load messages for selected thread ─────────────────────────────────────
  const loadMessages = useCallback(async (threadId: number) => {
    setLoadingMessages(true)
    const res = await fetch(`/api/threads/${threadId}`)
    if (res.ok) {
      const data: Message[] = await res.json()
      setMessages(data)
      // Also clear unread count in the local thread list
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, unreadCount: 0 } : t))
    }
    setLoadingMessages(false)
  }, [])

  useEffect(() => {
    if (selectedId !== null) loadMessages(selectedId)
  }, [selectedId, loadMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectedThread = threads.find(t => t.id === selectedId) ?? null

  // ── Filters ───────────────────────────────────────────────────────────────
  const filteredThreads = threads.filter(t => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q ||
      t.tenantName.toLowerCase().includes(q) ||
      (t.propertyAddress?.toLowerCase().includes(q) ?? false) ||
      (t.lastMessagePreview?.toLowerCase().includes(q) ?? false)
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unread' && t.unreadCount > 0) ||
      (filter === 'urgent' && t.urgency === 'urgent')
    return matchesSearch && matchesFilter
  })

  const unreadCount = threads.filter(t => t.unreadCount > 0).length
  const urgentCount = threads.filter(t => t.urgency === 'urgent').length

  return (
    <AppShell pageTitle="Messages">
      <div className="h-[calc(100vh-3.5rem)] flex">

        {/* ── Conversation list ──────────────────────────────────────────── */}
        <div className={cn(
          'w-full lg:w-72 xl:w-80 border-r border-border flex flex-col bg-card',
          showMobileThread && 'hidden lg:flex',
        )}>
          {/* Filters */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search conversations…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-[13px] bg-background"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'unread', 'urgent'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded-md transition-colors',
                    filter === f ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {f === 'all' && 'All'}
                  {f === 'unread' && `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                  {f === 'urgent' && `Urgent${urgentCount > 0 ? ` (${urgentCount})` : ''}`}
                </button>
              ))}
            </div>
          </div>

          {/* Thread list */}
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-0.5">
              {loadingThreads ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredThreads.length > 0 ? (
                filteredThreads.map(thread => (
                  <ConversationRow
                    key={thread.id}
                    thread={thread}
                    isSelected={thread.id === selectedId}
                    onClick={() => {
                      setSelectedId(thread.id)
                      setShowMobileThread(true)
                    }}
                  />
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-muted-foreground">No conversations found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ── Message thread ─────────────────────────────────────────────── */}
        <div className={cn(
          'flex-1 flex flex-col bg-background',
          !showMobileThread && 'hidden lg:flex',
        )}>
          {selectedThread ? (
            <>
              {/* Thread header */}
              <div className="p-3 border-b border-border flex items-center gap-2.5 bg-card">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-8 w-8"
                  onClick={() => setShowMobileThread(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {initials(selectedThread.tenantName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[13px] font-medium text-foreground">{selectedThread.tenantName}</h2>
                  {(selectedThread.propertyAddress || selectedThread.propertyUnitLabel) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {[selectedThread.propertyAddress, selectedThread.propertyUnitLabel].filter(Boolean).join(' ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <UrgencyBadge urgency={selectedThread.urgency} />
                </div>
                {/* Mobile context panel button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="xl:hidden h-8 w-8">
                      <Info className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72 p-0">
                    <ContextPanel thread={selectedThread} />
                  </SheetContent>
                </Sheet>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">No messages yet</p>
                ) : (
                  <div className="space-y-3 max-w-2xl mx-auto">
                    {messages.map(m => (
                      <MessageBubble key={m.id} message={m} />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Reply area */}
              <ReplyArea
                thread={selectedThread}
                onSent={() => loadMessages(selectedThread.id)}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-[13px] font-medium text-foreground mb-1">Select a conversation</h3>
                <p className="text-xs text-muted-foreground">
                  Choose a conversation from the list to view messages
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Context panel — desktop ─────────────────────────────────────── */}
        {selectedThread && (
          <div className="hidden xl:block w-72 border-l border-border bg-card">
            <ContextPanel thread={selectedThread} />
          </div>
        )}
      </div>
    </AppShell>
  )
}
