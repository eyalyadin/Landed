import { cn } from '@/lib/utils'
import type { PaymentStatus, TaskStatus, TaskPriority } from '@/lib/data'

interface StatusBadgeProps {
  status: PaymentStatus | TaskStatus | 'occupied' | 'vacant' | 'active' | 'expiring-soon' | 'missing'
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = getStatusConfig(status)

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

function getStatusConfig(status: string): { label: string; className: string } {
  switch (status) {
    // Payment statuses
    case 'paid':
      return {
        label: 'Paid',
        className: 'bg-success/10 text-success'
      }
    case 'due-soon':
      return {
        label: 'Due Soon',
        className: 'bg-warning/15 text-warning-foreground'
      }
    case 'overdue':
      return {
        label: 'Overdue',
        className: 'bg-destructive/10 text-destructive'
      }
    case 'partial':
      return {
        label: 'Partial',
        className: 'bg-warning/15 text-warning-foreground'
      }
    case 'pending':
      return {
        label: 'Pending',
        className: 'bg-muted text-muted-foreground'
      }
    // Task statuses
    case 'new':
      return {
        label: 'New',
        className: 'bg-primary/10 text-primary'
      }
    case 'in-progress':
      return {
        label: 'In Progress',
        className: 'bg-primary/10 text-primary'
      }
    case 'waiting-on-tenant':
      return {
        label: 'Waiting on Tenant',
        className: 'bg-warning/15 text-warning-foreground'
      }
    case 'waiting-on-vendor':
      return {
        label: 'Waiting on Vendor',
        className: 'bg-warning/15 text-warning-foreground'
      }
    case 'completed':
      return {
        label: 'Completed',
        className: 'bg-success/10 text-success'
      }
    // Occupancy
    case 'occupied':
      return {
        label: 'Occupied',
        className: 'bg-success/10 text-success'
      }
    case 'vacant':
      return {
        label: 'Vacant',
        className: 'bg-muted text-muted-foreground'
      }
    // Contract statuses
    case 'active':
      return {
        label: 'Active',
        className: 'bg-success/10 text-success'
      }
    case 'expiring-soon':
      return {
        label: 'Expiring Soon',
        className: 'bg-destructive/10 text-destructive'
      }
    case 'missing':
      return {
        label: 'Missing',
        className: 'bg-destructive/10 text-destructive'
      }
    default:
      return {
        label: status,
        className: 'bg-muted text-muted-foreground'
      }
  }
}

interface PriorityBadgeProps {
  priority: TaskPriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = getPriorityConfig(priority)

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

function getPriorityConfig(priority: TaskPriority): { label: string; className: string } {
  switch (priority) {
    case 'urgent':
      return {
        label: 'Urgent',
        className: 'bg-destructive/10 text-destructive'
      }
    case 'high':
      return {
        label: 'High',
        className: 'bg-warning/15 text-warning-foreground'
      }
    case 'medium':
      return {
        label: 'Medium',
        className: 'bg-muted text-muted-foreground'
      }
    case 'low':
      return {
        label: 'Low',
        className: 'bg-muted text-muted-foreground'
      }
    default:
      return {
        label: priority,
        className: 'bg-muted text-muted-foreground'
      }
  }
}

interface UrgencyBadgeProps {
  urgency: 'normal' | 'urgent'
  unreadCount?: number
  className?: string
}

export function UrgencyBadge({ urgency, unreadCount, className }: UrgencyBadgeProps) {
  if (urgency === 'urgent') {
    return (
      <span
        className={cn(
          'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none bg-destructive/10 text-destructive',
          className
        )}
      >
        Urgent
      </span>
    )
  }

  if (unreadCount && unreadCount > 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none bg-primary/10 text-primary',
          className
        )}
      >
        {unreadCount} new
      </span>
    )
  }

  return null
}
