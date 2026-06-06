import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUserForApi, unauthorized } from "@/lib/current-user";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// POST /api/properties - create a property, optionally with a first tenant.
export async function POST(req: Request) {
  try {
    const appUser = await requireAppUserForApi();
    if (!appUser) return unauthorized();

    const body = await req.json();
    const {
      address, city, propertyType, unitLabel, monthlyRent,
      tenantName, tenantPhone, tenantEmail, leaseStartDate, leaseEndDate,
    } = body;

    if (!address || !city || !monthlyRent) {
      return NextResponse.json({ error: "address, city and monthlyRent are required" }, { status: 400 });
    }

    const landlord =
      (await prisma.landlord.findFirst()) ??
      (await prisma.landlord.create({ data: { name: appUser.name ?? "Landlord" } }));

    const property = await prisma.property.create({
      data: {
        landlordId: landlord.id,
        ownerId: appUser.id,
        address,
        city,
        propertyType: propertyType ?? "apartment",
        unitLabel: unitLabel || null,
        occupancyStatus: tenantName ? "occupied" : "vacant",
        monthlyRent: parseFloat(monthlyRent),
      },
    });

    if (tenantName) {
      const linkToken = crypto.randomBytes(18).toString("base64url");
      await prisma.tenant.create({
        data: {
          landlordId: landlord.id,
          propertyId: property.id,
          name: tenantName,
          phone: tenantPhone || null,
          email: tenantEmail || null,
          linkToken,
          moveInDate: leaseStartDate ? new Date(leaseStartDate) : null,
          leaseEndDate: leaseEndDate ? new Date(leaseEndDate) : null,
        },
      });
    }

    return NextResponse.json({ id: property.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// GET /api/properties - returns all properties for the logged-in owner.
export async function GET() {
  try {
    const appUser = await requireAppUserForApi();
    if (!appUser) return unauthorized();

    const properties = await prisma.property.findMany({
      where: { ownerId: appUser.id },
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
