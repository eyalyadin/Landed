'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  tenantId: number
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

export type TenantRow = {
  id: number
  name: string
  propertyAddress: string
  propertyCity: string
  schedule: {
    amount: number
    dueDayOfMonth: number
    startDate: string  // ISO
    endDate: string | null
  } | null
}

type MergedRow = {
  key: string
  tenantId: number
  tenantName: string
  propertyAddress: string
  propertyCity: string
  status: string  // 'paid' | 'overdue' | 'pending' | 'unrecorded' | 'untracked'
  amount: number | null
  dueDate: string | null
  paidDate: string | null
  synthetic: boolean
}

interface Props {
  payments: PaymentRow[]
  expectedMonthly: number
  tenants: TenantRow[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const STATUS: Record<string, { label: string; cls: string }> = {
  paid:       { label: 'Paid',        cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  pending:    { label: 'Pending',     cls: 'bg-muted text-muted-foreground' },
  overdue:    { label: 'Overdue',     cls: 'bg-destructive/10 text-destructive' },
  unrecorded: { label: 'No record',   cls: 'bg-muted text-muted-foreground/60' },
  untracked:  { label: 'Not tracked', cls: 'bg-muted/50 text-muted-foreground/40' },
}

const URGENCY: Record<string, number> = {
  overdue:    0,
  unrecorded: 1,
  pending:    2,
  untracked:  3,
  paid:       4,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toMonthKey(isoDate: string): string {
  const d = new Date(isoDate)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PaymentsClient({ payments, expectedMonthly, tenants }: Props) {
  const now = new Date()
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [selectedMonth, setSelectedMonth] = useState(todayKey)
  const [sortBy, setSortBy] = useState<'status' | 'tenant' | 'property'>('status')
  const [lateOnly, setLateOnly] = useState(false)

  const [selYear, selMonthPad] = selectedMonth.split('-')

  // ── Available years ──
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    years.add(now.getFullYear())
    payments.forEach(p => {
      if (p.type === 'rent') years.add(new Date(p.dueDate).getUTCFullYear())
    })
    tenants.forEach(t => {
      if (t.schedule) years.add(new Date(t.schedule.startDate).getUTCFullYear())
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [payments, tenants]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Global stats (all-time) ──
  const overduePayments = payments.filter(p => p.status === 'overdue')
  const collectedPayments = payments.filter(p => p.status === 'paid' && p.type === 'rent')
  const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0)
  const collected = collectedPayments.reduce((sum, p) => sum + p.amount, 0)

  // ── Merge: one row per tenant for the selected month ──
  const allRows: MergedRow[] = useMemo(() => {
    const [yearNum, monthNum] = selectedMonth.split('-').map(Number)
    const monthStart = new Date(Date.UTC(yearNum, monthNum - 1, 1))
    const monthEnd   = new Date(Date.UTC(yearNum, monthNum, 0))      // last day UTC

    // Index rent payments for this month by tenantId (first match wins)
    const paymentByTenant = new Map<number, PaymentRow>()
    payments
      .filter(p => p.type === 'rent' && toMonthKey(p.dueDate) === selectedMonth)
      .forEach(p => {
        if (!paymentByTenant.has(p.tenantId)) paymentByTenant.set(p.tenantId, p)
      })

    return tenants.map(t => {
      const pay = paymentByTenant.get(t.id)

      // Case 1: real payment row exists
      if (pay) {
        return {
          key: String(pay.id),
          tenantId: t.id,
          tenantName: t.name,
          propertyAddress: t.propertyAddress || pay.propertyAddress,
          propertyCity:    t.propertyCity    || pay.propertyCity,
          status:   pay.status,
          amount:   pay.amount,
          dueDate:  pay.dueDate,
          paidDate: pay.paidDate,
          synthetic: false,
        }
      }

      // Case 2: no payment — check if an active schedule covers this month
      const sched = t.schedule
      if (sched) {
        const schedStart = new Date(sched.startDate)
        const schedEnd   = sched.endDate ? new Date(sched.endDate) : null
        const covers     = schedStart <= monthEnd && (schedEnd === null || schedEnd >= monthStart)
        if (covers) {
          const lastDay  = monthEnd.getUTCDate()
          const day      = Math.min(sched.dueDayOfMonth, lastDay)
          const dueDateISO = new Date(Date.UTC(yearNum, monthNum - 1, day)).toISOString()
          return {
            key:          `t-${t.id}`,
            tenantId:     t.id,
            tenantName:   t.name,
            propertyAddress: t.propertyAddress,
            propertyCity:    t.propertyCity,
            status:   'unrecorded',
            amount:   sched.amount,
            dueDate:  dueDateISO,
            paidDate: null,
            synthetic: true,
          }
        }
      }

      // Case 3: no payment and no covering schedule
      return {
        key:          `t-${t.id}`,
        tenantId:     t.id,
        tenantName:   t.name,
        propertyAddress: t.propertyAddress,
        propertyCity:    t.propertyCity,
        status:   'untracked',
        amount:   null,
        dueDate:  null,
        paidDate: null,
        synthetic: true,
      }
    })
  }, [payments, tenants, selectedMonth])

  // ── Per-month summary (always from full set, not filtered) ──
  const mpPaid       = allRows.filter(r => r.status === 'paid').length
  const mpOverdue    = allRows.filter(r => r.status === 'overdue').length
  const mpPending    = allRows.filter(r => r.status === 'pending').length
  const mpUnrecorded = allRows.filter(r => r.status === 'unrecorded').length
  const mpCollected  = allRows.filter(r => r.status === 'paid').reduce((s, r) => s + (r.amount ?? 0), 0)
  const mpExpected   = allRows.filter(r => ['paid', 'pending', 'overdue', 'unrecorded'].includes(r.status))
                              .reduce((s, r) => s + (r.amount ?? 0), 0)
  const mpWithRent   = allRows.filter(r => r.status !== 'untracked').length

  // ── Display rows (filtered + sorted) ──
  const displayRows = useMemo(() => {
    const rows = lateOnly ? allRows.filter(r => r.status === 'overdue') : allRows
    return [...rows].sort((a, b) => {
      if (sortBy === 'tenant')   return a.tenantName.localeCompare(b.tenantName)
      if (sortBy === 'property') {
        const diff = a.propertyAddress.localeCompare(b.propertyAddress)
        return diff !== 0 ? diff : a.tenantName.localeCompare(b.tenantName)
      }
      // default: status urgency
      const diff = (URGENCY[a.status] ?? 2) - (URGENCY[b.status] ?? 2)
      return diff !== 0 ? diff : a.tenantName.localeCompare(b.tenantName)
    })
  }, [allRows, lateOnly, sortBy])

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

      {/* ── Payments table ── */}
      <Card className="border-border shadow-none">
        <CardHeader className="px-5 py-4 border-b border-border space-y-3">

          {/* Row 1: title */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-semibold text-foreground">Payments</CardTitle>
          </div>

          {/* Row 2: controls */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Month/Year navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select
                value={selMonthPad}
                onValueChange={m => setSelectedMonth(`${selYear}-${m}`)}
              >
                <SelectTrigger className="h-8 w-[118px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(mo => (
                    <SelectItem key={mo.value} value={mo.value}>
                      {mo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selYear}
                onValueChange={y => setSelectedMonth(`${y}-${selMonthPad}`)}
              >
                <SelectTrigger className="h-8 w-[76px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(y => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-border" />

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground select-none">Sort</span>
              <Select
                value={sortBy}
                onValueChange={v => setSortBy(v as typeof sortBy)}
              >
                <SelectTrigger className="h-8 w-[130px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="tenant">Tenant name</SelectItem>
                  <SelectItem value="property">Property</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Late only toggle */}
            <Button
              variant={lateOnly ? 'destructive' : 'outline'}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setLateOnly(x => !x)}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Late only
              {lateOnly && mpOverdue > 0 && (
                <span className="ml-0.5 rounded-full bg-white/20 px-1.5 py-px text-[10px] tabular-nums">
                  {mpOverdue}
                </span>
              )}
            </Button>
          </div>

          {/* Row 3: summary chips */}
          {allRows.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {mpPaid > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{mpPaid}</span> paid
                  &nbsp;·&nbsp;
                  <span className="font-medium text-foreground">{formatCurrency(mpCollected)}</span>
                </span>
              )}
              {mpPending > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 inline-block" />
                  <span className="font-medium text-foreground">{mpPending}</span> pending
                </span>
              )}
              {mpOverdue > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-destructive">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" />
                  <span className="font-medium">{mpOverdue}</span> overdue
                </span>
              )}
              {mpUnrecorded > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 inline-block" />
                  <span className="font-medium text-foreground">{mpUnrecorded}</span> no record
                </span>
              )}
              {mpExpected > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  Expected:&nbsp;
                  <span className="font-medium text-foreground">{formatCurrency(mpExpected)}</span>
                </span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {displayRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground/30 mb-2" />
              {lateOnly ? (
                <>
                  <p className="text-sm font-medium text-foreground">No late tenants</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Everyone is on track for {MONTHS[Number(selMonthPad) - 1].label} {selYear}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">No tenants found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add tenants to start tracking payments
                  </p>
                </>
              )}
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-[1fr_1fr_100px_105px_105px_110px] gap-4 px-5 py-2.5 bg-muted/40 border-b border-border">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Tenant</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Property</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-center">Status</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Due Date</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Paid On</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Amount</span>
              </div>

              {displayRows.map((row, i) => {
                const s = STATUS[row.status] ?? STATUS.pending
                const isOverdue = row.status === 'overdue'
                const isPaid    = row.status === 'paid'
                return (
                  <div
                    key={row.key}
                    className={[
                      'grid grid-cols-[1fr_1fr_100px_105px_105px_110px] gap-4 px-5 py-3.5 transition-colors',
                      isOverdue
                        ? 'border-l-2 border-destructive hover:bg-destructive/5'
                        : 'border-l-2 border-transparent hover:bg-muted/20',
                      i < displayRows.length - 1 ? 'border-b border-border' : '',
                    ].join(' ')}
                  >
                    {/* Tenant */}
                    <div className="min-w-0 flex items-center">
                      <p className="text-[13px] font-semibold text-foreground truncate" dir="auto">
                        {row.tenantName}
                      </p>
                    </div>

                    {/* Property */}
                    <div className="min-w-0">
                      {row.propertyAddress ? (
                        <>
                          <p className="text-[13px] text-foreground truncate">{row.propertyAddress}</p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{row.propertyCity}</p>
                        </>
                      ) : (
                        <p className="text-[13px] text-muted-foreground/50 italic">No property</p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${s.cls}`}>
                        {s.label}
                      </span>
                    </div>

                    {/* Due date */}
                    <div className="flex items-center justify-end">
                      <p className={`text-[13px] tabular-nums ${row.dueDate ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                        {row.dueDate ? formatDate(row.dueDate) : '—'}
                      </p>
                    </div>

                    {/* Paid on */}
                    <div className="flex items-center justify-end">
                      <p className={`text-[13px] tabular-nums ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                        {row.paidDate ? formatDate(row.paidDate) : '—'}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-end">
                      <p className={`text-[13px] font-semibold tabular-nums ${
                        isPaid    ? 'text-emerald-600 dark:text-emerald-400' :
                        isOverdue ? 'text-destructive' :
                        row.amount !== null ? 'text-foreground' : 'text-muted-foreground/40'
                      }`}>
                        {row.amount !== null ? formatCurrency(row.amount) : '—'}
                      </p>
                    </div>
                  </div>
                )
              })}

              {/* Footer */}
              <div className="grid grid-cols-[1fr_1fr_100px_105px_105px_110px] gap-4 px-5 py-3 bg-muted/40 border-t border-border">
                <span className="col-span-5 text-xs font-medium text-muted-foreground">
                  {mpPaid} of {mpWithRent} tenant{mpWithRent !== 1 ? 's' : ''} paid rent
                  {mpWithRent < allRows.length && (
                    <span className="ml-1 text-muted-foreground/60">
                      · {allRows.length - mpWithRent} not tracked
                    </span>
                  )}
                </span>
                <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums">
                  {formatCurrency(mpCollected)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Overdue Payments (all-months reference) — shown when entries exist ── */}
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
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Days Late</span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide text-right">Amount</span>
            </div>
            {overduePayments.map((payment, i) => {
              const daysLate = Math.floor(
                (Date.now() - new Date(payment.dueDate).getTime()) / 86400000
              )
              return (
                <div
                  key={payment.id}
                  className={`grid grid-cols-[1fr_1fr_105px_105px_110px] gap-4 px-5 py-3.5 border-l-2 border-destructive hover:bg-destructive/5 transition-colors ${
                    i < overduePayments.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className="min-w-0 flex items-center">
                    <p className="text-[13px] font-semibold text-foreground truncate" dir="auto">
                      {payment.tenantName}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] text-foreground truncate">{payment.propertyAddress}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{payment.propertyCity}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-[13px] text-foreground tabular-nums">
                      {formatDate(payment.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive tabular-nums">
                      {daysLate}d late
                    </span>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-[13px] font-semibold text-destructive tabular-nums">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div className="grid grid-cols-[1fr_1fr_105px_105px_110px] gap-4 px-5 py-3 bg-muted/40 border-t border-border">
              <span className="col-span-4 text-xs font-medium text-muted-foreground">
                {overduePayments.length} payment{overduePayments.length !== 1 ? 's' : ''} overdue across all months
              </span>
              <span className="text-[13px] font-bold text-destructive text-right tabular-nums">
                {formatCurrency(overdueAmount)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
