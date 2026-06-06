import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/tenants/[id] — update tenant fields and/or assign to a property.
// Body: { name?, phone?, email?, moveInDate?, leaseEndDate?, notes?, propertyId? }
// NOTE: never call prisma.messageThread.create() — DB trigger trg_create_tenant_thread handles it.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = parseInt(id, 10);
    if (!Number.isFinite(tenantId)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, phone, email, moveInDate, leaseEndDate, notes, propertyId } = body;

    // Build update object — only include fields present in the request body
    const data: {
      name?: string;
      phone?: string | null;
      email?: string | null;
      moveInDate?: Date | null;
      leaseEndDate?: Date | null;
      notes?: string | null;
      propertyId?: number | null;
    } = {};

    if (name !== undefined) data.name = String(name).trim();
    if (phone !== undefined) data.phone = phone ? String(phone).trim() : null;
    if (email !== undefined) data.email = email ? String(email).trim() : null;
    if (moveInDate !== undefined) data.moveInDate = moveInDate ? new Date(moveInDate) : null;
    if (leaseEndDate !== undefined) data.leaseEndDate = leaseEndDate ? new Date(leaseEndDate) : null;
    if (notes !== undefined) data.notes = notes ? String(notes).trim() : null;
    if (propertyId !== undefined) {
      data.propertyId = propertyId ? parseInt(String(propertyId), 10) : null;
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data,
    });

    // If assigning to a property, mark that property as occupied
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
