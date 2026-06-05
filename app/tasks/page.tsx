'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { StatusBadge, PriorityBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  MoreHorizontal,
  Building2,
  User,
  Calendar,
  CheckCircle,
  LayoutList,
  LayoutGrid,
  Wrench,
  AlertCircle,
  Clock,
} from 'lucide-react'
import {
  sampleTasks,
  sampleProperties,
  sampleTenants,
  getPropertyById,
  getTenantById,
  formatDate,
  type Task,
  type TaskStatus,
} from '@/lib/data'

function TaskCard({ task }: { task: Task }) {
  const property = getPropertyById(task.propertyId)
  const tenant = task.tenantId ? getTenantById(task.tenantId) : undefined
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed'

  return (
    <Card className={`group transition-shadow hover:shadow-md ${isOverdue ? 'border-destructive/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-foreground line-clamp-2">{task.title}</h3>
            {property && (
              <Link
                href={`/properties/${property.id}`}
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
              >
                <Building2 className="h-3.5 w-3.5" />
                {property.address}
              </Link>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Task</DropdownMenuItem>
              <DropdownMenuItem>Mark Complete</DropdownMenuItem>
              <DropdownMenuItem>Delete Task</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
          {isOverdue && (
            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
              Overdue
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Due {formatDate(task.dueDate)}
          </span>
          {tenant && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {tenant.fullName}
            </span>
          )}
        </div>

        {task.contractorName && (
          <p className="text-sm text-muted-foreground mt-2">
            Contractor: {task.contractorName}
          </p>
        )}

        {task.notes && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{task.notes}</p>
        )}
      </CardContent>
    </Card>
  )
}

function TaskListItem({ task }: { task: Task }) {
  const property = getPropertyById(task.propertyId)
  const tenant = task.tenantId ? getTenantById(task.tenantId) : undefined
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed'

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow ${isOverdue ? 'border-destructive/50' : ''}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-foreground truncate">{task.title}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {property && (
            <Link
              href={`/properties/${property.id}`}
              className="flex items-center gap-1 hover:text-primary"
            >
              <Building2 className="h-3.5 w-3.5" />
              {property.address}
            </Link>
          )}
          {tenant && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {tenant.fullName}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Due {formatDate(task.dueDate)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
        {isOverdue && (
          <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
            Overdue
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit Task</DropdownMenuItem>
            <DropdownMenuItem>Mark Complete</DropdownMenuItem>
            <DropdownMenuItem>Delete Task</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

const statusColumns: { status: TaskStatus; label: string }[] = [
  { status: 'new', label: 'New' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'waiting-on-tenant', label: 'Waiting on Tenant' },
  { status: 'waiting-on-vendor', label: 'Waiting on Vendor' },
  { status: 'completed', label: 'Completed' },
]

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [propertyFilter, setPropertyFilter] = useState<string>('all')

  // Calculate metrics
  const activeTasks = sampleTasks.filter(t => t.status !== 'completed')
  const overdueTasks = sampleTasks.filter(t => 
    new Date(t.dueDate) < new Date() && t.status !== 'completed'
  )
  const urgentTasks = sampleTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed')

  // Filter tasks
  const filteredTasks = sampleTasks.filter(task => {
    const property = getPropertyById(task.propertyId)
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (property?.address.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    const matchesProperty = propertyFilter === 'all' || task.propertyId === propertyFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesProperty
  })

  // Group by status for board view
  const tasksByStatus = statusColumns.map(col => ({
    ...col,
    tasks: filteredTasks.filter(t => t.status === col.status)
  }))

  return (
    <AppShell
      pageTitle="Tasks & Repairs"
      pageAction={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      }
    >
      <div className="p-4 lg:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Wrench className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{activeTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Active Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{overdueTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{urgentTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Urgent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {sampleTasks.filter(t => t.status === 'completed').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-card">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="waiting-on-tenant">Waiting on Tenant</SelectItem>
                <SelectItem value="waiting-on-vendor">Waiting on Vendor</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px] bg-card">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="Property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {sampleProperties.map(property => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="h-9 w-9"
            >
              <LayoutList className="h-4 w-4" />
              <span className="sr-only">List view</span>
            </Button>
            <Button
              variant={viewMode === 'board' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('board')}
              className="h-9 w-9"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Board view</span>
            </Button>
          </div>
        </div>

        {/* Task List/Board */}
        {filteredTasks.length > 0 ? (
          viewMode === 'list' ? (
            <div className="space-y-2">
              {filteredTasks.map(task => (
                <TaskListItem key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto">
              {tasksByStatus.map(column => (
                <div key={column.status} className="min-w-[280px]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-foreground">{column.label}</h3>
                    <Badge variant="secondary">{column.tasks.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {column.tasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                    {column.tasks.length === 0 && (
                      <div className="p-4 rounded-lg border border-dashed border-border text-center">
                        <p className="text-sm text-muted-foreground">No tasks</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No tasks found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || propertyFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first task'}
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
