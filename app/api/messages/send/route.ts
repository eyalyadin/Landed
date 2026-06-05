import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/telegram";
import { detectLanguage } from "@/lib/lang";

export const dynamic = "force-dynamic";

// POST /api/messages/send { tenantId, body }
// Sends a Telegram message to the tenant and stores it as an outbound Message.
// NOTE: landlord-session auth is added in Phase 3 (login). Until then this is open.
export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as
    | { tenantId?: string; body?: string }
    | null;

  const tenantId = payload?.tenantId;
  const body = payload?.body?.trim();
  if (!tenantId || !body) {
    return NextResponse.json(
      { error: "tenantId and non-empty body are required" },
      { status: 400 },
    );
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: "tenant not found" }, { status: 404 });
  }
  if (!tenant.telegramChatId) {
    return NextResponse.json(
      { error: "tenant is not linked to Telegram yet" },
      { status: 409 },
    );
  }

  try {
    const sent = await sendMessage(tenant.telegramChatId, body);
    const message = await prisma.message.create({
      data: {
        tenantId: tenant.id,
        direction: "outbound",
        body,
        detectedLanguage: detectLanguage(body),
        telegramMessageId: String(sent.message_id),
      },
    });
    return NextResponse.json({ ok: true, message });
  } catch (err) {
    return NextResponse.json(
      { error: `failed to send: ${(err as Error).message}` },
      { status: 502 },
    );
  }
}
