import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFoundResponse, requireAppUserForApi, unauthorized } from "@/lib/current-user";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// GET /api/tenants - list tenants for the logged-in owner.
export async function GET() {
  try {
    const appUser = await requireAppUserForApi();
    if (!appUser) return unauthorized();

    const tenants = await prisma.tenant.findMany({
      where: { property: { ownerId: appUser.id } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        property: { select: { address: true } },
      },
    });
    return NextResponse.json(
      tenants.map((t) => ({
        id: t.id,
        name: t.name,
        property_address: t.property?.address ?? null,
      }))
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// POST /api/tenants { name, propertyId, phone?, email? }
// The tenant must be attached to an owned property so it can be account-scoped.
export async function POST(req: NextRequest) {
  const appUser = await requireAppUserForApi();
  if (!appUser) return unauthorized();

  const payload = (await req.json().catch(() => null)) as {
    name?: string;
    propertyId?: number | string | null;
    phone?: string;
    email?: string;
  } | null;

  const name = payload?.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const rawPropertyId = payload?.propertyId;
  const propertyId = rawPropertyId !== undefined && rawPropertyId !== null
    ? Number(rawPropertyId)
    : null;

  if (propertyId === null || !Number.isFinite(propertyId)) {
    return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
  }

  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId: appUser.id },
    select: { id: true, landlordId: true },
  });
  if (!property) return notFoundResponse();

  const linkToken = crypto.randomUUID();

  const tenant = await prisma.tenant.create({
    data: {
      landlordId: property.landlordId,
      propertyId: property.id,
      name,
      phone: payload?.phone?.trim() || null,
      email: payload?.email?.trim() || null,
      linkToken,
    },
  });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? null;
  const inviteLink = botUsername
    ? `https://t.me/${botUsername}?start=${linkToken}`
    : null;

  return NextResponse.json({ ok: true, id: tenant.id, inviteLink }, { status: 201 });
}
