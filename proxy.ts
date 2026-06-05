import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

// Endpoints that authenticate themselves (Telegram secret / cron secret) or must
// stay public, bypassing the landlord cookie check.
const PUBLIC_API_PREFIXES = [
  '/api/telegram/webhook',
  '/api/health',
  '/api/cron',
  '/api/auth',
]

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Login page is always public
  if (pathname === '/login') return NextResponse.next()

  // Self-authenticating API routes are always public
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const authed = await verifySessionToken(
    req.cookies.get(SESSION_COOKIE)?.value
  )

  if (authed) return NextResponse.next()

  // Unauthenticated API call → 401
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Unauthenticated page → redirect to login
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
