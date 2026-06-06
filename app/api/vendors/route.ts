import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUserForApi, unauthorized } from "@/lib/current-user";

export const dynamic = "force-dynamic";

// GET /api/vendors
export async function GET() {
  try {
    const appUser = await requireAppUserForApi();
    if (!appUser) return unauthorized();

    const vendors = await prisma.vendor.findMany({
      where: { ownerId: appUser.id },
      orderBy: [{ isPreferred: "desc" }, { name: "asc" }],
    });

    return NextResponse.json(
      vendors.map((v) => ({
        id: v.id,
        name: v.name,
        phone: v.phone,
        email: v.email,
        category: v.category,
        serviceArea: v.serviceArea,
        notes: v.notes,
        isPreferred: v.isPreferred,
        contactPerson: v.contactPerson,
        rating: v.rating !== null ? Number(v.rating) : null,
        activeJobs: v.activeJobs,
        completedJobs: v.completedJobs,
      }))
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
