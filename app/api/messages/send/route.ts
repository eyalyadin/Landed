import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/telegram";
import { detectLanguage } from "@/lib/lang";
import { corsPreflight, jsonWithCors } from "@/lib/cors";
import { requireAppUserForApi } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

// Updates the SuggestionFeedback row created by /api/suggest when a message is sent.
// Silently ignored if feedbackId is absent or the row no longer exists.
async function recordFeedback(
  feedbackId: number | null,
  sentBody: string,
  originalSuggestion: string | null,
  ownerId: number,
): Promise<void> {
  if (!feedbackId || !Number.isFinite(feedbackId)) return;
  const action = originalSuggestion && sentBody === originalSuggestion ? "accepted" : "edited";
  await prisma.suggestionFeedback
    .updateMany({
      where: { id: feedbackId, tenant: { property: { ownerId } } },
      data: {
        action,
        finalText: action === "edited" ? sentBody : null,
      },
    })
    .catch(() => {}); // ignore if row was already deleted
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

// POST /api/messages/send { tenantId, body, feedbackId?, originalSuggestion? }
// feedbackId: the SuggestionFeedback row id returned by /api/suggest.
// originalSuggestion: the exact text returned by the suggest endpoint.
// If feedbackId is present and body === originalSuggestion → action "accepted".
// If feedbackId is present and body !== originalSuggestion → action "edited", finalText = body.
export async function POST(req: NextRequest) {
  const appUser = await requireAppUserForApi();
  if (!appUser) return jsonWithCors(req, { error: "unauthorized" }, { status: 401 });

  const payload = (await req.json().catch(() => null)) as
    | {
        tenantId?: number | string;
        body?: string;
        feedbackId?: number | string;
        originalSuggestion?: string;
      }
    | null;

  const rawId = payload?.tenantId;
  const tenantId = rawId !== undefined ? Number(rawId) : NaN;
  const body = payload?.body?.trim();
  const feedbackId = payload?.feedbackId ? Number(payload.feedbackId) : null;
  const originalSuggestion = payload?.originalSuggestion ?? null;

  if (!Number.isFinite(tenantId) || !body) {
    return jsonWithCors(
      req,
      { error: "tenantId (number) and non-empty body are required" },
      { status: 400 },
    );
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, property: { ownerId: appUser.id } },
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
      await recordFeedback(feedbackId, body, originalSuggestion, appUser.id);
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

    await recordFeedback(feedbackId, body, originalSuggestion, appUser.id);

    return jsonWithCors(req, { ok: true, message });
  } catch (err) {
    if (allowLocalUnlinkedMessages) {
      const message = await createOutboundMessage({
        tenantId: tenant.id,
        threadId: tenant.thread.id,
        body,
      });
      await recordFeedback(feedbackId, body, originalSuggestion, appUser.id);
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
