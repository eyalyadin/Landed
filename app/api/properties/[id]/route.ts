import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFoundResponse, requireAppUserForApi, unauthorized } from "@/lib/current-user";

export const dynamic = "force-dynamic";

// DELETE /api/properties/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const appUser = await requireAppUserForApi();
    if (!appUser) return unauthorized();

    const { id } = await params;
    const propertyId = parseInt(id, 10);
    if (!Number.isFinite(propertyId)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }

    const existing = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: appUser.id },
      select: { id: true },
    });
    if (!existing) return notFoundResponse();

    await prisma.property.delete({ where: { id: propertyId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
