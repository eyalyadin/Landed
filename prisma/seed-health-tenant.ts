// seed-health-tenant.ts
// ---------------------------------------------------------------------------
// Adds ONE demo tenant (אבי גלעד, linkToken "health-demo-avi") to an EXISTING
// database for testing the Property Health card.  It is ADDITIVE — it does NOT
// truncate any tables.  Safe to run against local dev or the live Railway DB.
//
// Idempotent: if the tenant (by linkToken) or the demo property (by address)
// already exists, they are deleted first (cascade removes their
// messages / jobs / payments / thread), then recreated from scratch.
//
// Run:
//   npx tsx prisma/seed-health-tenant.ts          (uses local .env DATABASE_URL)
//   DATABASE_URL=<railway-url> npx tsx prisma/seed-health-tenant.ts  (Railway)
//
// Data overview:
//   • 1 new property   — רחוב הברוש 12, תל אביב
//   • 1 new tenant     — אבי גלעד, linked to that property, Landlord id=1
//   • ~6 messages      — plumbing complaint thread spanning Mar–Jun 2026
//   • 7 jobs           — 4 repair jobs (triggers "repeated issues"), 1 urgent open,
//                        1 completed, 1 inspection
//   • 1 RentSchedule   — ILS 5800/month, mix of paid / pending payments
//
// Exercises these Property Health branches (PropertyHealthCard.tsx):
//   ✓ repeatedCats (repair ≥ 3 times)
//   ✓ urgentOpen (1 high-priority open job)
//   ✓ recentRepairs (4 repairs in the last 12 months)
//   ✓ last60CatCounts (2+ repairs in last 60 days → "N repair issues in 60 days")
//   ✓ lastCompleted (one recently-completed repair)
//   ✓ recentSignals + recommendation (plumbing inspection)
//   ✓ payments all up-to-date (no overdue) → good payment factor
// ---------------------------------------------------------------------------

import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { addMonths, setDate } from "date-fns";

// Prefer DATABASE_PUBLIC_URL when running locally against Railway
// (the internal postgres.railway.internal host is only reachable inside Railway).
// The public URL requires SSL; use a direct pg.Pool to control SSL options.
const connectionString =
  process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL!;
const isPublicUrl = !!process.env.DATABASE_PUBLIC_URL;

// Append SSL params for the public Railway URL.
// pg v8 treats sslmode=require as verify-full; uselibpqcompat=true restores
// the standard libpq behaviour where 'require' means "encrypt but don't verify cert".
const effectiveConnectionString =
  isPublicUrl && !connectionString.includes("sslmode")
    ? `${connectionString}?uselibpqcompat=true&sslmode=require`
    : connectionString;

