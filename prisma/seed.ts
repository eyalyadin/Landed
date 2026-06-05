import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { addMonths, setDate } from "date-fns";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Generate 12 monthly due dates from a start date and day-of-month.
function generateDueDates(startDate: Date, dueDayOfMonth: number, count: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    const base = addMonths(startDate, i);
    const date = setDate(base, dueDayOfMonth);
    dates.push(date);
  }
  return dates;
}

async function main() {
  console.log("Starting seed...");

  // Truncate all tables and reset identity sequences so the seed is safe to re-run.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "CalendarEvent", "Payment", "RentSchedule",
      "JobAttachment", "Job",
      "Document", "Vendor",
      "Message", "MessageThread",
      "Tenant", "Property", "Landlord"
    RESTART IDENTITY CASCADE
  `);
  console.log("Tables cleared.");

  // ── Landlord ──────────────────────────────────────────────────────────────
  const landlord = await prisma.landlord.create({ data: { name: "בעל הבית" } });
  console.log(`Landlord: ${landlord.name} (id=${landlord.id})`);

  // ── Properties ───────────────────────────────────────────────────────────
  const [prop1, prop2, prop3, prop4, prop5, prop6] = await Promise.all([
    prisma.property.create({
      data: {
        landlordId: landlord.id,
        address: "רחוב האלון 123, דירה 4A",
        city: "תל אביב",
        propertyType: "apartment",
        unitLabel: "4A",
        occupancyStatus: "occupied",
        monthlyRent: 6500,
        rentCurrency: "ILS",
        leaseStartDate: new Date("2025-03-01"),
        leaseEndDate: new Date("2026-02-28"),
        managerName: "ועד הבית",
        notes: "דירת פינה, אור טבעי מעולה",
      },
    }),
    prisma.property.create({
      data: {
        landlordId: landlord.id,
        address: "שדרות האורן 456",
        city: "חיפה",
        propertyType: "house",
        occupancyStatus: "occupied",
        monthlyRent: 7200,
        rentCurrency: "ILS",
        leaseStartDate: new Date("2024-08-01"),
        leaseEndDate: new Date("2026-07-31"),
        notes: "בית פרטי עם גינה",
      },
    }),
    prisma.property.create({
      data: {
        landlordId: landlord.id,
        address: "רחוב השוק 789, יח׳ 202",
        city: "תל אביב",
        propertyType: "condo",
        unitLabel: "202",
        occupancyStatus: "occupied",
        monthlyRent: 8000,
        rentCurrency: "ILS",
        leaseStartDate: new Date("2025-01-01"),
        leaseEndDate: new Date("2025-12-31"),
        managerName: "חברת ניהול",
      },
    }),
    prisma.property.create({
      data: {
        landlordId: landlord.id,
        address: "רחוב האלמה 321",
        city: "ירושלים",
        propertyType: "apartment",
        occupancyStatus: "vacant",
        monthlyRent: 5800,
        rentCurrency: "ILS",
        notes: "שופץ לאחרונה, מוכן לשוכר חדש",
      },
    }),
    prisma.property.create({
      data: {
        landlordId: landlord.id,
        address: "מרפסת הים 555, יח׳ 8",
        city: "הרצליה",
        propertyType: "apartment",
        unitLabel: "8",
        occupancyStatus: "occupied",
        monthlyRent: 5500,
        rentCurrency: "ILS",
        leaseStartDate: new Date("2025-06-01"),
        leaseEndDate: new Date("2026-05-31"),
        managerName: "חברת ניהול",
      },
    }),
    prisma.property.create({
      data: {
        landlordId: landlord.id,
        address: "שדרות המשלחת 888",
        city: "באר שבע",
        propertyType: "house",
        occupancyStatus: "occupied",
        monthlyRent: 4200,
        rentCurrency: "ILS",
        leaseStartDate: new Date("2024-12-01"),
        leaseEndDate: new Date("2025-11-30"),
      },
    }),
  ]);
  console.log("6 properties created.");

  // ── Tenants (trigger creates MessageThread for each) ──────────────────────
  const [t1, t2, t3, t4, t5] = await Promise.all([
    prisma.tenant.create({
      data: {
        landlordId: landlord.id,
        propertyId: prop1.id,
        name: "דנה לוי",
        email: "dana.levi@email.com",
        phone: "+972501112233",
        linkToken: "seed-token-dana",
        preferredLanguage: "he",
        moveInDate: new Date("2025-03-01"),
        leaseEndDate: new Date("2026-02-28"),
        paymentMethod: "העברה בנקאית",
        contractStatus: "active",
        keysAccessNotes: "2 מפתחות, שלט",
        notes: "שוכרת שקטה, משלמת בזמן",
      },
    }),
    prisma.tenant.create({
      data: {
        landlordId: landlord.id,
        propertyId: prop2.id,
        name: "יוסי כהן",
        email: "yossi.cohen@email.com",
        phone: "+972502223344",
        linkToken: "seed-token-yossi",
        preferredLanguage: "he",
        moveInDate: new Date("2024-08-01"),
        leaseEndDate: new Date("2026-07-31"),
        paymentMethod: "צ׳ק",
        contractStatus: "active",
        keysAccessNotes: "3 מפתחות, שלט לחניה",
        notes: "לעקוב אחר תשלום מאוחר",
      },
    }),
    prisma.tenant.create({
      data: {
        landlordId: landlord.id,
        propertyId: prop3.id,
        name: "Sarah Johnson",
        email: "sarah.j@email.com",
        phone: "+972503334455",
        linkToken: "seed-token-sarah",
        preferredLanguage: "en",
        moveInDate: new Date("2025-01-01"),
        leaseEndDate: new Date("2025-12-31"),
        paymentMethod: "הוראת קבע",
        contractStatus: "expiring-soon",
        keysAccessNotes: "2 מפתחות, כרטיס חניה",
      },
    }),
    prisma.tenant.create({
      data: {
        landlordId: landlord.id,
        propertyId: prop5.id,
        name: "אורן ברק",
        email: "oren.barak@email.com",
        phone: "+972504445566",
        linkToken: "seed-token-oren",
        preferredLanguage: "he",
        moveInDate: new Date("2025-06-01"),
        leaseEndDate: new Date("2026-05-31"),
        paymentMethod: "העברה בנקאית",
        contractStatus: "active",
        keysAccessNotes: "2 מפתחות",
        notes: "שוכר חדש, מגיב מהר",
      },
    }),
    prisma.tenant.create({
      data: {
        landlordId: landlord.id,
        propertyId: prop6.id,
        name: "מיכל שפירא",
        email: "michal.s@email.com",
        phone: "+972505556677",
        linkToken: "seed-token-michal",
        preferredLanguage: "he",
        moveInDate: new Date("2024-12-01"),
        leaseEndDate: new Date("2025-11-30"),
        paymentMethod: "צ׳ק",
        contractStatus: "active",
        keysAccessNotes: "4 מפתחות, קוד אזעקה: 1234",
        notes: "שילמה חלקית, ממתינה לשאר",
      },
    }),
  ]);
  console.log("5 tenants created (trigger auto-created 5 MessageThread rows).");

  // ── Load threads created by trigger ──────────────────────────────────────
  const threads = await Promise.all([
    prisma.messageThread.findUnique({ where: { tenantId: t1.id } }),
    prisma.messageThread.findUnique({ where: { tenantId: t2.id } }),
    prisma.messageThread.findUnique({ where: { tenantId: t3.id } }),
    prisma.messageThread.findUnique({ where: { tenantId: t4.id } }),
    prisma.messageThread.findUnique({ where: { tenantId: t5.id } }),
  ]);

  // If trigger isn't active (local dev), create threads manually.
  const [th1, th2, th3, th4, th5] = await Promise.all(
    threads.map((th, i) => {
      const tenantId = [t1.id, t2.id, t3.id, t4.id, t5.id][i];
      if (th) return Promise.resolve(th);
      return prisma.messageThread.create({
        data: {
          tenantId,
          status: i === 0 || i === 3 ? "resolved" : "open",
          urgency: i === 1 || i === 4 ? "urgent" : "normal",
        },
      });
    })
  );

  // ── Seed messages into threads ────────────────────────────────────────────
  await prisma.message.createMany({
    data: [
      // Thread 2 — יוסי כהן (overdue payment)
      {
        threadId: th2!.id,
        tenantId: t2.id,
        direction: "inbound",
        body: "שלום, רציתי לעדכן אותך לגבי שכר הדירה. היה לי תיקון רכב בלתי צפוי והחודש קצת קשה.",
        detectedLanguage: "he",
        createdAt: new Date("2026-06-04T10:00:00Z"),
      },
      {
        threadId: th2!.id,
        tenantId: t2.id,
        direction: "outbound",
        body: "שלום יוסי, תודה שעדכנת. מתי אתה מצפה לשלם?",
        detectedLanguage: "he",
        createdAt: new Date("2026-06-04T14:30:00Z"),
      },
      {
        threadId: th2!.id,
        tenantId: t2.id,
        direction: "inbound",
        body: "אשלם את שכר הדירה עד יום שישי, היה לי הוצאה בלתי צפויה",
        detectedLanguage: "he",
        createdAt: new Date("2026-06-05T09:15:00Z"),
      },
      // Thread 3 — Sarah Johnson (lease renewal)
      {
        threadId: th3!.id,
        tenantId: t3.id,
        direction: "inbound",
        body: "Hi! My lease is coming up at the end of the year. Can we discuss renewing the lease? I'd like to stay another year.",
        detectedLanguage: "en",
        createdAt: new Date("2026-06-03T16:45:00Z"),
      },
      // Thread 5 — מיכל שפירא (solar heater)
      {
        threadId: th5!.id,
        tenantId: t5.id,
        direction: "inbound",
        body: "בוקר טוב. הדוד שמש התחיל להשמיע רעשי גוף אמש. הוא עדיין עובד אבל אני מודאגת שזו בעיה.",
        detectedLanguage: "he",
        createdAt: new Date("2026-06-05T07:45:00Z"),
      },
      {
        threadId: th5!.id,
        tenantId: t5.id,
        direction: "inbound",
        body: "הדוד שמש שוב משמיע רעשים מוזרים",
        detectedLanguage: "he",
        createdAt: new Date("2026-06-05T08:30:00Z"),
      },
    ],
  });

  // Update thread metadata
  await Promise.all([
    prisma.messageThread.update({
      where: { id: th2!.id },
      data: { unreadCount: 1, lastMessageAt: new Date("2026-06-05T09:15:00Z"), urgency: "urgent", status: "open" },
    }),
    prisma.messageThread.update({
      where: { id: th3!.id },
      data: { unreadCount: 1, lastMessageAt: new Date("2026-06-03T16:45:00Z"), status: "open" },
    }),
    prisma.messageThread.update({
      where: { id: th5!.id },
      data: { unreadCount: 2, lastMessageAt: new Date("2026-06-05T08:30:00Z"), urgency: "urgent", status: "open" },
    }),
  ]);
  console.log("Messages seeded.");

  // ── Vendors ───────────────────────────────────────────────────────────────
  await prisma.vendor.createMany({
    data: [
      { name: "Cool Air HVAC",      phone: "+972501001001", email: "service@coolair.co.il",  category: "ac_hvac",       serviceArea: "גוש דן",          isPreferred: true,  contactPerson: "מיקי",        rating: 4.8, activeJobs: 2, completedJobs: 14, notes: "מגיב מהר, מחירים טובים. לשאול עבור מיקי." },
      { name: 'אינסטלציה בע"מ',    phone: "+972502002002", email: "info@plumbing.co.il",     category: "plumbing",      serviceArea: "תל אביב, חיפה",   isPreferred: true,  contactPerson: "אינסטלציה",  rating: 4.5, activeJobs: 1, completedJobs: 22, notes: "שירות חירום 24/7" },
      { name: "כל-תיקון",           phone: "+972503003003",                                   category: "handyman",      serviceArea: "ירושלים",         isPreferred: false, contactPerson: "כל-תיקון",   rating: 3.9, activeJobs: 0, completedJobs: 7,  notes: "טוב לתיקונים קטנים" },
      { name: "ברק חשמל",           phone: "+972504004004", email: "jobs@barak.co.il",        category: "electrician",   serviceArea: "כל הארץ",         isPreferred: true,  contactPerson: "ברק חשמל",   rating: 4.7, activeJobs: 3, completedJobs: 31 },
      { name: "צבע טרי",            phone: "+972505005005", email: "quotes@fresh.co.il",      category: "painting",      serviceArea: "מרכז",            isPreferred: false, contactPerson: "צבע טרי",    rating: 4.2, activeJobs: 0, completedJobs: 9,  notes: "משמש לסיבוב דירות. עבודה איכותית." },
      { name: "מנעולן מהיר",        phone: "+972506006006",                                   category: "locksmith",     serviceArea: "תל אביב",         isPreferred: true,  contactPerson: "מנעולן",     rating: 4.6, activeJobs: 1, completedJobs: 18, notes: "זמין 24/7" },
      { name: "נקיון כסף",          phone: "+972507007007", email: "book@silver.co.il",       category: "cleaning",      serviceArea: "מרכז ודרום",       isPreferred: false, contactPerson: "נקיון כסף",  rating: 4.3, activeJobs: 0, completedJobs: 12, notes: "ניקוי עמוק לפינוי דירות" },
      { name: "מומחי מכשירים",      phone: "+972508008008",                                   category: "appliance_repair", serviceArea: "כל הארץ",      isPreferred: false, contactPerson: "מומחי מכשירים", rating: 4.0, activeJobs: 1, completedJobs: 6 },
    ],
  });
  console.log("Vendors seeded.");

  // ── Documents ─────────────────────────────────────────────────────────────
  await prisma.document.createMany({
    data: [
      { propertyId: prop1.id, documentName: "חוזה שכירות — רחוב האלון 4A",    documentType: "rental_contract",   uploadedAt: new Date("2025-03-01") },
      { propertyId: prop1.id, documentName: "פרוטוקול כניסה — רחוב האלון 4A", documentType: "inventory",         uploadedAt: new Date("2025-03-01") },
      { propertyId: prop1.id, documentName: "מסירת מפתחות — רחוב האלון 4A",   documentType: "keys_record",       uploadedAt: new Date("2025-03-01") },
      { propertyId: prop2.id, documentName: "חוזה שכירות — שדרות האורן",       documentType: "rental_contract",   uploadedAt: new Date("2024-08-01") },
      { propertyId: prop3.id, documentName: "חוזה שכירות — רחוב השוק 202",    documentType: "rental_contract",   uploadedAt: new Date("2025-01-01") },
      { propertyId: prop3.id, documentName: "קבלת פיקדון — רחוב השוק",        documentType: "deposit_document",  uploadedAt: new Date("2025-01-01") },
      { propertyId: prop5.id, documentName: "חוזה שכירות — מרפסת הים יח׳ 8", documentType: "rental_contract",   uploadedAt: new Date("2025-06-01") },
      { propertyId: prop6.id, documentName: "חוזה שכירות — שדרות המשלחת",     documentType: "rental_contract",   uploadedAt: new Date("2024-12-01") },
    ],
  });
  console.log("Documents seeded.");

  // ── Jobs (maintenance) ────────────────────────────────────────────────────
  await prisma.job.createMany({
    data: [
      { propertyId: prop1.id, tenantId: t1.id, title: "תיקון מזגן — משמיע רעש", category: "repair", priority: "high", status: "in_progress", dueDate: new Date("2026-06-06"), contractorName: "Cool Air HVAC", notes: "השוכרת דיווחה על רעש מהמזגן", createdAt: new Date("2026-06-02T10:00:00Z") },
      { propertyId: prop2.id, tenantId: t2.id, title: "מעקב תשלום שכר דירה מאוחר", category: "payment_followup", priority: "urgent", status: "waiting_on_tenant", dueDate: new Date("2026-06-07"), notes: "השוכר אמר שישלם עד יום שישי", sourceThreadId: th2!.id, createdAt: new Date("2026-06-04T15:00:00Z") },
      { propertyId: prop2.id, tenantId: t2.id, title: "תיקון ברז דולף במטבח", category: "repair", priority: "medium", status: "new", dueDate: new Date("2026-06-10"), notes: "ברז כיור המטבח מטפטף", createdAt: new Date("2026-06-03T09:00:00Z") },
      { propertyId: prop3.id, tenantId: t3.id, title: "שיחה על חידוש חוזה", category: "contract_renewal", priority: "medium", status: "new", dueDate: new Date("2026-06-15"), notes: "השוכרת רוצה לחדש לעוד שנה", sourceThreadId: th3!.id, createdAt: new Date("2026-06-03T17:00:00Z") },
      { propertyId: prop4.id, title: "הכנת דירה לשוכר חדש", category: "maintenance", priority: "high", status: "in_progress", dueDate: new Date("2026-06-20"), notes: "ניקוי עמוק, תיקוני צבע, החלפת שטיח", createdAt: new Date("2026-05-28T11:00:00Z") },
      { propertyId: prop4.id, title: "החלפת סוללות גלאי עשן", category: "maintenance", priority: "medium", status: "new", dueDate: new Date("2026-06-12"), createdAt: new Date("2026-06-01T08:00:00Z") },
      { propertyId: prop4.id, title: "תיקון ידית שער שבורה", category: "repair", priority: "low", status: "new", dueDate: new Date("2026-06-25"), createdAt: new Date("2026-05-30T14:00:00Z") },
      { propertyId: prop6.id, tenantId: t5.id, title: "בדיקת דוד שמש", category: "repair", priority: "high", status: "new", dueDate: new Date("2026-06-06"), notes: "משמיע רעשי גוף — לתאם שרברב", sourceThreadId: th5!.id, createdAt: new Date("2026-06-05T08:45:00Z") },
      { propertyId: prop1.id, title: "בדיקה שנתית", category: "inspection", priority: "low", status: "new", dueDate: new Date("2026-07-15"), notes: "בדיקת נכס שנתית שגרתית", createdAt: new Date("2026-06-01T09:00:00Z") },
    ],
  });
  console.log("Jobs seeded.");

  // ── Rent schedules + payments ─────────────────────────────────────────────
  async function createRentSchedule(
    tenantId: number,
    propertyId: number,
    amount: number,
    dueDayOfMonth: number,
    startDate: Date,
  ) {
    const schedule = await prisma.rentSchedule.create({
      data: { tenantId, amount, dueDayOfMonth, startDate, active: true },
    });
    const dueDates = generateDueDates(startDate, dueDayOfMonth, 12);
    await prisma.payment.createMany({
      data: dueDates.map((d) => ({
        tenantId,
        propertyId,
        rentScheduleId: schedule.id,
        amount,
        currency: "ILS",
        type: "rent" as const,
        status: "pending" as const,
        dueDate: d,
      })),
    });
    return schedule;
  }

  await Promise.all([
    createRentSchedule(t1.id, prop1.id, 6500, 1, new Date("2025-03-01")),
    createRentSchedule(t2.id, prop2.id, 7200, 1, new Date("2024-08-01")),
    createRentSchedule(t3.id, prop3.id, 8000, 1, new Date("2025-01-01")),
    createRentSchedule(t4.id, prop5.id, 5500, 1, new Date("2025-06-01")),
    createRentSchedule(t5.id, prop6.id, 4200, 1, new Date("2024-12-01")),
  ]);
  console.log("Rent schedules + payments seeded.");

  // ── Calendar events ───────────────────────────────────────────────────────
  await prisma.calendarEvent.createMany({
    data: [
      { title: "מועד גביית שכר דירה — כל הנכסים", eventType: "rent_due",        start: new Date("2026-07-01"), notes: "גביית שכר דירה חודשית" },
      { title: "חוזה מסתיים — רחוב השוק 202",    eventType: "lease_end",       propertyId: prop3.id, tenantId: t3.id, start: new Date("2025-12-31"), notes: "Sarah Johnson — לדון בחידוש" },
      { title: "חוזה מסתיים — שדרות המשלחת",      eventType: "lease_end",       propertyId: prop6.id, tenantId: t5.id, start: new Date("2025-11-30"), notes: "מיכל שפירא — חוזה פג" },
      { title: "בדיקה שנתית — רחוב האלון",        eventType: "inspection",      propertyId: prop1.id, start: new Date("2026-07-15"), notes: "בדיקת נכס שנתית שגרתית" },
      { title: "תזכורת חידוש חוזה — רחוב השוק",   eventType: "renewal_reminder", propertyId: prop3.id, tenantId: t3.id, start: new Date("2025-10-01"), notes: "90 יום לפני סיום חוזה" },
      { title: "מועד גביית שכר דירה — כל הנכסים", eventType: "rent_due",        start: new Date("2026-06-01"), notes: "גביית שכר דירה חודשית" },
      { title: "חוזה מסתיים — רחוב האלון 4A",     eventType: "lease_end",       propertyId: prop1.id, tenantId: t1.id, start: new Date("2026-02-28"), notes: "דנה לוי — חוזה מסתיים" },
    ],
  });
  console.log("Calendar events seeded.");

  console.log("\n✅ Seed complete: 1 landlord, 6 properties, 5 tenants, 5 threads, messages, vendors, documents, jobs, schedules.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
