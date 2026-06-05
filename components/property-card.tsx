import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Building2,
  Home,
  Building,
  MoreHorizontal,
  MessageSquare,
  Wrench,
  FileText,
  CreditCard,
  Calendar,
  User,
  AlertCircle,
} from 'lucide-react'
import type { Property, Tenant } from '@/lib/data'
import { formatCurrency, formatDate } from '@/lib/data'

interface PropertyCardProps {
  property: Property
  tenant?: Tenant
}

function getPropertyTypeIcon(type: string) {
  switch (type) {
    case 'apartment':
      return Building2
    case 'house':
      return Home
    case 'condo':
    case 'townhouse':
      return Building
    default:
      return Building2
  }
}

function getPropertyTypeLabel(type: string) {
  switch (type) {
    case 'apartment':
      return 'Apartment'
    case 'house':
      return 'House'
    case 'condo':
      return 'Condo'
    case 'townhouse':
      return 'Townhouse'
    case 'commercial':
      return 'Commercial'
    default:
      return type
  }
}

export function PropertyCard({ property, tenant }: PropertyCardProps) {
  const PropertyIcon = getPropertyTypeIcon(property.propertyType)
  const hasIssues = property.openTaskCount > 0 || property.openRepairCount > 0
  const isOverdue = property.paymentStatus === 'overdue'

  return (
    <Card className="group relative border-border shadow-none hover:shadow-sm transition-shadow">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <PropertyIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <Link
                href={`/properties/${property.id}`}
                className="text-[13px] font-medium text-foreground hover:underline line-clamp-1"
              >
                {property.address}
              </Link>
              <p className="text-xs text-muted-foreground">
                {property.city} · {getPropertyTypeLabel(property.propertyType)}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3.5 w-3.5" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild className="text-[13px]">
                <Link href={`/properties/${property.id}`}>
                  <Building2 className="mr-2 h-3.5 w-3.5" />
                  View Property
                </Link>
              </DropdownMenuItem>
              {tenant && (
                <DropdownMenuItem asChild className="text-[13px]">
                  <Link href={`/messages?thread=${tenant.messageThreadId}`}>
                    <MessageSquare className="mr-2 h-3.5 w-3.5" />
                    Message Tenant
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild className="text-[13px]">
                <Link href={`/tasks?property=${property.id}`}>
                  <Wrench className="mr-2 h-3.5 w-3.5" />
                  Add Task
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-[13px]">
                <Link href={`/contracts?property=${property.id}`}>
                  <FileText className="mr-2 h-3.5 w-3.5" />
                  View Contracts
                </Link>
              </DropdownMenuItem>
              {tenant && (
                <DropdownMenuItem className="text-[13px]">
                  <CreditCard className="mr-2 h-3.5 w-3.5" />
                  Record Payment
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2.5">
        {/* Tenant / Vacancy */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            {tenant ? (
              <span className="text-foreground">{tenant.fullName}</span>
            ) : (
              <span className="text-muted-foreground">No tenant</span>
            )}
          </div>
          <StatusBadge status={property.occupancyStatus} />
        </div>

        {/* Rent & Payment Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(property.monthlyRent)}
              <span className="text-xs font-normal text-muted-foreground">/mo</span>
            </p>
          </div>
          {property.occupancyStatus === 'occupied' && (
            <StatusBadge status={property.paymentStatus} />
          )}
        </div>

        {/* Key dates & issues */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {property.nextPaymentDueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Due {formatDate(property.nextPaymentDueDate)}</span>
            </div>
          )}
          {property.leaseEndDate && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>Lease ends {formatDate(property.leaseEndDate)}</span>
            </div>
          )}
        </div>

        {/* Issues indicator */}
        {hasIssues && (
          <div className="flex items-center gap-2.5 text-xs">
            {property.openTaskCount > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Wrench className="h-3 w-3" />
                <span>{property.openTaskCount} open task{property.openTaskCount > 1 ? 's' : ''}</span>
              </div>
            )}
            {property.openRepairCount > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                <span>{property.openRepairCount} repair{property.openRepairCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Overdue indicator */}
      {isOverdue && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-destructive rounded-b-lg" />
      )}
    </Card>
  )
}
