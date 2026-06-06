import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/tenants — list all tenants with their property address.
export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
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

// POST /api/tenants { name, propertyId?, phone?, email? }
// Creates a new tenant row and returns an invite link so they can link via Telegram /start.
// NOTE: do NOT call prisma.messageThread.create() — the DB trigger
//   trg_create_tenant_thread creates the thread automatically on Tenant INSERT.
export async function POST(req: NextRequest) {
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

  // Resolve landlordId — from the property if given, else the first (and only) landlord.
  let landlordId: number | null = null;
  const rawPropertyId = payload?.propertyId;
  const propertyId = rawPropertyId !== undefined && rawPropertyId !== null
    ? Number(rawPropertyId)
    : null;

  if (propertyId !== null && Number.isFinite(propertyId)) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { landlordId: true },
    });
    if (!property) {
      return NextResponse.json({ error: "property not found" }, { status: 404 });
    }
    landlordId = property.landlordId;
  } else {
    const landlord = await prisma.landlord.findFirst({ select: { id: true } });
    if (!landlord) {
      return NextResponse.json({ error: "no landlord found in the database" }, { status: 404 });
    }
    landlordId = landlord.id;
  }

  const linkToken = crypto.randomUUID();

  const tenant = await prisma.tenant.create({
    data: {
      landlordId,
      propertyId: propertyId !== null && Number.isFinite(propertyId) ? propertyId : null,
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
