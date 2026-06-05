import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/telegram";
import { jerusalemTodayUTCDate } from "@/lib/dates";
import { formatILS, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function reminderText(lang: string | null, count: number, total: number): string {
  const amount = formatILS(total);
  if (lang === "en") {
    return (
      `Friendly reminder: you have ${count} overdue rent payment(s) totaling ${amount}. ` +
      `Please arrange payment as soon as possible. Thank you!`
    );
  }
  return (
    `תזכורת ידידותית: יש ${count} תשלומי שכר דירה באיחור בסך ${amount}. ` +
    `נא להסדיר את התשלום בהקדם האפשרי. תודה!`
  );
}

// GET /api/cron/check-overdue?secret=CRON_SECRET — called daily by Railway cron.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = jerusalemTodayUTCDate();

  const newlyOverdue = await prisma.payment.findMany({
    where: { status: "pending", dueDate: { lt: today } },
    include: { tenant: true },
  });

  if (newlyOverdue.length === 0) {
    return NextResponse.json({
      ok: true,
      date: formatDate(today),
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
    markedOverdue: newlyOverdue.length,
    remindersSent,
  });
}
