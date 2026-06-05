import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/properties — returns all properties for the landlord.
export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { address: "asc" },
      include: {
        _count: {
          select: {
            tenants: true,
            jobs: { where: { status: { not: "completed" } } },
          },
        },
      },
    });

    const result = properties.map((p) => ({
      id: p.id,
      address: p.address,
      city: p.city,
      propertyType: p.propertyType,
      unitLabel: p.unitLabel,
      occupancyStatus: p.occupancyStatus,
      monthlyRent: Number(p.monthlyRent),
      rentCurrency: p.rentCurrency,
      leaseStartDate: p.leaseStartDate?.toISOString() ?? null,
      leaseEndDate: p.leaseEndDate?.toISOString() ?? null,
      managerName: p.managerName,
      notes: p.notes,
      tenantCount: p._count.tenants,
      openJobCount: p._count.jobs,
    }));

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
