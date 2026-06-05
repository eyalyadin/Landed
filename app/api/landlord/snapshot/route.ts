import { NextRequest } from "next/server";
import { corsPreflight, jsonWithCors } from "@/lib/cors";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function iso(d: Date | null | undefined) {
  return d ? d.toISOString() : null;
}

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function GET(req: NextRequest) {
  const [landlords, tenants] = await Promise.all([
    prisma.landlord.findMany({ orderBy: { id: "asc" } }),
    prisma.tenant.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        maintenanceRequests: {
          orderBy: { createdAt: "desc" },
          include: { photos: { orderBy: { createdAt: "asc" } } },
        },
        rentSchedules: { orderBy: { startDate: "desc" } },
        rentInvoices: { orderBy: { dueDate: "asc" } },
      },
    }),
  ]);

  return jsonWithCors(req, {
    ok: true,
    generatedAt: new Date().toISOString(),
    botUsername: process.env.TELEGRAM_BOT_USERNAME ?? null,
    landlords: landlords.map((landlord) => ({
      id: landlord.id,
      name: landlord.name,
    })),
    tenants: tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      unitLabel: tenant.unitLabel,
      phone: tenant.phone,
      telegramLinked: Boolean(tenant.telegramChatId),
      preferredLanguage: tenant.preferredLanguage,
      createdAt: tenant.createdAt.toISOString(),
      messages: tenant.messages.map((message) => ({
        id: message.id,
        tenantId: message.tenantId,
        direction: message.direction,
        body: message.body,
        detectedLanguage: message.detectedLanguage,
        createdAt: message.createdAt.toISOString(),
      })),
      maintenanceRequests: tenant.maintenanceRequests.map((request) => ({
        id: request.id,
        tenantId: request.tenantId,
        title: request.title,
        description: request.description,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
        photos: request.photos.map((photo) => ({
          id: photo.id,
          maintenanceRequestId: photo.maintenanceRequestId,
          telegramFileId: photo.telegramFileId,
          caption: photo.caption,
          createdAt: photo.createdAt.toISOString(),
        })),
      })),
      rentSchedules: tenant.rentSchedules.map((schedule) => ({
        id: schedule.id,
        tenantId: schedule.tenantId,
        amount: Number(schedule.amount),
        dueDayOfMonth: schedule.dueDayOfMonth,
        startDate: schedule.startDate.toISOString(),
        endDate: iso(schedule.endDate),
        active: schedule.active,
      })),
      rentInvoices: tenant.rentInvoices.map((invoice) => ({
        id: invoice.id,
        tenantId: invoice.tenantId,
        rentScheduleId: invoice.rentScheduleId,
        dueDate: invoice.dueDate.toISOString(),
        amount: Number(invoice.amount),
        status: invoice.status,
        paidDate: iso(invoice.paidDate),
        createdAt: invoice.createdAt.toISOString(),
      })),
    })),
  });
}
