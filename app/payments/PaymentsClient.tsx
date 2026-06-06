'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Receipt,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/data'

// ── Types ──────────────────────────────────────────────────────────────────────

export type PaymentRow = {
  id: number
  propertyAddress: string
  propertyCity: string
  tenantName: string
  amount: number
  type: string
  status: string
  dueDate: string      // ISO date string
  paidDate: string | null
  notes: string | null
}

interface Props {
  payments: PaymentRow[]
  expectedMonthly: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toMonthKey(isoDate: string): string {
  const d = new Date(isoDate)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthDisplay(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const STATUS: Record<string, { label: string; cls: string }> = {
  paid:    { label: 'Paid',    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  pending: { label: 'Pending', cls: 'bg-muted text-muted-foreground' },
  overdue: { label: 'Overdue', cls: 'bg-destructive/10 text-destructive' },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PaymentsClient({ payments, expectedMonthly }: Props) {
  const now = new Date()
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState(todayKey)

  // ── Global stats ──
  const overduePayments = payments.filter(p => p.status === 'overdue')
  const collectedPayments = payments.filter(p => p.status === 'paid' && p.type === 'rent')
  const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0)
  const collected = collectedPayments.reduce((sum, p) => sum + p.amount, 0)

  // ── Monthly rent roll ──
  const monthPayments = payments
    .filter(p => p.type === 'rent' && toMonthKey(p.dueDate) === selectedMonth)
    .sort((a, b) => {
      // Urgency-first: overdue → pending → paid, then alphabetical by tenant
      const urgency: Record<string, number> = { overdue: 0, pending: 1, paid: 2 }
      const diff = (urgency[a.status] ?? 1) - (urgency[b.status] ?? 1)
      return diff !== 0 ? diff : a.tenantName.localeCompare(b.tenantName)
    })

  const mpPaid    = monthPayments.filter(p => p.status === 'paid')
  const mpPending = monthPayments.filter(p => p.status === 'pending')
  const mpOverdue = monthPayments.filter(p => p.status === 'overdue')
  const mpCollected = mpPaid.reduce((s, p) => s + p.amount, 0)
  const mpExpected  = monthPayments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="p-4 lg:p-5 space-y-5">

      {/* ── 3 stat tiles ── */}
      <div className="grid grid-cols-3 gap-3">

        <Card className="border-border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground leading-none mb-0.5">
                  {formatCurrency(expectedMonthly)}
                </p>
                <p className="text-xs text-muted-foreground">Expected Monthly</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/30">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground leading-none mb-0.5">
                  {formatCurrency(collected)}
                </p>
                <p className="text-xs text-muted-foreground">Collected All-Time</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                  {collectedPayments.length} payment{collectedPayments.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-none ${overduePayments.length > 0 ? 'border-destructive/40' : 'border-border'}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className={`text-lg font-semibold leading-none mb-0.5 ${overduePayments.length > 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {overduePayments.length > 0 ? formatCurrency(overdueAmount) : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Overdue</p>
                {overduePayments.length > 0 ? (
                  <p className="text-[11px] text-destructive/80 mt-0.5">
                    {overduePayments.length} payment{overduePayments.length !== 1 ? 's' : ''}
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">All clear</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Monthly Rent Roll ── */}
      <Card className="border-border shadow-none">
        <CardHeader className="px-5 py-4 border-b border-border">

          {/* Title + month navigation */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Monthly Rent Roll
              </CardTitle>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[130px] text-center text-sm font-medium text-foreground select-none">
                {monthDisplay(selectedMonth)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Month summary */}
          {monthPayments.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{mpPaid.length}</span> paid
                &nbsp;·&nbsp;
                <span className="font-medium text-foreground">{formatCurrency(mpCollected)}</span> collected
              </span>
              {mpPending.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 inline-block" />
                  <span className="font-medium text-foreground">{mpPending.length}</span> pending
                </span>
              )}
              {mpOverdue.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-destructive">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" />
                  <span className="font-medium">{mpOverdue.length}</span> overdue
                </span>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                Expected:&nbsp;
                <span className="font-medium text-foreground">{formatCurrency(mpExpected)}</span>
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {monthPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium text-foreground">No rent due in {monthDisplay(selectedMonth)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                No rent payment records found for this month
              </p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-[1fr_1fr_90px_105px_105px_110px] gap-4 px-5 py-2.5 bg-muted/40 border-b border-border">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Tenant</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Property</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-center">Status</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Due Date</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Paid On</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Amount</span>
              </div>

              {monthPayments.map((payment, i) => {
                const s = STATUS[payment.status] ?? STATUS.pending
                const isOverdue = payment.status === 'overdue'
                const isPaid = payment.status === 'paid'
                return (
                  <div
                    key={payment.id}
                    className={[
                      'grid grid-cols-[1fr_1fr_90px_105px_105px_110px] gap-4 px-5 py-3.5 transition-colors',
                      isOverdue
                        ? 'border-l-2 border-destructive hover:bg-destructive/5'
                        : 'border-l-2 border-transparent hover:bg-muted/20',
                      i < monthPayments.length - 1 ? 'border-b border-border' : '',
                    ].join(' ')}
                  >
                    {/* Tenant */}
                    <div className="min-w-0 flex items-center">
                      <p className="text-[13px] font-semibold text-foreground truncate" dir="auto">
                        {payment.tenantName}
                      </p>
                    </div>

                    {/* Property */}
                    <div className="min-w-0">
                      <p className="text-[13px] text-foreground truncate">{payment.propertyAddress}</p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{payment.propertyCity}</p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${s.cls}`}>
                        {s.label}
                      </span>
                    </div>

                    {/* Due date */}
                    <div className="flex items-center justify-end">
                      <p className="text-[13px] text-foreground tabular-nums">
                        {formatDate(payment.dueDate)}
                      </p>
                    </div>

                    {/* Paid on */}
                    <div className="flex items-center justify-end">
                      <p className={`text-[13px] tabular-nums ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                        {payment.paidDate ? formatDate(payment.paidDate) : '—'}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-end">
                      <p className={`text-[13px] font-semibold tabular-nums ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                  </div>
                )
              })}

              {/* Footer totals */}
              <div className="grid grid-cols-[1fr_1fr_90px_105px_105px_110px] gap-4 px-5 py-3 bg-muted/40 border-t border-border">
                <span className="col-span-5 text-xs font-medium text-muted-foreground">
                  {mpPaid.length} of {monthPayments.length} tenant{monthPayments.length !== 1 ? 's' : ''} paid
                </span>
                <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums">
                  {formatCurrency(mpCollected)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Overdue Payments ── only shown when there are overdue entries */}
      {overduePayments.length > 0 && (
        <Card className="border-border shadow-none">
          <CardHeader className="px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10">
                <span className="text-sm font-bold text-destructive leading-none">!</span>
              </div>
              <CardTitle className="text-sm font-semibold text-foreground">Overdue Payments</CardTitle>
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-destructive/10 text-destructive text-[11px] font-medium">
                {overduePayments.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-[1fr_1fr_105px_105px_110px] gap-4 px-5 py-2.5 bg-muted/40 border-b border-border">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Tenant</span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Property</span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Due Date</span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Days Overdue</span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Amount</span>
            </div>
            {overduePayments.map((payment, i) => {
              const daysLate = Math.floor((Date.now() - new Date(payment.dueDate).getTime()) / 86400000)
              return (
                <div
                  key={payment.id}
                  className={`grid grid-cols-[1fr_1fr_105px_105px_110px] gap-4 px-5 py-3.5 border-l-2 border-destructive hover:bg-destructive/5 transition-colors ${i < overduePayments.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="min-w-0 flex items-center">
                    <p className="text-[13px] font-semibold text-foreground truncate" dir="auto">{payment.tenantName}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] text-foreground truncate">{payment.propertyAddress}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{payment.propertyCity}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-[13px] text-foreground tabular-nums">{formatDate(payment.dueDate)}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive tabular-nums">
                      {daysLate}d late
                    </span>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-[13px] font-semibold text-destructive tabular-nums">{formatCurrency(payment.amount)}</p>
                  </div>
                </div>
              )
            })}
            <div className="grid grid-cols-[1fr_1fr_105px_105px_110px] gap-4 px-5 py-3 bg-muted/40 border-t border-border">
              <span className="col-span-4 text-xs font-medium text-muted-foreground">
                {overduePayments.length} payment{overduePayments.length !== 1 ? 's' : ''} overdue
              </span>
              <span className="text-[13px] font-bold text-destructive text-right tabular-nums">
                {formatCurrency(overdueAmount)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Collected Payments — with due date ── */}
      <Card className="border-border shadow-none">
        <CardHeader className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/30">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-sm font-semibold text-foreground">Collected Payments</CardTitle>
            {collectedPayments.length > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium">
                {collectedPayments.length}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {collectedPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-muted-foreground">No collected payments yet</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[1fr_1fr_105px_105px_110px] gap-4 px-5 py-2.5 bg-muted/40 border-b border-border">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Tenant</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Property</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Due Date</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Date Paid</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Amount</span>
              </div>
              {collectedPayments.map((payment, i) => (
                <div
                  key={payment.id}
                  className={`grid grid-cols-[1fr_1fr_105px_105px_110px] gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors ${i < collectedPayments.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="min-w-0 flex items-center">
                    <p className="text-[13px] font-semibold text-foreground truncate" dir="auto">{payment.tenantName}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] text-foreground truncate">{payment.propertyAddress}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{payment.propertyCity}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-[13px] text-muted-foreground tabular-nums">{formatDate(payment.dueDate)}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-[13px] text-foreground tabular-nums">
                      {payment.paidDate ? formatDate(payment.paidDate) : '—'}
                    </p>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_1fr_105px_105px_110px] gap-4 px-5 py-3 bg-muted/40 border-t border-border">
                <span className="col-span-4 text-xs font-medium text-muted-foreground">
                  {collectedPayments.length} payment{collectedPayments.length !== 1 ? 's' : ''} collected
                </span>
                <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums">
                  {formatCurrency(collected)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
