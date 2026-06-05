'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { StatusBadge, UrgencyBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import {
  Search,
  Send,
  Plus,
  Building2,
  User,
  Calendar,
  CreditCard,
  FileText,
  Wrench,
  Phone,
  Mail,
  Info,
  Lightbulb,
  ArrowLeft,
} from 'lucide-react'
import {
  sampleMessageThreads,
  getPropertyById,
  getTenantById,
  getMessagesByThreadId,
  getTasksByPropertyId,
  formatDate,
  formatRelativeTime,
  formatCurrency,
  type MessageThread,
  type Message,
} from '@/lib/data'

function ConversationRow({ 
  thread, 
  isSelected, 
  onClick 
}: { 
  thread: MessageThread
  isSelected: boolean
  onClick: () => void 
}) {
  const tenant = getTenantById(thread.tenantId)
  const property = getPropertyById(thread.propertyId)

  if (!tenant || !property) return null

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-2.5 rounded-md transition-colors',
        isSelected ? 'bg-accent' : 'hover:bg-muted/50',
        thread.unreadCount > 0 && !isSelected && 'bg-primary/5'
      )}
    >
      <div className="flex items-start gap-2.5">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
            {tenant.fullName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={cn(
              'text-[13px] text-foreground truncate',
              thread.unreadCount > 0 && 'font-semibold'
            )}>
              {tenant.fullName}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatRelativeTime(thread.lastMessageAt)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mb-0.5">
            {property.address}
          </p>
          <p className={cn(
            'text-xs truncate',
            thread.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {thread.lastMessagePreview}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <UrgencyBadge urgency={thread.urgency} unreadCount={thread.unreadCount} />
          </div>
        </div>
      </div>
    </button>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isLandlord = message.senderType === 'landlord'

  return (
    <div className={cn('flex gap-2.5', isLandlord && 'justify-end')}>
      {!isLandlord && (
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
            {message.senderName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        'max-w-[75%] rounded-lg px-3 py-2',
        isLandlord ? 'bg-foreground text-background' : 'bg-muted'
      )}>
        <p className="text-[13px]">{message.body}</p>
        <p className={cn(
          'text-[10px] mt-1',
          isLandlord ? 'text-background/60' : 'text-muted-foreground'
        )}>
          {formatRelativeTime(message.createdAt)}
        </p>
      </div>
      {isLandlord && (
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="bg-foreground text-background text-[10px]">
            You
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

function ContextPanel({ thread }: { thread: MessageThread }) {
  const tenant = getTenantById(thread.tenantId)
  const property = getPropertyById(thread.propertyId)
  const tasks = property ? getTasksByPropertyId(property.id).filter(t => t.status !== 'completed') : []

  if (!tenant || !property) return null

  const suggestedReplies = [
    "Thanks for letting me know. I'll look into this right away.",
    "I've scheduled someone to take a look. They should be in touch soon.",
    "Could you provide more details about the issue?",
    "I'll follow up with you by end of day.",
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h2 className="text-[13px] font-medium text-foreground">Conversation Details</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Tenant Info */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Tenant
            </h3>
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-foreground">{tenant.fullName}</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  {tenant.phone}
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  {tenant.email}
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Property Info */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Property
            </h3>
            <Link
              href={`/properties/${property.id}`}
              className="text-xs text-foreground hover:underline"
            >
              {property.address}
            </Link>
            <p className="text-xs text-muted-foreground">{property.city}</p>
          </div>

          <div className="h-px bg-border" />

          {/* Lease Status */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Lease Status
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Contract</span>
                <StatusBadge status={tenant.contractStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Lease End</span>
                <span className="text-xs text-foreground">{formatDate(tenant.leaseEndDate)}</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Payment Status */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Payment Status
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Monthly Rent</span>
                <span className="text-xs font-medium text-foreground">{formatCurrency(property.monthlyRent)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <StatusBadge status={tenant.paymentStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Method</span>
                <span className="text-xs text-foreground">{tenant.paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Open Tasks */}
          {tasks.length > 0 && (
            <>
              <div className="h-px bg-border" />
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5" />
                  Open Tasks ({tasks.length})
                </h3>
                <div className="space-y-1.5">
                  {tasks.slice(0, 3).map(task => (
                    <div key={task.id} className="text-xs p-2 rounded-md bg-muted/50">
                      <p className="font-medium text-foreground truncate">{task.title}</p>
                      <p className="text-muted-foreground">Due {formatDate(task.dueDate)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* AI Summary */}
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

          {/* Suggested Next Action */}
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

          {/* Quick Replies */}
          <div className="h-px bg-border" />
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">
              Quick Replies
            </h3>
            <div className="space-y-1.5">
              {suggestedReplies.map((reply, index) => (
                <button
                  key={index}
                  className="w-full text-left text-xs p-2 rounded-md border border-border hover:bg-muted transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="h-px bg-border" />
          <div className="space-y-1.5">
            <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create Task from Message
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" asChild>
              <Link href={`/properties/${property.id}`}>
                <Building2 className="mr-1.5 h-3.5 w-3.5" />
                View Property
              </Link>
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export default function MessagesPage() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    sampleMessageThreads.find(t => t.unreadCount > 0)?.id || sampleMessageThreads[0]?.id || null
  )
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileThread, setShowMobileThread] = useState(false)

  const selectedThread = selectedThreadId 
    ? sampleMessageThreads.find(t => t.id === selectedThreadId) 
    : null
  const messages = selectedThreadId ? getMessagesByThreadId(selectedThreadId) : []
  const selectedTenant = selectedThread ? getTenantById(selectedThread.tenantId) : null

  // Filter threads
  const filteredThreads = sampleMessageThreads.filter(thread => {
    const tenant = getTenantById(thread.tenantId)
    const property = getPropertyById(thread.propertyId)
    
    const matchesSearch = !searchQuery || 
      tenant?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property?.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.lastMessagePreview.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = filter === 'all' ||
      (filter === 'unread' && thread.unreadCount > 0) ||
      (filter === 'urgent' && thread.urgency === 'urgent')

    return matchesSearch && matchesFilter
  })

  const unreadCount = sampleMessageThreads.filter(t => t.unreadCount > 0).length
  const urgentCount = sampleMessageThreads.filter(t => t.urgency === 'urgent').length

  return (
    <AppShell pageTitle="Messages">
      <div className="h-[calc(100vh-3.5rem)] flex">
        {/* Conversation List */}
        <div className={cn(
          'w-full lg:w-72 xl:w-80 border-r border-border flex flex-col bg-card',
          showMobileThread && 'hidden lg:flex'
        )}>
          {/* Filters */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-[13px] bg-background"
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-md transition-colors',
                  filter === 'all' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-md transition-colors',
                  filter === 'unread' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
              <button
                onClick={() => setFilter('urgent')}
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-md transition-colors',
                  filter === 'urgent' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Urgent {urgentCount > 0 && `(${urgentCount})`}
              </button>
            </div>
          </div>

          {/* Thread List */}
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-0.5">
              {filteredThreads.length > 0 ? (
                filteredThreads.map(thread => (
                  <ConversationRow
                    key={thread.id}
                    thread={thread}
                    isSelected={thread.id === selectedThreadId}
                    onClick={() => {
                      setSelectedThreadId(thread.id)
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

        {/* Message Thread */}
        <div className={cn(
          'flex-1 flex flex-col bg-background',
          !showMobileThread && 'hidden lg:flex'
        )}>
          {selectedThread && selectedTenant ? (
            <>
              {/* Thread Header */}
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
                    {selectedTenant.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[13px] font-medium text-foreground">{selectedTenant.fullName}</h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {getPropertyById(selectedThread.propertyId)?.address}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <UrgencyBadge urgency={selectedThread.urgency} />
                </div>
                {/* Mobile Context Button */}
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
                <div className="space-y-3 max-w-2xl mx-auto">
                  {messages.map(message => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </div>
              </ScrollArea>

              {/* Reply Input */}
              <div className="p-3 border-t border-border bg-card">
                <div className="flex gap-2 max-w-2xl mx-auto">
                  <Textarea
                    placeholder="Type a message..."
                    className="min-h-[36px] max-h-24 bg-background text-[13px] resize-none"
                    rows={1}
                  />
                  <Button size="icon" className="shrink-0 h-9 w-9">
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-[13px] font-medium text-foreground mb-1">Select a conversation</h3>
                <p className="text-xs text-muted-foreground">
                  Choose a conversation from the list to view messages
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Context Panel - Desktop */}
        {selectedThread && (
          <div className="hidden xl:block w-72 border-l border-border bg-card">
            <ContextPanel thread={selectedThread} />
          </div>
        )}
      </div>
    </AppShell>
  )
}
