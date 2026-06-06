'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react'
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

export function PaymentsClient({ payments, expectedMonthly }: Props) {
  const overduePayments = payments.filter(p => p.status === 'overdue')
  const collectedPayments = payments.filter(p => p.status === 'paid' && p.type === 'rent')
  const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0)
  const collected = collectedPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="p-4 lg:p-5 space-y-5">

      {/* ── 3 stat tiles ── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
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
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/30">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground leading-none mb-0.5">
                  {formatCurrency(collected)}
                </p>
                <p className="text-xs text-muted-foreground">Collected Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground leading-none mb-0.5">
                  {formatCurrency(overdueAmount)}
                </p>
                <p className="text-xs text-muted-foreground">Overdue Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                    <p className="text-[13px] font-semibold text-foreground truncate">
                      {payment.propertyAddress}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {payment.propertyCity}
                    </p>
                  </div>
                  <div className="min-w-0 flex items-center">
                    <p className="text-[13px] text-foreground truncate">{payment.tenantName}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-[13px] font-semibold text-destructive tabular-nums">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-[13px] text-foreground tabular-nums">
                      {formatDate(payment.dueDate)}
                    </p>
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
                    <p className="text-[13px] font-semibold text-foreground truncate">
                      {payment.propertyAddress}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {payment.propertyCity}
                    </p>
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
