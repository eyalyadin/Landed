import { NextRequest } from "next/server";
import { corsPreflight, jsonWithCors } from "@/lib/cors";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function iso(d: Date | null | undefined) {
  return d ? d.toISOString() : null;
}

function mapJobStatus(status: string) {
  if (status === "completed") return "resolved";
  if (status === "in_progress") return "in_progress";
  return "open";
}

function mapPaymentStatus(status: string) {
  if (status === "paid" || status === "overdue") return status;
  return "pending";
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
        property: true,
        messages: { orderBy: { createdAt: "asc" } },
        jobs: {
          orderBy: { createdAt: "desc" },
          include: { attachments: { orderBy: { createdAt: "asc" } } },
        },
        rentSchedules: { orderBy: { startDate: "desc" } },
        payments: { where: { type: "rent" }, orderBy: { dueDate: "asc" } },
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
      unitLabel: tenant.property?.unitLabel ?? tenant.property?.address ?? tenant.name,
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
      maintenanceRequests: tenant.jobs.map((job) => ({
        id: job.id,
        tenantId: job.tenantId ?? tenant.id,
        title: job.title,
        description: job.description ?? job.notes,
        status: mapJobStatus(job.status),
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        photos: job.attachments.map((attachment) => ({
          id: attachment.id,
          maintenanceRequestId: attachment.jobId,
          telegramFileId: attachment.telegramFileId,
          caption: attachment.caption,
          createdAt: attachment.createdAt.toISOString(),
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
      rentInvoices: tenant.payments.map((payment) => ({
        id: payment.id,
        tenantId: payment.tenantId,
        rentScheduleId: payment.rentScheduleId,
        dueDate: payment.dueDate.toISOString(),
        amount: Number(payment.amount),
        status: mapPaymentStatus(payment.status),
        paidDate: iso(payment.paidDate),
        createdAt: payment.createdAt.toISOString(),
      })),
    })),
  });
}
