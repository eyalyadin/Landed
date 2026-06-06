import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VendorCategory } from "@/app/generated/prisma/client";
import { notFoundResponse, requireAppUserForApi, unauthorized } from "@/lib/current-user";

export const dynamic = "force-dynamic";

// DELETE /api/vendors/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const appUser = await requireAppUserForApi();
  if (!appUser) return unauthorized();

  const { id } = await params;
  const vendorId = parseInt(id, 10);
  if (!Number.isFinite(vendorId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const existing = await prisma.vendor.findFirst({
    where: { id: vendorId, ownerId: appUser.id },
    select: { id: true },
  });
  if (!existing) return notFoundResponse();

  await prisma.vendor.delete({ where: { id: vendorId } });
  return NextResponse.json({ ok: true });
}

// PATCH /api/vendors/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const appUser = await requireAppUserForApi();
  if (!appUser) return unauthorized();

  const { id } = await params;
  const vendorId = parseInt(id, 10);
  if (!Number.isFinite(vendorId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const existing = await prisma.vendor.findFirst({
    where: { id: vendorId, ownerId: appUser.id },
    select: { id: true },
  });
  if (!existing) return notFoundResponse();

  const body = await req.json().catch(() => ({}));
  type VendorData = {
    name?: string;
    phone?: string;
    email?: string | null;
    category?: VendorCategory;
    serviceArea?: string;
    contactPerson?: string | null;
    notes?: string | null;
    isPreferred?: boolean;
  };
  const data: VendorData = {};

  if (body.name?.trim()) data.name = body.name.trim();
  if (body.phone?.trim()) data.phone = body.phone.trim();
  if ("email" in body) data.email = body.email?.trim() || null;
  if (body.category) data.category = body.category as VendorCategory;
  if (body.serviceArea) data.serviceArea = body.serviceArea;
  if ("contactPerson" in body) data.contactPerson = body.contactPerson?.trim() || null;
  if ("notes" in body) data.notes = body.notes?.trim() || null;
  if (typeof body.isPreferred === "boolean") data.isPreferred = body.isPreferred;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no fields provided" }, { status: 400 });
  }

  await prisma.vendor.update({ where: { id: vendorId }, data });
  return NextResponse.json({ ok: true });
}
