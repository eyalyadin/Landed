import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/app-shell'
import { SettingsClient } from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const landlord = await prisma.landlord.findFirst({ select: { name: true } })
  const landlordName = landlord?.name ?? 'Landlord'

  return (
    <AppShell>
      <div className="p-4 lg:p-6">
        <SettingsClient landlordName={landlordName} />
      </div>
    </AppShell>
  )
}
