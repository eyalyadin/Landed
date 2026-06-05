import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/telegram";
import { detectLanguage } from "@/lib/lang";
import { corsPreflight, jsonWithCors } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

async function createOutboundMessage({
  tenantId,
  threadId,
  body,
  telegramMessageId,
}: {
  tenantId: number;
  threadId: number;
  body: string;
  telegramMessageId?: string;
}) {
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        threadId,
        tenantId,
        direction: "outbound",
        body,
        detectedLanguage: detectLanguage(body),
        telegramMessageId,
      },
    }),
    prisma.messageThread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    }),
  ]);
  return message;
}

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
    return jsonWithCors(
      req,
      { error: "tenantId (number) and non-empty body are required" },
      { status: 400 },
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { thread: true },
  });
  if (!tenant) {
    return jsonWithCors(req, { error: "tenant not found" }, { status: 404 });
  }
  if (!tenant.thread) {
    return jsonWithCors(
      req,
      { error: "tenant message thread not found" },
      { status: 409 },
    );
  }

  const allowLocalUnlinkedMessages =
    process.env.ALLOW_LOCAL_UNLINKED_MESSAGES === "true" &&
    process.env.NODE_ENV !== "production";

  if (!tenant.telegramChatId) {
    if (allowLocalUnlinkedMessages) {
      const message = await createOutboundMessage({
        tenantId: tenant.id,
        threadId: tenant.thread.id,
        body,
      });
      return jsonWithCors(req, { ok: true, message, delivery: "local-only" });
    }

    return jsonWithCors(
      req,
      { error: "tenant is not linked to Telegram yet" },
      { status: 409 },
    );
  }

  try {
    const sent = await sendMessage(tenant.telegramChatId, body);
    const message = await createOutboundMessage({
      tenantId: tenant.id,
      threadId: tenant.thread.id,
      body,
      telegramMessageId: String(sent.message_id),
    });
    return jsonWithCors(req, { ok: true, message });
  } catch (err) {
    if (allowLocalUnlinkedMessages) {
      const message = await createOutboundMessage({
        tenantId: tenant.id,
        threadId: tenant.thread.id,
        body,
      });
      return jsonWithCors(req, {
        ok: true,
        message,
        delivery: "local-only",
        warning: `Telegram send skipped locally: ${(err as Error).message}`,
      });
    }

    return jsonWithCors(
      req,
      { error: `failed to send: ${(err as Error).message}` },
      { status: 502 },
    );
  }
}
