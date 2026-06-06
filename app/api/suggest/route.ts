import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { suggestReply } from "@/lib/gemini";
import { corsPreflight, jsonWithCors } from "@/lib/cors";
import { assertOwnedTenant, requireAppUserForApi } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

// POST /api/suggest { tenantId }
// Returns { ok, suggestion, feedbackId }.
// feedbackId is the SuggestionFeedback row created with action="dismissed".
// The send endpoint will update it to "accepted" or "edited" when the message is sent.
export async function POST(req: NextRequest) {
  const appUser = await requireAppUserForApi();
  if (!appUser) return jsonWithCors(req, { error: "unauthorized" }, { status: 401 });

  const payload = (await req.json().catch(() => null)) as { tenantId?: number | string } | null;
  const rawId = payload?.tenantId;
  const tenantId = rawId !== undefined ? Number(rawId) : NaN;

  if (!Number.isFinite(tenantId)) {
    return jsonWithCors(req, { error: "tenantId is required" }, { status: 400 });
  }

  const ownedTenant = await assertOwnedTenant(tenantId, appUser.id);
  if (!ownedTenant) {
    return jsonWithCors(req, { error: "tenant not found" }, { status: 404 });
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, property: { ownerId: appUser.id } },
    include: { thread: true },
  });
  if (!tenant) return jsonWithCors(req, { error: "tenant not found" }, { status: 404 });
  if (!tenant.thread) {
    return jsonWithCors(req, { error: "tenant has no message thread" }, { status: 409 });
  }

  // Last ~10 messages, oldest → newest for a natural transcript.
  const recent = await prisma.message.findMany({
    where: { threadId: tenant.thread.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  if (recent.length === 0) {
    return jsonWithCors(
      req,
      { error: "no messages yet to base a suggestion on" },
      { status: 409 },
    );
  }
  const messages = recent.reverse().map((m) => ({ direction: m.direction, body: m.body }));

  try {
    // Pass landlordId so suggestReply can use personalised preferences.
    const suggestion = await suggestReply(messages, tenant.landlordId);

    // Record the suggestion. Default action is "dismissed" — will be updated to
    // "accepted" or "edited" if the landlord actually sends it via /api/messages/send.
    const feedback = await prisma.suggestionFeedback.create({
      data: {
        landlordId:    tenant.landlordId,
        tenantId:      tenant.id,
        propertyId:    tenant.propertyId ?? undefined,
        promptContext: messages,
        suggestedText: suggestion,
        action:        "dismissed",
        surface:       "message_reply",
      },
    });

    return jsonWithCors(req, { ok: true, suggestion, feedbackId: feedback.id });
  } catch (err) {
    return jsonWithCors(
      req,
      { error: `suggestion failed: ${(err as Error).message}` },
      { status: 502 },
    );
  }
}
