import { prisma } from '@/lib/prisma'
import { requireAppUser } from '@/lib/current-user'
import { AppShell } from '@/components/app-shell'
import { ContractsClient, type ContractRow, type PropertyOption } from './ContractsClient'
import { AddContractButton } from './AddContractButton'

export const dynamic = 'force-dynamic'

export default async function ContractsPage() {
  const appUser = await requireAppUser()
  const [documents, properties, docsWithFile] = await Promise.all([
    prisma.document.findMany({
      where: { property: { ownerId: appUser.id } },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        propertyId: true,
        documentName: true,
        documentType: true,
        uploadedAt: true,
        property: {
          select: {
            address: true,
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
      where: { ownerId: appUser.id },
      orderBy: { address: 'asc' },
      select: { id: true, address: true },
    }),
    prisma.$queryRaw<{ id: number }[]>`
      SELECT d.id
      FROM "Document" d
      JOIN "Property" p ON p.id = d."propertyId"
      WHERE d."fileData" IS NOT NULL AND p."ownerId" = ${appUser.id}
    `,
  ])

  const fileIdSet = new Set(docsWithFile.map((r: { id: number }) => r.id))

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
      hasFile: fileIdSet.has(d.id),
    }
  })

  const serializedProperties: PropertyOption[] = properties.map(p => ({
    id: p.id,
    address: p.address,
  }))

  return (
    <AppShell
      pageTitle="Contracts"
      pageAction={<AddContractButton />}
    >
      <ContractsClient contracts={serializedContracts} properties={serializedProperties} />
    </AppShell>
  )
}
