import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/payments — all payments with tenant and property context.
export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: [{ dueDate: "desc" }],
      include: {
        tenant: { select: { name: true } },
        property: { select: { address: true } },
      },
    });

    return NextResponse.json(
      payments.map((p) => ({
        id: p.id,
        propertyId: p.propertyId,
        propertyAddress: p.property.address,
        tenantId: p.tenantId,
        tenantName: p.tenant.name,
        rentScheduleId: p.rentScheduleId,
        amount: Number(p.amount),
        currency: p.currency,
        type: p.type,
        status: p.status,
        dueDate: p.dueDate.toISOString(),
        paidDate: p.paidDate?.toISOString() ?? null,
        source: p.source,
        reference: p.reference,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
