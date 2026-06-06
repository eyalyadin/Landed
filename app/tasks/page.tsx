'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Building2, MoreHorizontal, Wrench } from 'lucide-react'
import {
  sampleTasks,
  getPropertyById,
  formatDate,
  type TaskCategory,
} from '@/lib/data'

function categoryLabel(cat: TaskCategory): string {
  switch (cat) {
    case 'repair': return 'Repair'
    case 'payment-followup': return 'Payment Follow-up'
    case 'contract-renewal': return 'Contract Renewal'
    case 'tenant-issue': return 'Tenant Issue'
    case 'inspection': return 'Inspection'
    case 'maintenance': return 'Maintenance'
    default: return cat
  }
}

export default function TasksPage() {
  const [tab, setTab] = useState<'todo' | 'past'>('todo')

  const todoTasks = sampleTasks.filter(t => t.status !== 'completed')
  const pastTasks = sampleTasks.filter(t => t.status === 'completed')
  const visibleTasks = tab === 'todo' ? todoTasks : pastTasks

  return (
    <AppShell
      pageTitle="Tasks & Repairs"
      pageAction={
        <Button size="sm" className="h-8 text-[13px]">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Task
        </Button>
      }
    >
      <div className="p-4 lg:p-5 space-y-4">

        {/* Header bar: task count left, tabs right */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            {todoTasks.length} task{todoTasks.length !== 1 ? 's' : ''} left
          </p>
          <div className="flex items-center gap-0.5 border border-border rounded-md p-0.5">
            <button
              onClick={() => setTab('todo')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                tab === 'todo'
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              To do
            </button>
            <button
              onClick={() => setTab('past')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                tab === 'past'
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Past
            </button>
          </div>
        </div>

        {/* Task table */}
        {visibleTasks.length === 0 ? (
          <Card className="border-border shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Wrench className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">
                {tab === 'todo' ? 'No tasks to do' : 'No past tasks'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border shadow-none overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr_40px] gap-4 px-5 py-2.5 bg-muted/40 border-b border-border">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Property</span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Description</span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Type</span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Due Date</span>
              <span />
            </div>

            {/* Rows */}
            {visibleTasks.map((task, i) => {
              const property = getPropertyById(task.propertyId)
              const isOverdue = tab === 'todo' && new Date(task.dueDate) < new Date()

              return (
                <div
                  key={task.id}
                  className={[
                    'grid grid-cols-[1.5fr_2fr_1fr_1fr_40px] gap-4 px-5 py-3.5 items-center hover:bg-muted/40 transition-colors',
                    isOverdue ? 'border-l-2 border-destructive' : 'border-l-2 border-transparent',
                    i < visibleTasks.length - 1 ? 'border-b border-border' : '',
                  ].join(' ')}
                >
                  {/* Property */}
                  <div className="min-w-0">
                    {property ? (
                      <Link
                        href={`/properties/${property.id}`}
                        className="flex items-center gap-1.5 text-[13px] font-medium text-foreground hover:underline min-w-0"
                      >
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{property.address}</span>
                      </Link>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-[13px] text-foreground truncate">{task.title}</p>

                  {/* Type */}
                  <p className="text-[13px] text-muted-foreground">{categoryLabel(task.category)}</p>

                  {/* Due Date */}
                  <p className={`text-[13px] tabular-nums ${isOverdue ? 'text-destructive font-medium' : 'text-foreground'}`}>
                    {formatDate(task.dueDate)}
                  </p>

                  {/* Actions */}
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem className="text-[13px]">Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-[13px]">Mark Complete</DropdownMenuItem>
                        <DropdownMenuItem className="text-[13px] text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </Card>
        )}

      </div>
    </AppShell>
  )
}
