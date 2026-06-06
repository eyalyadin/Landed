'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TenantSummaryRow } from '@/lib/views'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Phone,
  Building2,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react'


// ─── TenantsClient ────────────────────────────────────────────────────────────

export function TenantsClient({ tenants }: { tenants: TenantSummaryRow[] }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = tenants.filter(t => {
    const q = searchQuery.toLowerCase()
    return !q ||
      t.name.toLowerCase().includes(q) ||
      (t.email?.toLowerCase().includes(q) ?? false) ||
      (t.phone?.includes(q) ?? false) ||
      (t.property_address?.toLowerCase().includes(q) ?? false)
  })

  const activeCount = tenants.length   // all rows = active in this model
  const linkedCount = tenants.filter(t => t.telegramChatId !== null).length
  const unreadCount = tenants.reduce((s, t) => s + (t.unreadCount ?? 0), 0)

  function getBotUsername(t: TenantSummaryRow): string | null {
    // inviteLink is built from TELEGRAM_BOT_USERNAME env on the server;
    // we reconstruct it client-side from linkToken if we know the pattern.
    // For display, rely on the link returned from POST /api/tenants.
    // Here we just show linkToken status.
    return t.telegramChatId ? null : t.linkToken
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Tenants</h1>
        <p className="text-muted-foreground">Manage your tenant relationships</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Linked to Telegram</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{linkedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unread Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{unreadCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone…"
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Telegram</TableHead>
                <TableHead>Unread</TableHead>
                <TableHead>Lease End</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    No tenants found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => {
                  const linked = t.telegramChatId !== null
                  const linkToken = getBotUsername(t)
                  const address = [t.property_address, t.property_unit_label]
                    .filter(Boolean).join(' ')

                  return (
                    <TableRow
                      key={t.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/tenants/${t.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {t.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div dir="auto" className="font-medium">{t.name}</div>
                            {t.email && <div className="text-sm text-muted-foreground">{t.email}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {address ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm">{address}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {linked ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                            Linked ✓
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-zinc-100 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400">
                              Not linked
                            </Badge>
                            {linkToken && (
                              <span
                                className="text-xs text-muted-foreground"
                                title={`Link token: ${linkToken}`}
                              >
                                (has token)
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {(t.unreadCount ?? 0) > 0 ? (
                          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-medium">
                            {t.unreadCount}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {t.leaseEndDate ? (
                          <span className="text-sm text-muted-foreground">
                            {new Date(t.leaseEndDate).toLocaleDateString('en-GB')}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/tenants/${t.id}`) }}>
                              View Thread
                            </DropdownMenuItem>
                            {t.phone && (
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${t.phone}` }}
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); router.push('/messages') }}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Messages
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
