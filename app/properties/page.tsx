import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { PropertiesClient, type PropertyItem } from './PropertiesClient'

export const dynamic = 'force-dynamic'

export default async function PropertiesPage() {
  const properties = await prisma.property.findMany({
    orderBy: { address: 'asc' },
    include: {
      tenants: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, name: true, leaseEndDate: true },
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
  }))

  return (
    <AppShell
      pageTitle="Properties"
      pageAction={
        <Button size="sm" className="h-8 text-[13px]">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Property
        </Button>
      }
    >
      <PropertiesClient properties={serialized} />
    </AppShell>
  )
}
