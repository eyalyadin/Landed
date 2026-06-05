import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/telegram";
import { detectLanguage } from "@/lib/lang";

export const dynamic = "force-dynamic";

// POST /api/messages/send { tenantId, body }
// Sends a Telegram message to the tenant and stores it as an outbound Message in their thread.
export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as
    | { tenantId?: number | string; body?: string }
    | null;

  const rawId = payload?.tenantId;
  const tenantId = rawId !== undefined ? Number(rawId) : NaN;
  const body = payload?.body?.trim();

  if (!Number.isFinite(tenantId) || !body) {
    return NextResponse.json(
      { error: "tenantId (number) and non-empty body are required" },
      { status: 400 },
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { thread: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "tenant not found" }, { status: 404 });
  }
  if (!tenant.telegramChatId) {
    return NextResponse.json(
      { error: "tenant is not linked to Telegram yet" },
      { status: 409 },
    );
  }
  if (!tenant.thread) {
    return NextResponse.json(
      { error: "tenant message thread not found" },
      { status: 409 },
    );
  }

  try {
    const sent = await sendMessage(tenant.telegramChatId, body);
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          threadId: tenant.thread.id,
          tenantId: tenant.id,
          direction: "outbound",
          body,
          detectedLanguage: detectLanguage(body),
          telegramMessageId: String(sent.message_id),
        },
      }),
      prisma.messageThread.update({
        where: { id: tenant.thread.id },
        data: { lastMessageAt: new Date() },
      }),
    ]);
    return NextResponse.json({ ok: true, message });
  } catch (err) {
    return NextResponse.json(
      { error: `failed to send: ${(err as Error).message}` },
      { status: 502 },
    );
  }
}
