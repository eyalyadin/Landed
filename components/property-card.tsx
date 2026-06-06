import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
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
  User,
} from 'lucide-react'
import type { Property, Tenant } from '@/lib/data'
import { formatCurrency } from '@/lib/data'

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


export function PropertyCard({ property, tenant }: PropertyCardProps) {
  const PropertyIcon = getPropertyTypeIcon(property.propertyType)
  const isOverdue = property.paymentStatus === 'overdue'

  return (
    <Card className="group relative border-border shadow-none hover:shadow-sm transition-shadow">
      {/* Large icon + address block */}
      <div className="flex flex-col items-center px-4 pt-5 pb-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted mb-3">
          <PropertyIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <Link
          href={`/properties/${property.id}`}
          dir="auto"
          className="text-sm font-semibold text-foreground hover:underline text-center line-clamp-1 w-full"
        >
          {property.address}
        </Link>
        <p dir="auto" className="text-xs text-muted-foreground text-center mt-0.5">{property.city}</p>

        {/* Actions menu — top-right corner */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
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
      </div>

      <CardContent className="px-4 pb-4 pt-0 space-y-2">
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
          <p className="text-sm font-semibold text-foreground">
            {formatCurrency(property.monthlyRent)}
            <span className="text-xs font-normal text-muted-foreground">/mo</span>
          </p>
          {property.occupancyStatus === 'occupied' && (
            <StatusBadge status={property.paymentStatus} />
          )}
        </div>
      </CardContent>

      {isOverdue && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-destructive rounded-b-lg" />
      )}
    </Card>
  )
}
