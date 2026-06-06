import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/payments — record a payment for a tenant.
// If there's an existing overdue payment for that tenant+type, mark it paid.
// Otherwise create a new paid payment on the tenant's current property.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, amount, type, paidDate, notes } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const tid = parseInt(tenantId, 10);
    const paymentType = type ?? "rent";
    const paid = paidDate ? new Date(paidDate) : new Date();

    // Find the most recent overdue payment for this tenant + type
    const overduePayment = await prisma.payment.findFirst({
      where: { tenantId: tid, type: paymentType, status: "overdue" },
      orderBy: { dueDate: "desc" },
    });

    if (overduePayment) {
      const updated = await prisma.payment.update({
        where: { id: overduePayment.id },
        data: {
          status: "paid",
          paidDate: paid,
          ...(amount ? { amount: parseFloat(amount) } : {}),
          ...(notes ? { notes } : {}),
        },
      });
      return NextResponse.json({ id: updated.id }, { status: 200 });
    }

    // No overdue to update — create a fresh paid payment
    if (!amount) {
      return NextResponse.json({ error: "amount is required when no overdue payment exists" }, { status: 400 });
    }
    const tenant = await prisma.tenant.findUnique({ where: { id: tid }, select: { propertyId: true } });
    if (!tenant?.propertyId) {
      return NextResponse.json({ error: "Tenant has no property assigned" }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        propertyId: tenant.propertyId,
        tenantId: tid,
        amount: parseFloat(amount),
        type: paymentType,
        status: "paid",
        dueDate: paid,
        paidDate: paid,
        notes: notes ?? null,
      },
    });
    return NextResponse.json({ id: payment.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

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
