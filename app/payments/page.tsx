import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/app-shell'
import { PaymentsClient, type PaymentRow } from './PaymentsClient'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const [payments, occupiedProps] = await Promise.all([
    prisma.payment.findMany({
      orderBy: [{ dueDate: 'desc' }],
      include: {
        property: { select: { address: true, city: true } },
        tenant: { select: { name: true } },
      },
    }),
    prisma.property.findMany({
      where: { occupancyStatus: 'occupied' },
      select: { monthlyRent: true },
    }),
  ])

  const expectedMonthly = occupiedProps.reduce((sum, p) => sum + Number(p.monthlyRent), 0)

  const serialized: PaymentRow[] = payments.map(p => ({
    id: p.id,
    propertyAddress: p.property.address,
    propertyCity: p.property.city,
    tenantName: p.tenant.name,
    amount: Number(p.amount),
    type: p.type as string,
    status: p.status as string,
    dueDate: p.dueDate.toISOString(),
    paidDate: p.paidDate ? p.paidDate.toISOString() : null,
    notes: p.notes ?? null,
  }))

  return (
    <AppShell pageTitle="Payments">
      <PaymentsClient payments={serialized} expectedMonthly={expectedMonthly} />
    </AppShell>
  )
}
