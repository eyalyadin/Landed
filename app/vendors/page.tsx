import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/app-shell'
import { VendorsClient, type VendorRow } from './VendorsClient'

export const dynamic = 'force-dynamic'

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: [{ isPreferred: 'desc' }, { name: 'asc' }],
  })

  const serialized: VendorRow[] = vendors.map(v => ({
    id: v.id,
    name: v.name,
    phone: v.phone,
    email: v.email ?? null,
    category: v.category as string,
    serviceArea: v.serviceArea,
    contactPerson: v.contactPerson ?? null,
    rating: v.rating !== null ? Number(v.rating) : null,
    activeJobs: v.activeJobs,
    completedJobs: v.completedJobs,
    isPreferred: v.isPreferred,
    notes: v.notes ?? null,
  }))

  return (
    <AppShell pageTitle="Vendors">
      <div className="p-4 lg:p-5">
        <VendorsClient vendors={serialized} />
      </div>
    </AppShell>
  )
}
