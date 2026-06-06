// One-shot endpoint to insert the Property Health demo tenant.
// Protected by CRON_SECRET — same secret used by the overdue-check cron job.
// Safe to call repeatedly (idempotent cleanup at the start).
// Remove this file after you no longer need to reseed.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMonths, setDate } from "date-fns";

export const dynamic = "force-dynamic";

const DEMO_LINK_TOKEN = "health-demo-avi";
const DEMO_ADDRESS    = "רחוב הברוש 12";

function generateDueDates(startDate: Date, dueDayOfMonth: number, count: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    dates.push(setDate(addMonths(startDate, i), dueDayOfMonth));
  }
  return dates;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Idempotent cleanup ──────────────────────────────────────────────────
  const existingTenant = await prisma.tenant.findUnique({
    where: { linkToken: DEMO_LINK_TOKEN },
  });
  if (existingTenant) {
    await prisma.tenant.delete({ where: { id: existingTenant.id } });
  }
  const existingProp = await prisma.property.findFirst({
    where: { address: DEMO_ADDRESS },
  });
  if (existingProp) {
    await prisma.property.delete({ where: { id: existingProp.id } });
  }

  // ── Landlord ────────────────────────────────────────────────────────────
  let landlord = await prisma.landlord.findUnique({ where: { id: 1 } });
  if (!landlord) {
    landlord = await prisma.landlord.create({ data: { name: "בעל הבית" } });
  }

  // ── Property ────────────────────────────────────────────────────────────
  const property = await prisma.property.create({
    data: {
      landlordId:      landlord.id,
      address:         DEMO_ADDRESS,
      city:            "תל אביב",
      propertyType:    "apartment",
      unitLabel:       "3B",
      occupancyStatus: "occupied",
      monthlyRent:     5800,
      rentCurrency:    "ILS",
      leaseStartDate:  new Date("2025-09-01"),
      leaseEndDate:    new Date("2026-08-31"),
      notes:           "דירת דגם לבדיקת Property Health",
    },
  });

  // ── Tenant ──────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.create({
    data: {
      landlordId:        landlord.id,
      propertyId:        property.id,
      name:              "אבי גלעד",
      email:             "avi.gilad@demo.com",
      phone:             "+972509998877",
      linkToken:         DEMO_LINK_TOKEN,
      preferredLanguage: "he",
      moveInDate:        new Date("2025-09-01"),
      leaseEndDate:      new Date("2026-08-31"),
      paymentMethod:     "העברה בנקאית",
      contractStatus:    "active",
      keysAccessNotes:   "2 מפתחות, שלט חניה",
      notes:             "שוכר דגם — בדיקת ציון בריאות נכס",
    },
  });

  // ── MessageThread (trigger-created; fallback if trigger not active) ─────
  let thread = await prisma.messageThread.findUnique({
    where: { tenantId: tenant.id },
  });
  if (!thread) {
    thread = await prisma.messageThread.create({
      data: { tenantId: tenant.id, status: "open", urgency: "urgent" },
    });
  }

  // ── Messages — plumbing complaint thread, Mar–Jun 2026 ──────────────────
  await prisma.message.createMany({
    data: [
      { threadId: thread.id, tenantId: tenant.id, direction: "inbound",  body: "שלום, שוב יש בעיה עם הצנרת. הברז בשירותים מטפטף כבר שלושה ימים.",                detectedLanguage: "he", createdAt: new Date("2026-03-10T09:00:00Z") },
      { threadId: thread.id, tenantId: tenant.id, direction: "outbound", body: "שלום אבי, תודה שעדכנת. שלחתי שרברב — הוא יגיע ביום חמישי.",                    detectedLanguage: "he", createdAt: new Date("2026-03-10T14:00:00Z") },
      { threadId: thread.id, tenantId: tenant.id, direction: "inbound",  body: "השרברב תיקן, אבל עכשיו יש דליפה קטנה מתחת לכיור במטבח.",                      detectedLanguage: "he", createdAt: new Date("2026-04-22T10:30:00Z") },
      { threadId: thread.id, tenantId: tenant.id, direction: "outbound", body: "ראיתי, מתאם שרברב לבדיקה מחדש. השבוע הקרוב.",                                  detectedLanguage: "he", createdAt: new Date("2026-04-22T16:00:00Z") },
      { threadId: thread.id, tenantId: tenant.id, direction: "inbound",  body: "שלום, חזרה בעיית הצנרת — הפעם לחץ מים נמוך בכל הדירה.",                        detectedLanguage: "he", createdAt: new Date("2026-05-18T08:00:00Z") },
      { threadId: thread.id, tenantId: tenant.id, direction: "inbound",  body: "הלחץ עדיין בעיה. האם יוצא שרברב השבוע?",                                        detectedLanguage: "he", createdAt: new Date("2026-06-01T09:15:00Z") },
    ],
  });
  await prisma.messageThread.update({
    where: { id: thread.id },
    data: {
      unreadCount:   2,
      lastMessageAt: new Date("2026-06-01T09:15:00Z"),
      urgency:       "urgent",
      status:        "open",
      summary:       "שוכר מדווח על בעיות צנרת חוזרות",
    },
  });

  // ── Jobs ────────────────────────────────────────────────────────────────
  await prisma.job.createMany({
    data: [
      { propertyId: property.id, tenantId: tenant.id, title: "תיקון ברז מטפטף בשירותים",                category: "repair",      priority: "medium", status: "completed",   dueDate: new Date("2026-03-13"), contractorName: 'אינסטלציה בע"מ', notes: "ברז חדש הותקן",                                      createdAt: new Date("2026-03-10T09:30:00Z") },
      { propertyId: property.id, tenantId: tenant.id, title: "תיקון דליפה מתחת לכיור מטבח",            category: "repair",      priority: "medium", status: "completed",   dueDate: new Date("2026-04-25"), contractorName: 'אינסטלציה בע"מ', notes: "צינור חיבור הוחלף",                                  createdAt: new Date("2026-04-22T11:00:00Z") },
      { propertyId: property.id, tenantId: tenant.id, title: "בדיקת לחץ מים נמוך — כל הדירה",          category: "repair",      priority: "high",   status: "in_progress", dueDate: new Date("2026-05-22"), contractorName: 'אינסטלציה בע"מ', notes: "ממתין לאיתור מקור הבעיה",                             createdAt: new Date("2026-05-18T08:30:00Z") },
      { propertyId: property.id, tenantId: tenant.id, title: "חזרת בעיית לחץ מים — לבדיקה דחופה",     category: "repair",      priority: "urgent", status: "new",         dueDate: new Date("2026-06-08"),                                   notes: "הבעיה חזרה אחרי התיקון האחרון",   sourceThreadId: thread.id, createdAt: new Date("2026-06-01T09:45:00Z") },
      { propertyId: property.id,                      title: "בדיקה שנתית — רחוב הברוש 3B",            category: "inspection",  priority: "low",    status: "new",         dueDate: new Date("2026-07-01"),                                   notes: "בדיקה שגרתית",                                             createdAt: new Date("2026-06-01T10:00:00Z") },
      { propertyId: property.id,                      title: "תיקוני צבע קטנים — מסדרון",              category: "maintenance", priority: "low",    status: "completed",   dueDate: new Date("2026-03-20"), contractorName: "צבע טרי",        notes: "עבודה הושלמה",                                             createdAt: new Date("2026-03-15T11:00:00Z") },
    ],
  });

  // ── RentSchedule + Payments ─────────────────────────────────────────────
  const schedule = await prisma.rentSchedule.create({
    data: { tenantId: tenant.id, amount: 5800, dueDayOfMonth: 1, startDate: new Date("2025-09-01"), active: true },
  });
  const today = new Date("2026-06-06");
  const dueDates = generateDueDates(new Date("2025-09-01"), 1, 12);
  await prisma.payment.createMany({
    data: dueDates.map((d) => ({
      tenantId:       tenant.id,
      propertyId:     property.id,
      rentScheduleId: schedule.id,
      amount:         5800,
      currency:       "ILS",
      type:           "rent" as const,
      status:         d < today ? ("paid" as const) : ("pending" as const),
      dueDate:        d,
      paidDate:       d < today ? d : null,
    })),
  });

  return NextResponse.json({
    ok: true,
    propertyId: property.id,
    tenantId:   tenant.id,
    url:        `/properties/${property.id}`,
    message:    `Demo tenant "אבי גלעד" created. Open /properties/${property.id} to see the Property Health card.`,
  });
}
