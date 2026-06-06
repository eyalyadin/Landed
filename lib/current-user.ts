import 'server-only'

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'

export const DEMO_OWNER_CLERK_ID = 'demo-owner'

export type CurrentAppUser = {
  id: number
  clerkId: string
  email: string
  name: string | null
}

function displayName(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) return null
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username || null
}

async function ensureCurrentAppUser(): Promise<CurrentAppUser | null> {
  const { userId } = await auth()
  if (!userId) return null

  const existing = await prisma.appUser.findUnique({
    where: { clerkId: userId },
    select: { id: true, clerkId: true, email: true, name: true },
  })
  if (existing) return existing

  const clerkUser = await currentUser()
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    `${userId}@clerk.local`
  const name = displayName(clerkUser)

  return prisma.$transaction(async (tx) => {
    const created = await tx.appUser.create({
      data: { clerkId: userId, email, name },
      select: { id: true, clerkId: true, email: true, name: true },
    })

    const realUserCount = await tx.appUser.count({
      where: { clerkId: { not: DEMO_OWNER_CLERK_ID } },
    })

    if (realUserCount === 1) {
      const demoOwner = await tx.appUser.findUnique({
        where: { clerkId: DEMO_OWNER_CLERK_ID },
        select: { id: true },
      })

      if (demoOwner) {
        await Promise.all([
          tx.property.updateMany({ where: { ownerId: demoOwner.id }, data: { ownerId: created.id } }),
          tx.vendor.updateMany({ where: { ownerId: demoOwner.id }, data: { ownerId: created.id } }),
          tx.calendarEvent.updateMany({ where: { ownerId: demoOwner.id }, data: { ownerId: created.id } }),
        ])
      }
    }

    return created
  })
}

export const requireAppUser = cache(async (): Promise<CurrentAppUser> => {
  const appUser = await ensureCurrentAppUser()
  if (!appUser) redirect('/login')
  return appUser
})

export async function requireAppUserForApi(): Promise<CurrentAppUser | null> {
  return ensureCurrentAppUser()
}

export async function assertOwnedProperty(propertyId: number, ownerId: number) {
  return prisma.property.findFirst({
    where: { id: propertyId, ownerId },
    select: { id: true, landlordId: true },
  })
}

export async function assertOwnedTenant(tenantId: number, ownerId: number) {
  return prisma.tenant.findFirst({
    where: { id: tenantId, property: { ownerId } },
    select: { id: true, propertyId: true, landlordId: true, thread: { select: { id: true } } },
  })
}

export function unauthorized() {
  return Response.json({ error: 'unauthorized' }, { status: 401 })
}

export function notFoundResponse() {
  return Response.json({ error: 'not found' }, { status: 404 })
}
