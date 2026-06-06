// lib/rent.ts
//
// Rolling schedule maintenance: ensures every active RentSchedule always has
// pending Payment rows for the next 12 months from today (respecting endDate).
//
// Call ensureUpcomingInvoices() from the nightly cron — it is idempotent and
// safe to run multiple times; it only inserts months that are not yet present.

import { prisma } from "@/lib/prisma";
import { generateDueDates, jerusalemTodayUTCDate } from "@/lib/dates";

/**
 * For every active RentSchedule, generate any pending Payment rows that are
 * missing within the rolling 12-month-ahead window.
 *
 * Returns the total number of Payment rows created across all schedules.
 */
export async function ensureUpcomingInvoices(): Promise<number> {
  const today = jerusalemTodayUTCDate();
  // Rolling horizon: 12 months from today (UTC-midnight, same timezone semantics).
  const horizon = new Date(
    Date.UTC(today.getUTCFullYear() + 1, today.getUTCMonth(), today.getUTCDate()),
  );

  // Load all active schedules with enough info to generate + insert payments.
  const schedules = await prisma.rentSchedule.findMany({
    where: { active: true },
    include: {
      tenant: { select: { propertyId: true } },
    },
  });

  let created = 0;

  for (const sched of schedules) {
    const propertyId = sched.tenant.propertyId;
    if (!propertyId) continue; // tenant not yet assigned to a property

    // Get the ISO strings of every existing payment due date for this schedule —
    // used to skip months that were already generated (idempotency guard).
    const existing = await prisma.payment.findMany({
      where: { rentScheduleId: sched.id },
      select: { dueDate: true },
    });
    const existingSet = new Set(existing.map((p) => p.dueDate.toISOString()));

    // Generate 60 monthly candidates from the schedule's start — this window
    // (5 years) is more than enough for any lease; we filter down to what's needed.
    const candidates = generateDueDates(sched.startDate, sched.dueDayOfMonth, 60);

    const toCreate = candidates.filter((d) => {
      if (d > horizon) return false;                       // beyond rolling window
      if (sched.endDate && d > sched.endDate) return false; // lease ended
      if (existingSet.has(d.toISOString())) return false;  // already exists
      return true;
    });

    if (toCreate.length === 0) continue;

    await prisma.payment.createMany({
      data: toCreate.map((dueDate) => ({
        propertyId,
        tenantId: sched.tenantId,
        rentScheduleId: sched.id,
        amount: sched.amount,
        currency: "ILS",
        type: "rent" as const,
        status: "pending" as const,
        dueDate,
      })),
    });

    created += toCreate.length;
  }

  return created;
}
