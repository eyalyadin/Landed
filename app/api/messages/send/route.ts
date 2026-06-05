import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/telegram";
import { detectLanguage } from "@/lib/lang";
import { corsPreflight, jsonWithCors } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

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
    return jsonWithCors(
      req,
      { error: "tenantId and non-empty body are required" },
      { status: 400 },
    );
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return jsonWithCors(req, { error: "tenant not found" }, { status: 404 });
  }
  const allowLocalUnlinkedMessages =
    process.env.ALLOW_LOCAL_UNLINKED_MESSAGES === "true" &&
    process.env.NODE_ENV !== "production";

  if (!tenant.telegramChatId) {
    if (allowLocalUnlinkedMessages) {
      const message = await prisma.message.create({
        data: {
          tenantId: tenant.id,
          direction: "outbound",
          body,
          detectedLanguage: detectLanguage(body),
        },
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
    const message = await prisma.message.create({
      data: {
        tenantId: tenant.id,
        direction: "outbound",
        body,
        detectedLanguage: detectLanguage(body),
        telegramMessageId: String(sent.message_id),
      },
    });
    return jsonWithCors(req, { ok: true, message });
  } catch (err) {
    if (allowLocalUnlinkedMessages) {
      const message = await prisma.message.create({
        data: {
          tenantId: tenant.id,
          direction: "outbound",
          body,
          detectedLanguage: detectLanguage(body),
        },
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
