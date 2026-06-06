import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, MessageSquare, CreditCard, Wrench, ArrowRight } from 'lucide-react'

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/properties')

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background font-semibold text-xs select-none">
            L
          </div>
          <span className="font-semibold text-foreground tracking-tight text-sm">Landed</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-[13px] font-medium bg-foreground text-background rounded-md px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center py-20">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-[12px] text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Property management for landlords
          </div>

          <h1 className="text-4xl font-semibold text-foreground tracking-tight leading-tight mb-4">
            Manage your properties,<br />simply.
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-sm mx-auto">
            One dashboard for tenants, rent, maintenance requests, and conversations — all connected through Telegram.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card text-foreground text-sm font-medium px-5 py-2.5 hover:bg-muted transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Feature grid */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl w-full">
          {[
            { icon: Building2, label: 'Properties', desc: 'Track all units in one place' },
            { icon: CreditCard, label: 'Payments', desc: 'Rent roll & overdue alerts' },
            { icon: MessageSquare, label: 'Messages', desc: 'Chat via Telegram' },
            { icon: Wrench, label: 'Maintenance', desc: 'Photo requests from tenants' },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-4 py-5 text-center"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4.5 w-4.5 text-muted-foreground" />
              </div>
              <p className="text-[13px] font-medium text-foreground">{label}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 text-center">
        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Landed. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
