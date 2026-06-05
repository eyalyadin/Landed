'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  MessageSquare,
  Calendar,
  FileText,
  Wrench,
  LayoutDashboard,
  AlertCircle,
  CheckCircle,
  Clock,
  Home,
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

  // Calculate summary metrics
  const totalProperties = sampleProperties.length
  const occupiedCount = sampleProperties.filter(p => p.occupancyStatus === 'occupied').length
  const vacantCount = sampleProperties.filter(p => p.occupancyStatus === 'vacant').length
  const overdueCount = sampleProperties.filter(p => p.paymentStatus === 'overdue').length
  const openRepairs = sampleProperties.reduce((sum, p) => sum + p.openRepairCount, 0)
  const totalMonthlyRent = sampleProperties
    .filter(p => p.occupancyStatus === 'occupied')
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
        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-border shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{totalProperties}</p>
                  <p className="text-xs text-muted-foreground">Properties</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{occupiedCount}</p>
                  <p className="text-xs text-muted-foreground">Occupied</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <Home className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{vacantCount}</p>
                  <p className="text-xs text-muted-foreground">Vacant</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{overdueCount}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{openRepairs}</p>
                  <p className="text-xs text-muted-foreground">Open Repairs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{formatCurrency(totalMonthlyRent)}</p>
                  <p className="text-xs text-muted-foreground">Monthly Rent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links - Fixed layout */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Link
            href="/messages"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors whitespace-nowrap"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Messages
          </Link>
          <Link
            href="/calendar"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors whitespace-nowrap"
          >
            <Calendar className="h-3.5 w-3.5" />
            Calendar
          </Link>
          <Link
            href="/contracts"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors whitespace-nowrap"
          >
            <FileText className="h-3.5 w-3.5" />
            Contracts
          </Link>
          <Link
            href="/tasks"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors whitespace-nowrap"
          >
            <Wrench className="h-3.5 w-3.5" />
            Tasks & Repairs
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors whitespace-nowrap"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
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
