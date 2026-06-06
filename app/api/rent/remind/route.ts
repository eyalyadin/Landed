// POST /api/rent/remind  { tenantId: number }
//
// Sends an on-demand overdue-rent reminder to the tenant via Telegram.
// Returns { ok, sent, count?, total?, reason? }.
//
// This endpoint crosses a system boundary (sends a message to the tenant) but
// it is user-initiated by a deliberate button press — no implicit side-effects.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/telegram";
import { reminderText } from "@/lib/reminders";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const tenantId = Number(body.tenantId);

  if (!Number.isFinite(tenantId) || tenantId <= 0) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { telegramChatId: true, preferredLanguage: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "tenant not found" }, { status: 404 });
  }

  if (!tenant.telegramChatId) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason:
        "Tenant is not linked to Telegram. Share the invite link so they can connect the bot first.",
    });
  }

  const overdue = await prisma.payment.findMany({
    where: { tenantId, type: "rent", status: "overdue" },
    select: { amount: true },
  });

  if (overdue.length === 0) {
    return NextResponse.json({ ok: true, sent: false, reason: "no overdue payments" });
  }

  const count = overdue.length;
  const total = overdue.reduce((sum, p) => sum + Number(p.amount), 0);

  try {
    await sendMessage(
      tenant.telegramChatId,
      reminderText(tenant.preferredLanguage, count, total),
    );
  } catch (err) {
    console.error("on-demand reminder failed:", err);
    return NextResponse.json(
      { error: "Failed to send Telegram message" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, sent: true, count, total });
}
