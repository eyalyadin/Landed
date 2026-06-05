'use client'

import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2,
  CheckCircle,
  Home,
  AlertCircle,
  Clock,
  Wrench,
  FileText,
  CreditCard,
  TrendingUp,
  Calendar,
  ArrowRight,
} from 'lucide-react'
import {
  sampleProperties,
  sampleTenants,
  sampleTasks,
  samplePayments,
  sampleCalendarEvents,
  getPropertyById,
  formatCurrency,
  formatDate,
} from '@/lib/data'

export default function DashboardPage() {
  // Calculate metrics
  const totalProperties = sampleProperties.length
  const occupiedProperties = sampleProperties.filter(p => p.occupancyStatus === 'occupied').length
  const vacantProperties = sampleProperties.filter(p => p.occupancyStatus === 'vacant').length

  const totalMonthlyRent = sampleProperties
    .filter(p => p.occupancyStatus === 'occupied')
    .reduce((sum, p) => sum + p.monthlyRent, 0)

  const paidPayments = samplePayments.filter(p => p.status === 'paid' && p.type === 'rent')
  const collectedRent = paidPayments.reduce((sum, p) => sum + p.amount, 0)

  const overduePayments = samplePayments.filter(p => p.status === 'overdue')
  const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0)

  const activeTasks = sampleTasks.filter(t => t.status !== 'completed')
  const overdueTasks = activeTasks.filter(t => new Date(t.dueDate) < new Date())
  const openRepairs = activeTasks.filter(t => t.category === 'repair')

  // Upcoming lease ends (within 90 days)
  const today = new Date()
  const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
  const upcomingLeaseEnds = sampleTenants.filter(t => {
    const leaseEnd = new Date(t.leaseEndDate)
    return leaseEnd >= today && leaseEnd <= ninetyDaysFromNow
  })

  // Properties needing attention (overdue payment or urgent tasks)
  const propertiesNeedingAttention = sampleProperties.filter(p =>
    p.paymentStatus === 'overdue' ||
    sampleTasks.some(t => t.propertyId === p.id && t.priority === 'urgent' && t.status !== 'completed')
  )

  // Upcoming events
  const upcomingEvents = sampleCalendarEvents
    .filter(e => new Date(e.start) >= today)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5)

  return (
    <AppShell pageTitle="Dashboard">
      <div className="p-4 lg:p-5 space-y-5">
        {/* Financial Metrics */}
        <div>
          <h2 className="text-xs font-medium text-muted-foreground mb-2.5">Financial Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="border-border shadow-none">
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{formatCurrency(totalMonthlyRent)}</p>
                    <p className="text-xs text-muted-foreground">Expected Monthly</p>
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
                    <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{formatCurrency(collectedRent)}</p>
                    <p className="text-xs text-muted-foreground">Collected</p>
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
                    <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{formatCurrency(overdueAmount)}</p>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-none">
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{overduePayments.length}</p>
                    <p className="text-xs text-muted-foreground">Overdue Payments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Property & Task Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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
                  <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{occupiedProperties}</p>
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
                  <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{vacantProperties}</p>
                  <p className="text-xs text-muted-foreground">Vacant</p>
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
                  <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{openRepairs.length}</p>
                  <p className="text-xs text-muted-foreground">Open Repairs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10">
                  <Clock className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{overdueTasks.length}</p>
                  <p className="text-xs text-muted-foreground">Overdue Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Lists */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Properties Needing Attention */}
          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
              <CardTitle className="text-[13px] font-medium">Properties Needing Attention</CardTitle>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-muted-foreground hover:text-foreground">
                <Link href="/properties">
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {propertiesNeedingAttention.length > 0 ? (
                <div className="space-y-1.5">
                  {propertiesNeedingAttention.slice(0, 4).map(property => {
                    const tenant = sampleTenants.find(t => t.propertyId === property.id)
                    return (
                      <Link
                        key={property.id}
                        href={`/properties/${property.id}`}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{property.address}</p>
                          <p className="text-xs text-muted-foreground">
                            {tenant?.fullName || 'Vacant'}
                          </p>
                        </div>
                        <StatusBadge status={property.paymentStatus} />
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">All properties are in good standing</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Lease Renewals */}
          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
              <CardTitle className="text-[13px] font-medium">Upcoming Lease Renewals</CardTitle>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-muted-foreground hover:text-foreground">
                <Link href="/tenants">
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {upcomingLeaseEnds.length > 0 ? (
                <div className="space-y-1.5">
                  {upcomingLeaseEnds.map(tenant => {
                    const property = getPropertyById(tenant.propertyId)
                    return (
                      <div
                        key={tenant.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground">{tenant.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {property?.address}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-foreground">{formatDate(tenant.leaseEndDate)}</p>
                          <StatusBadge status="expiring-soon" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No leases expiring in the next 90 days</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Tasks */}
          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
              <CardTitle className="text-[13px] font-medium">Open Tasks</CardTitle>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-muted-foreground hover:text-foreground">
                <Link href="/tasks">
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {activeTasks.length > 0 ? (
                <div className="space-y-1.5">
                  {activeTasks.slice(0, 4).map(task => {
                    const property = getPropertyById(task.propertyId)
                    const isOverdue = new Date(task.dueDate) < new Date()
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-2 rounded-md ${isOverdue ? 'bg-destructive/5' : 'bg-muted/50'}`}
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{task.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {property?.address}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs font-medium ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                            {formatDate(task.dueDate)}
                          </p>
                          <StatusBadge status={task.status} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No open tasks</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
              <CardTitle className="text-[13px] font-medium">Upcoming Events</CardTitle>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-muted-foreground hover:text-foreground">
                <Link href="/calendar">
                  View Calendar
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-1.5">
                  {upcomingEvents.map(event => {
                    const property = event.propertyId ? getPropertyById(event.propertyId) : null
                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-foreground truncate">{event.title}</p>
                            {property && (
                              <p className="text-xs text-muted-foreground truncate">
                                {property.address}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-foreground shrink-0">{formatDate(event.start)}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No upcoming events</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
