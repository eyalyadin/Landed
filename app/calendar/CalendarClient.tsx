'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Building2,
  User,
  CreditCard,
  FileText,
  Wrench,
  Home,
  Clock,
} from 'lucide-react'
import { formatDate } from '@/lib/data'

export type CalendarEventRow = {
  id: number
  title: string
  eventType: string
  propertyId: number | null
  propertyAddress: string | null
  tenantName: string | null
  start: string     // ISO date string
  end: string | null
  notes: string | null
}

export type PropertyOption = {
  id: number
  address: string
}

// DB uses underscores
function getEventTypeColor(type: string): string {
  switch (type) {
    case 'rent_due': return 'bg-primary/10 text-foreground'
    case 'lease_start': return 'bg-success/10 text-success'
    case 'lease_end': return 'bg-muted text-muted-foreground'
    case 'renewal_reminder': return 'bg-warning/15 text-warning-foreground'
    case 'scheduled_repair': return 'bg-muted text-muted-foreground'
    case 'move_in': return 'bg-success/10 text-success'
    case 'move_out': return 'bg-destructive/10 text-destructive'
    case 'inspection': return 'bg-muted text-muted-foreground'
    default: return 'bg-muted text-muted-foreground'
  }
}

function getEventTypeLabel(type: string): string {
  switch (type) {
    case 'rent_due': return 'Rent Due'
    case 'lease_start': return 'Lease Start'
    case 'lease_end': return 'Lease End'
    case 'renewal_reminder': return 'Renewal'
    case 'scheduled_repair': return 'Repair'
    case 'move_in': return 'Move In'
    case 'move_out': return 'Move Out'
    case 'inspection': return 'Inspection'
    default: return type
  }
}

function getEventIcon(type: string) {
  switch (type) {
    case 'rent_due': return CreditCard
    case 'lease_start':
    case 'lease_end':
    case 'renewal_reminder': return FileText
    case 'scheduled_repair': return Wrench
    case 'move_in':
    case 'move_out': return Home
    case 'inspection': return Clock
    default: return CalendarIcon
  }
}

function EventItem({ event }: { event: CalendarEventRow }) {
  const Icon = getEventIcon(event.eventType)

  return (
    <div className={`p-2.5 rounded-md ${getEventTypeColor(event.eventType)}`}>
      <div className="flex items-start gap-2.5">
        <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium">{event.title}</p>
          <p className="text-xs opacity-70 mt-0.5">{formatDate(event.start)}</p>
          {event.propertyId && event.propertyAddress && (
            <Link
              href={`/properties/${event.propertyId}`}
              className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1 mt-1"
            >
              <Building2 className="h-3 w-3" />
              {event.propertyAddress}
            </Link>
          )}
          {event.tenantName && !event.propertyAddress && (
            <p className="text-xs opacity-60 flex items-center gap-1 mt-1">
              <User className="h-3 w-3" />
              {event.tenantName}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ListView({ events, filter }: { events: CalendarEventRow[], filter: string }) {
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.start)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {} as Record<string, CalendarEventRow[]>)

  const sortedMonths = Object.keys(groupedEvents).sort()

  if (events.length === 0) {
    return (
      <Card className="border-border shadow-none">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <CalendarIcon className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium text-foreground mb-1">No events</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {filter !== 'all' ? 'Try adjusting your filters' : 'No upcoming events scheduled'}
          </p>
          <Button size="sm" className="h-8 text-[13px]">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Event
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {sortedMonths.map(monthKey => {
        const [year, month] = monthKey.split('-')
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
        const monthEvents = groupedEvents[monthKey].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

        return (
          <div key={monthKey}>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">{monthName}</h3>
            <div className="space-y-1.5">
              {monthEvents.map(event => (
                <EventItem key={event.id} event={event} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MonthView({ currentDate, events }: { currentDate: Date, events: CalendarEventRow[] }) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const days: (number | null)[] = []
  for (let i = 0; i < startPadding; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.start.startsWith(dateStr))
  }

  const today = new Date()
  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

  return (
    <Card className="border-border shadow-none">
      <CardContent className="p-3">
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1.5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-1.5 text-muted-foreground font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-[70px]" />
            }
            const dayEvents = getEventsForDay(day)
            return (
              <div
                key={day}
                className={`min-h-[70px] p-1 border border-border rounded-md ${
                  isToday(day) ? 'bg-primary/5 border-primary/30' : ''
                }`}
              >
                <span className={`text-xs ${isToday(day) ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {day}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className={`text-[10px] px-1 py-0.5 rounded truncate ${getEventTypeColor(event.eventType)}`}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

interface Props {
  events: CalendarEventRow[]
  properties: PropertyOption[]
}

export function CalendarClient({ events, properties }: Props) {
  const [view, setView] = useState<'month' | 'list'>('list')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')

  const filteredEvents = events.filter(event => {
    const matchesProperty = propertyFilter === 'all' || String(event.propertyId) === propertyFilter
    const matchesType = eventTypeFilter === 'all' || event.eventType === eventTypeFilter
    return matchesProperty && matchesType
  })

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => setCurrentDate(new Date())

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="p-4 lg:p-5 space-y-4">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday} className="h-8 text-[13px]">
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-foreground ml-1.5">{monthName}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={propertyFilter} onValueChange={(v) => setPropertyFilter(v ?? 'all')}>
            <SelectTrigger className="w-[140px] h-8 text-[13px] bg-card">
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[13px]">All Properties</SelectItem>
              {properties.map(property => (
                <SelectItem key={property.id} value={String(property.id)} className="text-[13px]">
                  {property.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={eventTypeFilter} onValueChange={(v) => setEventTypeFilter(v ?? 'all')}>
            <SelectTrigger className="w-[120px] h-8 text-[13px] bg-card">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[13px]">All Types</SelectItem>
              <SelectItem value="rent_due" className="text-[13px]">Rent Due</SelectItem>
              <SelectItem value="lease_end" className="text-[13px]">Lease End</SelectItem>
              <SelectItem value="scheduled_repair" className="text-[13px]">Repair</SelectItem>
              <SelectItem value="inspection" className="text-[13px]">Inspection</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-0.5 border border-border rounded-md p-0.5">
            <button
              onClick={() => setView('list')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                view === 'list' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                view === 'month' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {view === 'list' ? (
        <ListView events={filteredEvents} filter={eventTypeFilter} />
      ) : (
        <MonthView currentDate={currentDate} events={filteredEvents} />
      )}
    </div>
  )
}
