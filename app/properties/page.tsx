'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { PropertyCard } from '@/components/property-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react'
import {
  sampleProperties,
  getTenantsByPropertyId,
  formatCurrency,
} from '@/lib/data'

export default function PropertiesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')

  const expectedMonthly = sampleProperties
    .filter(p => p.occupancyStatus === 'occupied')
    .reduce((sum, p) => sum + p.monthlyRent, 0)
  const collected = sampleProperties
    .filter(p => p.paymentStatus === 'paid')
    .reduce((sum, p) => sum + p.monthlyRent, 0)
  const overdueAmount = sampleProperties
    .filter(p => p.paymentStatus === 'overdue')
    .reduce((sum, p) => sum + p.monthlyRent, 0)

  // Filter properties
  const filteredProperties = sampleProperties.filter(property => {
    const matchesSearch = property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || property.occupancyStatus === statusFilter
    const matchesPayment = paymentFilter === 'all' || property.paymentStatus === paymentFilter

    return matchesSearch && matchesStatus && matchesPayment
  })

  return (
    <AppShell
      pageTitle="Properties"
      pageAction={
        <Button size="sm" className="h-8 text-[13px]">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Property
        </Button>
      }
    >
      <div className="p-4 lg:p-5 space-y-5">
        {/* Summary Strip — 3 tiles */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground leading-none mb-0.5">{formatCurrency(expectedMonthly)}</p>
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
                  <p className="text-lg font-semibold text-foreground leading-none mb-0.5">{formatCurrency(collected)}</p>
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
                  <p className="text-lg font-semibold text-foreground leading-none mb-0.5">{formatCurrency(overdueAmount)}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8 text-[13px] bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[13px]">all</SelectItem>
              <SelectItem value="occupied" className="text-[13px]">Occupied</SelectItem>
              <SelectItem value="vacant" className="text-[13px]">Vacant</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[130px] h-8 text-[13px] bg-card">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[13px]">all</SelectItem>
              <SelectItem value="paid" className="text-[13px]">Paid</SelectItem>
              <SelectItem value="due-soon" className="text-[13px]">Due Soon</SelectItem>
              <SelectItem value="overdue" className="text-[13px]">Overdue</SelectItem>
              <SelectItem value="partial" className="text-[13px]">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Property Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProperties.map(property => {
              const tenants = getTenantsByPropertyId(property.id)
              const tenant = tenants[0]
              return (
                <PropertyCard
                  key={property.id}
                  property={property}
                  tenant={tenant}
                />
              )
            })}
          </div>
        ) : (
          <Card className="border-border shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-sm font-medium text-foreground mb-1">No properties found</h3>
              <p className="text-xs text-muted-foreground mb-3 text-center">
                {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first property'}
              </p>
              <Button size="sm" className="h-8 text-[13px]">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Property
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
