import { AppShell } from '@/components/app-shell'
import { requireAppUser } from '@/lib/current-user'
import { SettingsClient } from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const appUser = await requireAppUser()
  const landlordName = appUser.name ?? appUser.email

  return (
    <AppShell>
      <div className="p-4 lg:p-6">
        <SettingsClient landlordName={landlordName} />
      </div>
    </AppShell>
  )
}
