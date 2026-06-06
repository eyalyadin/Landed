import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/telegram";
import { jerusalemTodayUTCDate } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { reminderText } from "@/lib/reminders";
import { ensureUpcomingInvoices } from "@/lib/rent";

// GET /api/cron/check-overdue?secret=CRON_SECRET — called daily by Railway cron.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = jerusalemTodayUTCDate();

  // Extend rolling 12-month window for all active schedules before the overdue sweep.
  const topUpCreated = await ensureUpcomingInvoices();

  const newlyOverdue = await prisma.payment.findMany({
    where: { status: "pending", dueDate: { lt: today } },
    include: { tenant: true },
  });

  if (newlyOverdue.length === 0) {
    return NextResponse.json({
      ok: true,
      date: formatDate(today),
      topUpCreated,
      markedOverdue: 0,
      remindersSent: 0,
    });
  }

  await prisma.payment.updateMany({
    where: { id: { in: newlyOverdue.map((p) => p.id) } },
    data: { status: "overdue" },
  });

  const byTenant = new Map<
    number,
    { chatId: string | null; lang: string | null; count: number; total: number }
  >();
  for (const pay of newlyOverdue) {
    const entry = byTenant.get(pay.tenantId) ?? {
      chatId: pay.tenant.telegramChatId,
      lang: pay.tenant.preferredLanguage,
      count: 0,
      total: 0,
    };
    entry.count += 1;
    entry.total += Number(pay.amount);
    byTenant.set(pay.tenantId, entry);
  }

  let remindersSent = 0;
  for (const { chatId, lang, count, total } of byTenant.values()) {
    if (!chatId) continue;
    try {
      await sendMessage(chatId, reminderText(lang, count, total));
      remindersSent += 1;
    } catch (err) {
      console.error("overdue reminder failed:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    date: formatDate(today),
    topUpCreated,
    markedOverdue: newlyOverdue.length,
    remindersSent,
  });
}
