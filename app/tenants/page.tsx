import { AppShell } from '@/components/app-shell'
import { getTenantSummaries, type TenantSummaryRow } from '@/lib/views'
import { requireAppUser } from '@/lib/current-user'
import { TenantsClient } from './TenantsClient'

export const dynamic = 'force-dynamic'

export default async function TenantsPage() {
  const appUser = await requireAppUser()
  const tenants = await getTenantSummaries(appUser.id)
  return (
    <AppShell>
      <TenantsClient tenants={tenants} />
    </AppShell>
  )
}
