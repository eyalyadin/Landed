import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseISODateUTC, generateDueDates } from "@/lib/dates";
import { corsPreflight, jsonWithCors } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

// POST /api/rent/schedules { tenantId, amount, dueDayOfMonth, startDate }
// Creates a recurring schedule and generates 12 monthly pending payments.
export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as {
    tenantId?: number | string;
    amount?: number | string;
    dueDayOfMonth?: number;
    startDate?: string;
  } | null;

  const rawId = payload?.tenantId;
  const tenantId = rawId !== undefined ? Number(rawId) : NaN;
  const amount = Number(payload?.amount);
  const dueDayOfMonth = Number(payload?.dueDayOfMonth);
  const startDate = payload?.startDate ? parseISODateUTC(payload.startDate) : null;

  if (!Number.isFinite(tenantId)) {
    return jsonWithCors(req, { error: "tenantId is required" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return jsonWithCors(req, { error: "amount must be a positive number" }, { status: 400 });
  }
  if (!Number.isInteger(dueDayOfMonth) || dueDayOfMonth < 1 || dueDayOfMonth > 28) {
    return jsonWithCors(req, { error: "dueDayOfMonth must be 1–28" }, { status: 400 });
  }
  if (!startDate) {
    return jsonWithCors(req, { error: "startDate must be YYYY-MM-DD" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return jsonWithCors(req, { error: "tenant not found" }, { status: 404 });
  }
  const propertyId = tenant.propertyId;
  if (!propertyId) {
    return jsonWithCors(req, { error: "tenant is not linked to a property" }, { status: 409 });
  }

  const amountStr = amount.toFixed(2);
  const dueDates = generateDueDates(startDate, dueDayOfMonth, 12);

  const schedule = await prisma.$transaction(async (tx) => {
    const created = await tx.rentSchedule.create({
      data: { tenantId, amount: amountStr, dueDayOfMonth, startDate, active: true },
    });
    await tx.payment.createMany({
      data: dueDates.map((dueDate) => ({
        tenantId,
        propertyId,
        rentScheduleId: created.id,
        dueDate,
        amount: amountStr,
        currency: "ILS",
        type: "rent" as const,
        status: "pending" as const,
      })),
    });
    return created;
  });

  return jsonWithCors(req, {
    ok: true,
    scheduleId: schedule.id,
    payments: dueDates.length,
    invoices: dueDates.length,
  });
}
