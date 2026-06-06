import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { corsPreflight } from '@/lib/cors'

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/api/cron(.*)',
  '/api/telegram/webhook(.*)',
  '/api/telegram/register(.*)',
  '/api/health(.*)',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (req.method === 'OPTIONS' && req.nextUrl.pathname.startsWith('/api/')) {
    return corsPreflight(req)
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
