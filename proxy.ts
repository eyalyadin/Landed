import { NextRequest, NextResponse } from 'next/server'
import { corsPreflight } from '@/lib/cors'

// Auth disabled — all routes are open.
export default function proxy(req: NextRequest) {
  if (req.method === 'OPTIONS' && req.nextUrl.pathname.startsWith('/api/')) {
    return corsPreflight(req)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
