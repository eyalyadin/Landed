'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  Home,
  Building,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Search,
  User,
  Plus,
} from 'lucide-react'
import { formatILS } from '@/lib/format'

export type PropertyItem = {
  id: number
  address: string
  city: string
  propertyType: string
  unitLabel: string | null
  occupancyStatus: string
  monthlyRent: number
  rentCurrency: string
  tenant: {
    id: number
    name: string
    leaseEndDate: string | null
  } | null
  overdueCount: number
}

function PropertyTypeIcon({ type }: { type: string }) {
  if (type === 'house') return <Home className="h-8 w-8 text-muted-foreground" />
  if (type === 'commercial') return <Building className="h-8 w-8 text-muted-foreground" />
  return <Building2 className="h-8 w-8 text-muted-foreground" />
}

function PropertyCard({ property, onClick }: { property: PropertyItem; onClick: () => void }) {
  const isOverdue = property.overdueCount > 0
  const isVacant = property.occupancyStatus === 'vacant'

  return (
    <Card
      className="group relative border-border shadow-none hover:shadow-sm transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Icon + address block */}
        <div className="flex flex-col items-center px-4 pt-5 pb-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted mb-3">
            <PropertyTypeIcon type={property.propertyType} />
          </div>
          <p className="text-sm font-semibold text-foreground text-center line-clamp-1 w-full">
            {property.address}
          </p>
          <p className="text-xs text-muted-foreground text-center mt-0.5">{property.city}</p>
        </div>

        <div className="px-4 pb-4 pt-0 space-y-2">
          {/* Tenant / Vacancy */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {property.tenant ? (
                <span className="text-foreground">{property.tenant.name}</span>
              ) : (
                <span className="text-muted-foreground">No tenant</span>
              )}
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
              isVacant
                ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            }`}>
              {isVacant ? 'Vacant' : 'Occupied'}
            </span>
          </div>

          {/* Rent & status */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {formatILS(property.monthlyRent)}
              <span className="text-xs font-normal text-muted-foreground">/mo</span>
            </p>
            {!isVacant && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                isOverdue
                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {isOverdue ? 'Overdue' : 'Paid'}
              </span>
            )}
          </div>
        </div>
      </CardContent>

      {/* Overdue indicator bar */}
      {isOverdue && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-destructive rounded-b-lg" />
      )}
    </Card>
  )
}

interface Props {
  properties: PropertyItem[]
  expectedMonthly: number
  collected: number
  overdueTotal: number
}

export function PropertiesClient({ properties, expectedMonthly, collected, overdueTotal }: Props) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = properties.filter(p => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q ||
      p.address.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      (p.tenant?.name.toLowerCase().includes(q) ?? false)
    const matchesStatus = statusFilter === 'all' || p.occupancyStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-4 lg:p-5 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground leading-none mb-0.5">{formatILS(expectedMonthly)}</p>
                <p className="text-xs text-muted-foreground">Expected Monthly</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/30">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground leading-none mb-0.5">{formatILS(collected)}</p>
                <p className="text-xs text-muted-foreground">Collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground leading-none mb-0.5">{formatILS(overdueTotal)}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-[13px] bg-card"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="w-[130px] h-8 text-[13px] bg-card">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[13px]">All</SelectItem>
            <SelectItem value="occupied" className="text-[13px]">Occupied</SelectItem>
            <SelectItem value="vacant" className="text-[13px]">Vacant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Property grid */}
      {filtered.length === 0 ? (
        <Card className="border-border shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">No properties found</h3>
            <p className="text-xs text-muted-foreground mb-3">
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Add your first property to get started'}
            </p>
            <Button size="sm" className="h-8 text-[13px]">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(property => (
            <PropertyCard
              key={property.id}
              property={property}
              onClick={() => router.push(`/properties/${property.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
