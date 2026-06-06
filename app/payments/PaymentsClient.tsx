'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, CheckCircle, AlertTriangle, Clock, CalendarDays } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/data'

export type PaymentRow = {
  id: number
  propertyAddress: string
  propertyCity: string
  tenantName: string
  amount: number
  type: string
  status: string
  dueDate: string     // ISO date string
  paidDate: string | null
  notes: string | null
}

interface Props {
  payments: PaymentRow[]
  expectedMonthly: number
}

function daysFromNow(isoDate: string): number {
  const d = new Date(isoDate)
  d.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function daysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d ago`
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `${days}d`
}

export function PaymentsClient({ payments, expectedMonthly }: Props) {
  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const overduePayments = payments.filter(p => p.status === 'overdue')
  const collectedPayments = payments.filter(p => p.status === 'paid' && p.type === 'rent')
  const pendingRent = payments.filter(p => p.status === 'pending' && p.type === 'rent')
  const upcomingPayments = pendingRent
    .filter(p => new Date(p.dueDate) <= in30Days)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0)
  const collected = collectedPayments.reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = pendingRent.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="p-4 lg:p-5 space-y-5">

      {/* ── 4 stat tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

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
                <p className="text-xs text-muted-foreground">Collected</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                  {collectedPayments.length} payment{collectedPayments.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-50 dark:bg-amber-950/30">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground leading-none mb-0.5">
                  {formatCurrency(pendingAmount)}
                </p>
                <p className="text-xs text-muted-foreground">Pending Rent</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                  {pendingRent.length} invoice{pendingRent.length !== 1 ? 's' : ''}
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
                  {formatCurrency(overdueAmount)}
                </p>
                <p className="text-xs text-muted-foreground">Overdue</p>
                {overduePayments.length > 0 && (
                  <p className="text-[11px] text-destructive/80 mt-0.5">
                    {overduePayments.length} payment{overduePayments.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Upcoming Payments (due in next 30 days) ── */}
      {upcomingPayments.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800/40 shadow-none">
          <CardHeader className="px-5 py-4 border-b border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/10 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                <CalendarDays className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Upcoming Payments
              </CardTitle>
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-medium">
                {upcomingPayments.length}
              </span>
              <span className="ml-auto text-[11px] text-muted-foreground">Due within 30 days</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-[1fr_1fr_120px_110px_70px] gap-4 px-5 py-2.5 bg-muted/30 border-b border-border">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Property</span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Tenant</span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Amount</span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Due Date</span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">In</span>
            </div>
            {upcomingPayments.map((payment, i) => {
              const days = daysFromNow(payment.dueDate)
              const urgent = days <= 7
              return (
                <div
                  key={payment.id}
                  className={[
                    'grid grid-cols-[1fr_1fr_120px_110px_70px] gap-4 px-5 py-3.5 transition-colors hover:bg-amber-50/30 dark:hover:bg-amber-950/10',
                    urgent ? 'border-l-2 border-amber-500' : 'border-l-2 border-amber-200 dark:border-amber-800/40',
                    i < upcomingPayments.length - 1 ? 'border-b border-border' : '',
                  ].join(' ')}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{payment.propertyAddress}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{payment.propertyCity}</p>
                  </div>
                  <div className="min-w-0 flex items-center">
                    <p className="text-[13px] text-foreground truncate">{payment.tenantName}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-[13px] font-semibold text-foreground tabular-nums">{formatCurrency(payment.amount)}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-[13px] text-foreground tabular-nums">{formatDate(payment.dueDate)}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums ${urgent ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-muted text-muted-foreground'}`}>
                      {daysLabel(days)}
                    </span>
                  </div>
                </div>
              )
            })}
            {/* Footer total */}
            <div className="grid grid-cols-[1fr_1fr_120px_110px_70px] gap-4 px-5 py-3 bg-muted/30 border-t border-border rounded-b-lg">
              <span className="col-span-2 text-xs font-medium text-muted-foreground">
                {upcomingPayments.length} payment{upcomingPayments.length !== 1 ? 's' : ''} upcoming
              </span>
              <span className="text-[13px] font-bold text-foreground text-right tabular-nums">
                {formatCurrency(upcomingPayments.reduce((s, p) => s + p.amount, 0))}
              </span>
              <span /><span />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Overdue Payments table ── */}
      <Card className="border-border shadow-none">
        <CardHeader className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10">
              <span className="text-sm font-bold text-destructive leading-none">!</span>
            </div>
            <CardTitle className="text-sm font-semibold text-foreground">
              Overdue Payments
            </CardTitle>
            {overduePayments.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-destructive/10 text-destructive text-[11px] font-medium">
                {overduePayments.length}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {overduePayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-sm font-medium text-foreground">No overdue payments</p>
              <p className="text-xs text-muted-foreground mt-0.5">All tenants are up to date</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[1fr_1fr_120px_120px] gap-4 px-5 py-2.5 bg-muted/40 border-b border-border">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Property</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Tenant</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Amount Due</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Due Date</span>
              </div>
              {overduePayments.map((payment, i) => (
                <div
                  key={payment.id}
                  className={`grid grid-cols-[1fr_1fr_120px_120px] gap-4 px-5 py-3.5 border-l-2 border-destructive hover:bg-destructive/5 transition-colors ${i < overduePayments.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{payment.propertyAddress}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{payment.propertyCity}</p>
                  </div>
                  <div className="min-w-0 flex items-center">
                    <p className="text-[13px] text-foreground truncate">{payment.tenantName}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-[13px] font-semibold text-destructive tabular-nums">{formatCurrency(payment.amount)}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-[13px] text-foreground tabular-nums">{formatDate(payment.dueDate)}</p>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_1fr_120px_120px] gap-4 px-5 py-3 bg-muted/40 border-t border-border">
                <span className="col-span-2 text-xs font-medium text-muted-foreground">
                  {overduePayments.length} payment{overduePayments.length !== 1 ? 's' : ''} overdue
                </span>
                <span className="text-[13px] font-bold text-destructive text-right tabular-nums">
                  {formatCurrency(overdueAmount)}
                </span>
                <span />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Collected Payments table ── */}
      <Card className="border-border shadow-none">
        <CardHeader className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/30">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-sm font-semibold text-foreground">
              Collected Payments
            </CardTitle>
            {collectedPayments.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium">
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
              <div className="grid grid-cols-[1fr_1fr_120px_120px] gap-4 px-5 py-2.5 bg-muted/40 border-b border-border">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Property</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Tenant</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Amount</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Date Paid</span>
              </div>
              {collectedPayments.map((payment, i) => (
                <div
                  key={payment.id}
                  className={`grid grid-cols-[1fr_1fr_120px_120px] gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors ${i < collectedPayments.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{payment.propertyAddress}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{payment.propertyCity}</p>
                  </div>
                  <div className="min-w-0 flex items-center">
                    <p className="text-[13px] text-foreground truncate">{payment.tenantName}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-[13px] text-foreground tabular-nums">
                      {payment.paidDate ? formatDate(payment.paidDate) : '—'}
                    </p>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_1fr_120px_120px] gap-4 px-5 py-3 bg-muted/40 border-t border-border">
                <span className="col-span-2 text-xs font-medium text-muted-foreground">
                  {collectedPayments.length} payment{collectedPayments.length !== 1 ? 's' : ''} collected
                </span>
                <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums">
                  {formatCurrency(collected)}
                </span>
                <span />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
