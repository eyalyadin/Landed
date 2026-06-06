import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/app-shell'
import { CalendarClient, type CalendarEventRow, type PropertyOption } from './CalendarClient'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const [events, properties] = await Promise.all([
    prisma.calendarEvent.findMany({
      orderBy: { start: 'asc' },
      include: {
        property: { select: { id: true, address: true } },
        tenant: { select: { name: true } },
      },
    }),
    prisma.property.findMany({
      orderBy: { address: 'asc' },
      select: { id: true, address: true },
    }),
  ])

  const serializedEvents: CalendarEventRow[] = events.map(e => ({
    id: e.id,
    title: e.title,
    eventType: e.eventType as string,
    propertyId: e.property?.id ?? null,
    propertyAddress: e.property?.address ?? null,
    tenantName: e.tenant?.name ?? null,
    start: e.start.toISOString(),
    end: e.end ? e.end.toISOString() : null,
    notes: e.notes ?? null,
  }))

  const serializedProperties: PropertyOption[] = properties.map(p => ({
    id: p.id,
    address: p.address,
  }))

  return (
    <AppShell
      pageTitle="Calendar"
    >
      <CalendarClient events={serializedEvents} properties={serializedProperties} />
    </AppShell>
  )
}
