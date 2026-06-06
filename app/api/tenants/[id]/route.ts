import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertOwnedProperty,
  assertOwnedTenant,
  notFoundResponse,
  requireAppUserForApi,
  unauthorized,
} from "@/lib/current-user";

// DELETE /api/tenants/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const appUser = await requireAppUserForApi();
    if (!appUser) return unauthorized();

    const { id } = await params;
    const tenantId = parseInt(id, 10);
    if (!Number.isFinite(tenantId)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }

    const ownedTenant = await assertOwnedTenant(tenantId, appUser.id);
    if (!ownedTenant) return notFoundResponse();

    await prisma.tenant.delete({ where: { id: tenantId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

// PATCH /api/tenants/[id] - update an owned tenant and/or assign to an owned property.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const appUser = await requireAppUserForApi();
    if (!appUser) return unauthorized();

    const { id } = await params;
    const tenantId = parseInt(id, 10);
    if (!Number.isFinite(tenantId)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }

    const ownedTenant = await assertOwnedTenant(tenantId, appUser.id);
    if (!ownedTenant) return notFoundResponse();

    const body = await req.json().catch(() => ({}));
    const { name, phone, email, moveInDate, leaseEndDate, notes, propertyId } = body;

    const data: {
      name?: string;
      phone?: string | null;
      email?: string | null;
      moveInDate?: Date | null;
      leaseEndDate?: Date | null;
      notes?: string | null;
      propertyId?: number | null;
      landlordId?: number;
    } = {};

    if (name !== undefined) data.name = String(name).trim();
    if (phone !== undefined) data.phone = phone ? String(phone).trim() : null;
    if (email !== undefined) data.email = email ? String(email).trim() : null;
    if (moveInDate !== undefined) data.moveInDate = moveInDate ? new Date(moveInDate) : null;
    if (leaseEndDate !== undefined) data.leaseEndDate = leaseEndDate ? new Date(leaseEndDate) : null;
    if (notes !== undefined) data.notes = notes ? String(notes).trim() : null;
    if (propertyId !== undefined) {
      const nextPropertyId = propertyId ? parseInt(String(propertyId), 10) : null;
      if (nextPropertyId === null || !Number.isFinite(nextPropertyId)) {
        data.propertyId = null;
      } else {
        const ownedProperty = await assertOwnedProperty(nextPropertyId, appUser.id);
        if (!ownedProperty) return notFoundResponse();
        data.propertyId = ownedProperty.id;
        data.landlordId = ownedProperty.landlordId;
      }
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data,
    });

    if (data.propertyId && Number.isFinite(data.propertyId)) {
      await prisma.property.update({
        where: { id: data.propertyId },
        data: { occupancyStatus: "occupied" },
      });
    }

    return NextResponse.json({ ok: true, id: updatedTenant.id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