const pool = new Pool({ connectionString: effectiveConnectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Mirror of seed.ts generateDueDates helper
function generateDueDates(startDate: Date, dueDayOfMonth: number, count: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    const base = addMonths(startDate, i);
    dates.push(setDate(base, dueDayOfMonth));
  }
  return dates;
}

// Demo identifiers — used for idempotent cleanup
const DEMO_LINK_TOKEN = "health-demo-avi";
const DEMO_ADDRESS    = "רחוב הברוש 12";

async function main() {
  const dbHost = connectionString?.match(/@([^:/]+)/)?.[1] ?? "(unknown)";
  console.log(`▶ seed-health-tenant: starting... (host: ${dbHost}, ssl: ${isPublicUrl})`);

  // ── 1. Idempotent cleanup ────────────────────────────────────────────────
  // Delete existing demo tenant (cascade removes thread, messages, jobs, payments)
  const existingTenant = await prisma.tenant.findUnique({
    where: { linkToken: DEMO_LINK_TOKEN },
  });
  if (existingTenant) {
    await prisma.tenant.delete({ where: { id: existingTenant.id } });
    console.log(`  Removed existing demo tenant (id=${existingTenant.id})`);
  }

  // Delete existing demo property (cascade removes jobs, documents, payments)
  const existingProp = await prisma.property.findFirst({
    where: { address: DEMO_ADDRESS },
  });
  if (existingProp) {
    await prisma.property.delete({ where: { id: existingProp.id } });
    console.log(`  Removed existing demo property (id=${existingProp.id})`);
  }

  // ── 2. Ensure landlord exists (use id=1 from the main seed) ──────────────
  let landlord = await prisma.landlord.findUnique({ where: { id: 1 } });
  if (!landlord) {
    landlord = await prisma.landlord.create({ data: { name: "בעל הבית" } });
    console.log(`  Created landlord (id=${landlord.id})`);
  }

  // ── 3. Create demo property ───────────────────────────────────────────────
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
  console.log(`  Property created: "${property.address}" (id=${property.id})`);

  // ── 4. Create demo tenant (DB trigger auto-creates MessageThread) ─────────
  const tenant = await prisma.tenant.create({
    data: {
      landlordId:      landlord.id,
      propertyId:      property.id,
      name:            "אבי גלעד",
      email:           "avi.gilad@demo.com",
      phone:           "+972509998877",
      linkToken:       DEMO_LINK_TOKEN,
      preferredLanguage: "he",
      moveInDate:      new Date("2025-09-01"),
      leaseEndDate:    new Date("2026-08-31"),
      paymentMethod:   "העברה בנקאית",
      contractStatus:  "active",
      keysAccessNotes: "2 מפתחות, שלט חניה",
      notes:           "שוכר דגם — משמש לבדיקת ציון בריאות נכס",
    },
  });
  console.log(`  Tenant created: "${tenant.name}" (id=${tenant.id})`);

  // ── 5. Load or create MessageThread ──────────────────────────────────────
  // The DB trigger creates the thread automatically; fetch it.
  // Fall back to manual creation if the trigger isn't active in local dev.
  let thread = await prisma.messageThread.findUnique({
    where: { tenantId: tenant.id },
  });
  if (!thread) {
    thread = await prisma.messageThread.create({
      data: { tenantId: tenant.id, status: "open", urgency: "urgent" },
    });
    console.log(`  MessageThread created manually (trigger not active in this env)`);
  } else {
    console.log(`  MessageThread found (trigger active, id=${thread.id})`);
  }

  // ── 6. Seed messages — plumbing complaint narrative, Mar–Jun 2026 ─────────
  // These represent 3 months of back-and-forth about a recurring plumbing issue.
  await prisma.message.createMany({
    data: [
      {
        threadId: thread.id,
        tenantId: tenant.id,
        direction: "inbound",
        body: "שלום, שוב יש בעיה עם הצנרת. הברז בשירותים מטפטף כבר שלושה ימים.",
        detectedLanguage: "he",
        createdAt: new Date("2026-03-10T09:00:00Z"),
      },
      {
        threadId: thread.id,
        tenantId: tenant.id,
        direction: "outbound",
        body: "שלום אבי, תודה שעדכנת. שלחתי שרברב — הוא יגיע ביום חמישי.",
        detectedLanguage: "he",
        createdAt: new Date("2026-03-10T14:00:00Z"),
      },
      {
        threadId: thread.id,
        tenantId: tenant.id,
        direction: "inbound",
        body: "השרברב תיקן, אבל עכשיו יש דליפה קטנה מתחת לכיור במטבח.",
        detectedLanguage: "he",
        createdAt: new Date("2026-04-22T10:30:00Z"),
      },
      {
        threadId: thread.id,
        tenantId: tenant.id,
        direction: "outbound",
        body: "ראיתי, מתאם שרברב לבדיקה מחדש. השבוע הקרוב.",
        detectedLanguage: "he",
        createdAt: new Date("2026-04-22T16:00:00Z"),
      },
      {
        threadId: thread.id,
        tenantId: tenant.id,
        direction: "inbound",
        body: "שלום, חזרה בעיית הצנרת — הפעם לחץ מים נמוך בכל הדירה.",
        detectedLanguage: "he",
        createdAt: new Date("2026-05-18T08:00:00Z"),
      },
      {
        threadId: thread.id,
        tenantId: tenant.id,
        direction: "inbound",
        body: "הלחץ עדיין בעיה. האם יוצא שרברב השבוע?",
        detectedLanguage: "he",
        createdAt: new Date("2026-06-01T09:15:00Z"),
      },
    ],
  });

  await prisma.messageThread.update({
    where: { id: thread.id },
    data: {
      unreadCount:   2,
      lastMessageAt: new Date("2026-06-01T09:15:00Z"),
      urgency:       "urgent",
      status:        "open",
      summary:       "שוכר מדווח על בעיות צנרת חוזרות — ברז מטפטף, דליפה מתחת לכיור, לחץ מים נמוך.",
    },
  });
  console.log("  Messages seeded (6 messages, thread updated).");

  // ── 7. Seed jobs — designed to exercise every Health scoring branch ────────
  //
  //  category breakdown:
  //    repair × 4  → repeatedCats fires (≥3) + recentRepairs (all within 12 mo.)
  //    inspection × 1
  //    maintenance × 1
  //
  //  Within the last 60 days (>= 2026-04-07):
  //    2026-04-22 repair   ← inside 60-day window
  //    2026-05-18 repair   ← inside 60-day window
  //    → "2 repair issues reported in the last 60 days" signal fires
  //
  //  priority:
  //    1 urgent open → urgency penalty + urgent-task recommendation
  //
  //  status:
  //    1 completed (recent) → "...completed recently" signal
  await prisma.job.createMany({
    data: [
      // Repair 1 — oldest, completed (resolved the dripping tap)
      {
        propertyId:    property.id,
        tenantId:      tenant.id,
        title:         "תיקון ברז מטפטף בשירותים",
        category:      "repair",
        priority:      "medium",
        status:        "completed",
        dueDate:       new Date("2026-03-13"),
        contractorName: 'אינסטלציה בע"מ',
        notes:         "ברז חדש הותקן",
        createdAt:     new Date("2026-03-10T09:30:00Z"),
      },
      // Repair 2 — completed (kitchen sink leak)
      {
        propertyId:    property.id,
        tenantId:      tenant.id,
        title:         "תיקון דליפה מתחת לכיור מטבח",
        category:      "repair",
        priority:      "medium",
        status:        "completed",
        dueDate:       new Date("2026-04-25"),
        contractorName: 'אינסטלציה בע"מ',
        notes:         "צינור חיבור הוחלף",
        createdAt:     new Date("2026-04-22T11:00:00Z"),
      },
      // Repair 3 — in progress, within last 60 days (low water pressure)
      {
        propertyId:    property.id,
        tenantId:      tenant.id,
        title:         "בדיקת לחץ מים נמוך — כל הדירה",
        category:      "repair",
        priority:      "high",
        status:        "in_progress",
        dueDate:       new Date("2026-05-22"),
        contractorName: 'אינסטלציה בע"מ',
        notes:         "ממתין לאיתור מקור הבעיה בצנרת הראשית",
        createdAt:     new Date("2026-05-18T08:30:00Z"),
      },
      // Repair 4 — NEW open URGENT (latest — drives recommendation + urgent signal)
      {
        propertyId:    property.id,
        tenantId:      tenant.id,
        title:         "חזרת בעיית לחץ מים — לבדיקה דחופה",
        category:      "repair",
        priority:      "urgent",
        status:        "new",
        dueDate:       new Date("2026-06-08"),
        notes:         "השוכר מדווח שהבעיה חזרה אחרי התיקון האחרון",
        sourceThreadId: thread.id,
        createdAt:     new Date("2026-06-01T09:45:00Z"),
      },
      // Inspection — generic annual check
      {
        propertyId:  property.id,
        title:       "בדיקה שנתית — רחוב הברוש 3B",
        category:    "inspection",
        priority:    "low",
        status:      "new",
        dueDate:     new Date("2026-07-01"),
        notes:       "בדיקה שגרתית",
        createdAt:   new Date("2026-06-01T10:00:00Z"),
      },
      // Maintenance — painting touch-up (adds category variety)
      {
        propertyId:  property.id,
        title:       "תיקוני צבע קטנים — מסדרון",
        category:    "maintenance",
        priority:    "low",
        status:      "completed",
        dueDate:     new Date("2026-03-20"),
        contractorName: "צבע טרי",
        createdAt:   new Date("2026-03-15T11:00:00Z"),
      },
    ],
  });
  console.log("  Jobs seeded (6 jobs).");

  // ── 8. Rent schedule + payments — paid history, no overdue ────────────────
  // 9 months paid (Sep 2025 – May 2026), Jun 2026 pending, 3 future pending.
  const schedule = await prisma.rentSchedule.create({
    data: {
      tenantId:      tenant.id,
      amount:        5800,
      dueDayOfMonth: 1,
      startDate:     new Date("2025-09-01"),
      active:        true,
    },
  });

  const dueDates = generateDueDates(new Date("2025-09-01"), 1, 12);
  const today = new Date("2026-06-06");

  await prisma.payment.createMany({
    data: dueDates.map((d) => {
      // Payments whose due date is before today are marked paid
      const isPast = d < today;
      return {
        tenantId:       tenant.id,
        propertyId:     property.id,
        rentScheduleId: schedule.id,
        amount:         5800,
        currency:       "ILS",
        type:           "rent" as const,
        status:         isPast ? ("paid" as const) : ("pending" as const),
        dueDate:        d,
        // paidDate is the same as dueDate for simplicity (paid on time)
        paidDate:       isPast ? d : null,
      };
    }),
  });
  console.log("  RentSchedule + 12 payments seeded (past=paid, future=pending).");

  console.log(`
✅ Demo tenant ready:
   Property : "${property.address}" (id=${property.id})
   Tenant   : "${tenant.name}" (id=${tenant.id}, linkToken=${DEMO_LINK_TOKEN})
   Thread   : id=${thread.id}
   Open to  : /properties/${property.id}
`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
