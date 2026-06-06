// Non-destructive endpoint to add a Property Health demo property for the
// logged-in Clerk/AppUser owner. Safe to call repeatedly.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUserForApi, unauthorized } from "@/lib/current-user";
import { addMonths, setDate } from "date-fns";

export const dynamic = "force-dynamic";

const DEMO_ADDRESS = "Health Demo Property 12";

function generateDueDates(startDate: Date, dueDayOfMonth: number, count: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    dates.push(setDate(addMonths(startDate, i), dueDayOfMonth));
  }
  return dates;
}

export async function POST() {
  const appUser = await requireAppUserForApi();
  if (!appUser) return unauthorized();

  const linkToken = `health-demo-avi-${appUser.id}`;

  const landlord =
    (await prisma.landlord.findFirst()) ??
    (await prisma.landlord.create({ data: { name: appUser.name ?? "Landlord" } }));

  let property = await prisma.property.findFirst({
    where: { ownerId: appUser.id, address: DEMO_ADDRESS },
  });

  if (!property) {
    property = await prisma.property.create({
      data: {
        ownerId: appUser.id,
        landlordId: landlord.id,
        address: DEMO_ADDRESS,
        city: "Tel Aviv",
        propertyType: "apartment",
        unitLabel: "3B",
        occupancyStatus: "occupied",
        monthlyRent: 5800,
        rentCurrency: "ILS",
        leaseStartDate: new Date("2025-09-01"),
        leaseEndDate: new Date("2026-08-31"),
        notes: "Demo property for Property Health scoring",
      },
    });
  }

  let tenant = await prisma.tenant.findUnique({ where: { linkToken } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        landlordId: landlord.id,
        propertyId: property.id,
        name: "Avi Gilad",
        email: "avi.gilad@demo.local",
        phone: "+972509998877",
        linkToken,
        preferredLanguage: "he",
        moveInDate: new Date("2025-09-01"),
        leaseEndDate: new Date("2026-08-31"),
        paymentMethod: "Bank transfer",
        contractStatus: "active",
        keysAccessNotes: "2 keys, parking remote",
        notes: "Demo tenant for Property Health scoring",
      },
    });
  }

  let thread = await prisma.messageThread.findUnique({
    where: { tenantId: tenant.id },
  });
  if (!thread) {
    thread = await prisma.messageThread.create({
      data: { tenantId: tenant.id, status: "open", urgency: "urgent" },
    });
  }

  const messageCount = await prisma.message.count({ where: { threadId: thread.id } });
  if (messageCount === 0) {
    await prisma.message.createMany({
      data: [
        {
          threadId: thread.id,
          tenantId: tenant.id,
          direction: "inbound",
          body: "Hi, the bathroom tap has been dripping for three days.",
          detectedLanguage: "en",
          createdAt: new Date("2026-03-10T09:00:00Z"),
        },
        {
          threadId: thread.id,
          tenantId: tenant.id,
          direction: "outbound",
          body: "Thanks for flagging it. I will send a plumber this week.",
          detectedLanguage: "en",
          createdAt: new Date("2026-03-10T14:00:00Z"),
        },
        {
          threadId: thread.id,
          tenantId: tenant.id,
          direction: "inbound",
          body: "The water pressure issue is back. Can someone check it urgently?",
          detectedLanguage: "en",
          createdAt: new Date("2026-06-01T09:15:00Z"),
        },
      ],
    });
    await prisma.messageThread.update({
      where: { id: thread.id },
      data: {
        unreadCount: 1,
        lastMessageAt: new Date("2026-06-01T09:15:00Z"),
        urgency: "urgent",
        status: "open",
        summary: "Tenant reports recurring plumbing issues",
      },
    });
  }

  const jobCount = await prisma.job.count({ where: { propertyId: property.id } });
  if (jobCount === 0) {
    await prisma.job.createMany({
      data: [
        {
          propertyId: property.id,
          tenantId: tenant.id,
          title: "Bathroom tap repair",
          category: "repair",
          priority: "medium",
          status: "completed",
          dueDate: new Date("2026-03-13"),
          contractorName: "Demo Plumbing",
          createdAt: new Date("2026-03-10T09:30:00Z"),
        },
        {
          propertyId: property.id,
          tenantId: tenant.id,
          title: "Recurring low water pressure",
          category: "repair",
          priority: "urgent",
          status: "new",
          dueDate: new Date("2026-06-08"),
          sourceThreadId: thread.id,
          createdAt: new Date("2026-06-01T09:45:00Z"),
        },
        {
          propertyId: property.id,
          title: "Annual inspection",
          category: "inspection",
          priority: "low",
          status: "new",
          dueDate: new Date("2026-07-01"),
          createdAt: new Date("2026-06-01T10:00:00Z"),
        },
      ],
    });
  }

  const scheduleCount = await prisma.rentSchedule.count({ where: { tenantId: tenant.id } });
  if (scheduleCount === 0) {
    const schedule = await prisma.rentSchedule.create({
      data: { tenantId: tenant.id, amount: 5800, dueDayOfMonth: 1, startDate: new Date("2025-09-01"), active: true },
    });
    const today = new Date("2026-06-06");
    const dueDates = generateDueDates(new Date("2025-09-01"), 1, 12);
    await prisma.payment.createMany({
      data: dueDates.map((dueDate) => ({
        tenantId: tenant.id,
        propertyId: property.id,
        rentScheduleId: schedule.id,
        amount: 5800,
        currency: "ILS",
        type: "rent" as const,
        status: dueDate < today ? ("paid" as const) : ("pending" as const),
        dueDate,
        paidDate: dueDate < today ? dueDate : null,
      })),
    });
  }

  return NextResponse.json({
    ok: true,
    propertyId: property.id,
    tenantId: tenant.id,
    url: `/properties/${property.id}`,
  });
}
