'use client'

import { cn } from '@/lib/utils'
import {
  Building2,
  CreditCard,
  MessageSquare,
  Wrench,
  Calendar,
  FileText,
  Users,
  HardHat,
  Settings,
  Menu,
  Search,
  Bell,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

type Summary = {
  unreadCount: number
  openTaskCount: number
  overdueCount: number
  landlordName: string
}

const navigation = [
  { name: 'Properties', href: '/properties', icon: Building2 },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Messages', href: '/messages', icon: MessageSquare, countKey: 'unreadCount' as keyof Summary },
  { name: 'Tasks & Repairs', href: '/tasks', icon: Wrench, countKey: 'openTaskCount' as keyof Summary },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Contracts', href: '/contracts', icon: FileText },
  { name: 'Tenants', href: '/tenants', icon: Users },
  { name: 'Vendors', href: '/vendors', icon: HardHat },
]

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface AppShellProps {
  children: React.ReactNode
  pageTitle?: string
  pageAction?: React.ReactNode
}

function SidebarContent({
  onNavigate,
  summary,
}: {
  onNavigate?: () => void
  summary: Summary | null
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background font-semibold text-xs">
          L
        </div>
        <span className="font-semibold text-foreground tracking-tight">Landed</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const count = item.countKey && summary ? (summary[item.countKey] as number) : 0

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.name}</span>
              {count > 0 && (
                <span className="h-4.5 min-w-[18px] px-1 text-[11px] font-medium bg-muted text-muted-foreground rounded flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-border px-3 py-2">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function AppShell({ children, pageTitle, pageAction }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    fetch('/api/summary')
      .then(r => r.json())
      .then((data: Summary) => setSummary(data))
      .catch(() => {}) // non-critical: chrome stays badge-free on failure
  }, [])

  const initials = summary?.landlordName
    ? summary.landlordName
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'L'

  const overdueCount = summary?.overdueCount ?? 0

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:fixed lg:inset-y-0 bg-card border-r border-border">
        <SidebarContent summary={summary} />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-56">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:px-5">
          {/* Mobile menu button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-56 p-0">
              <SidebarContent
                summary={summary}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>

          {/* Page title */}
          {pageTitle && (
            <h1 className="text-sm font-semibold text-foreground hidden sm:block">
              {pageTitle}
            </h1>
          )}

          {/* Search */}
          <div className="flex-1 max-w-sm ml-auto lg:ml-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search properties, tenants, contracts..."
                className="h-8 pl-8 text-[13px] bg-background border-border"
              />
            </div>
          </div>

          {/* Page action */}
          {pageAction && (
            <div className="hidden sm:block">
              {pageAction}
            </div>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell className="h-4 w-4" />
            {overdueCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-medium">
                {overdueCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-foreground text-background text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem className="text-[13px]">Profile</DropdownMenuItem>
              <DropdownMenuItem className="text-[13px]">Account Settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
