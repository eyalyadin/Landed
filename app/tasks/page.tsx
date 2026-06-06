import { prisma } from '@/lib/prisma'
import { AppShell } from '@/components/app-shell'
import { TasksClient, type TaskRow } from './TasksClient'
import { AddTaskButton } from './AddTaskButton'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const jobs = await prisma.job.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      property: { select: { id: true, address: true } },
    },
  })

  const serialized: TaskRow[] = jobs.map(j => ({
    id: j.id,
    title: j.title,
    category: j.category as string,
    status: j.status as string,
    dueDate: j.dueDate ? j.dueDate.toISOString() : null,
    propertyId: j.propertyId,
    propertyAddress: j.property.address,
  }))

  return (
    <AppShell
      pageTitle="Tasks & Repairs"
      pageAction={<AddTaskButton />}
    >
      <TasksClient tasks={serialized} />
    </AppShell>
  )
}
