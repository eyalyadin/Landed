import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center px-6 h-14 border-b border-border bg-card">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background font-semibold text-xs select-none">
            L
          </div>
          <span className="font-semibold text-foreground tracking-tight text-sm">Landed</span>
        </Link>
      </header>

      {/* Clerk widget centered */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">Start managing your properties today</p>
          </div>
          <SignUp signInUrl="/login" fallbackRedirectUrl="/properties" />
        </div>
      </div>
    </main>
  )
}
