import { AppShell } from '@/components/app-shell'
import { getTenantSummaries, type TenantSummaryRow } from '@/lib/views'
import { TenantsClient } from './TenantsClient'

export const dynamic = 'force-dynamic'

export default async function TenantsPage() {
  const tenants = await getTenantSummaries()
  return (
    <AppShell>
      <TenantsClient tenants={tenants} />
    </AppShell>
  )
}
