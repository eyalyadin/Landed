import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { ContractsClient, type ContractRow, type PropertyOption } from './ContractsClient'

export const dynamic = 'force-dynamic'

export default async function ContractsPage() {
  const [documents, properties] = await Promise.all([
    prisma.document.findMany({
      orderBy: { uploadedAt: 'desc' },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            unitLabel: true,
            tenants: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { name: true, leaseEndDate: true },
            },
          },
        },
      },
    }),
    prisma.property.findMany({
      orderBy: { address: 'asc' },
      select: { id: true, address: true },
    }),
  ])

  const serializedContracts: ContractRow[] = documents.map(d => {
    const tenant = d.property.tenants[0] ?? null
    return {
      id: d.id,
      documentName: d.documentName,
      documentType: d.documentType as string,
      propertyId: d.propertyId,
      propertyAddress: d.property.address,
      tenantName: tenant?.name ?? null,
      leaseEndDate: tenant?.leaseEndDate ? tenant.leaseEndDate.toISOString() : null,
      uploadedAt: d.uploadedAt.toISOString(),
    }
  })

  const serializedProperties: PropertyOption[] = properties.map(p => ({
    id: p.id,
    address: p.address,
  }))

  return (
    <AppShell
      pageTitle="Contracts"
      pageAction={
        <Button size="sm" className="h-8 text-[13px]">
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Upload Contract
        </Button>
      }
    >
      <ContractsClient contracts={serializedContracts} properties={serializedProperties} />
    </AppShell>
  )
}
