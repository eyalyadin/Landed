import { prisma } from '@/lib/prisma'
import { requireAppUser } from '@/lib/current-user'
import { AppShell } from '@/components/app-shell'
import { PropertiesClient, type PropertyItem } from './PropertiesClient'
import { AddPropertyButton } from './AddPropertyButton'

export const dynamic = 'force-dynamic'

export default async function PropertiesPage() {
  const appUser = await requireAppUser()
  const properties = await prisma.property.findMany({
    where: { ownerId: appUser.id },
    orderBy: { address: 'asc' },
    include: {
      tenants: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          leaseEndDate: true,
          thread: { select: { unreadCount: true } },
        },
      },
      payments: {
        where: { status: 'overdue', type: 'rent' },
        select: { amount: true },
      },
    },
  })

  const serialized: PropertyItem[] = properties.map(p => ({
    id: p.id,
    address: p.address,
    city: p.city,
    propertyType: p.propertyType as string,
    unitLabel: p.unitLabel,
    occupancyStatus: p.occupancyStatus as string,
    monthlyRent: Number(p.monthlyRent),
    rentCurrency: p.rentCurrency,
    tenant: p.tenants[0]
      ? {
          id: p.tenants[0].id,
          name: p.tenants[0].name,
          leaseEndDate: p.tenants[0].leaseEndDate?.toISOString() ?? null,
        }
      : null,
    overdueCount: p.payments.length,
    unreadMessageCount: p.tenants.reduce((sum, t) => sum + (t.thread?.unreadCount ?? 0), 0),
  }))

  return (
    <AppShell
      pageTitle="Properties"
      pageAction={<AddPropertyButton />}
    >
      <PropertiesClient properties={serialized} />
    </AppShell>
  )
}
