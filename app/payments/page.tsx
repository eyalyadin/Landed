import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/app-shell'
import { PaymentsClient, type PaymentRow, type TenantRow } from './PaymentsClient'
import { AddPaymentButton } from './AddPaymentButton'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const [payments, occupiedProps, tenants] = await Promise.all([
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
    prisma.tenant.findMany({
      orderBy: { name: 'asc' },
      include: {
        property: { select: { address: true, city: true } },
        rentSchedules: {
          where: { active: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    }),
  ])

  const expectedMonthly = occupiedProps.reduce((sum, p) => sum + Number(p.monthlyRent), 0)

  const serialized: PaymentRow[] = payments.map(p => ({
    id: p.id,
    tenantId: p.tenantId,
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

  const serializedTenants: TenantRow[] = tenants.map(t => ({
    id: t.id,
    name: t.name,
    propertyAddress: t.property?.address ?? '',
    propertyCity: t.property?.city ?? '',
    schedule: t.rentSchedules[0]
      ? {
          amount: Number(t.rentSchedules[0].amount),
          dueDayOfMonth: t.rentSchedules[0].dueDayOfMonth,
          startDate: t.rentSchedules[0].startDate.toISOString(),
          endDate: t.rentSchedules[0].endDate
            ? t.rentSchedules[0].endDate.toISOString()
            : null,
        }
      : null,
  }))

  return (
    <AppShell pageTitle="Payments" pageAction={<AddPaymentButton />}>
      <PaymentsClient
        payments={serialized}
        expectedMonthly={expectedMonthly}
        tenants={serializedTenants}
      />
    </AppShell>
  )
}
