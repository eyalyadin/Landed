import { NextResponse } from 'next/server'

// Auth disabled — all routes are open.
export default function proxy() {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
