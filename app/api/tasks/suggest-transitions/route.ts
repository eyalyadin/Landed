import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsPreflight, jsonWithCors } from "@/lib/cors";
import { inferTaskTransitions, type SuggestMessage } from "@/lib/gemini";
import { assertOwnedProperty, requireAppUserForApi } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function POST(req: NextRequest) {
  const appUser = await requireAppUserForApi();
  if (!appUser) return jsonWithCors(req, { error: "unauthorized" }, { status: 401 });

  const payload = (await req.json().catch(() => null)) as { propertyId?: unknown } | null;
  const propertyId = Number(payload?.propertyId);

  if (!Number.isFinite(propertyId)) {
    return jsonWithCors(req, { error: "propertyId required" }, { status: 400 });
  }

  const ownedProperty = await assertOwnedProperty(propertyId, appUser.id);
  if (!ownedProperty) return jsonWithCors(req, { error: "property not found" }, { status: 404 });

  // Always respond 200 — this is a non-critical hint feature; any error → empty suggestions.
  try {
    // Open jobs for this property
    const jobs = await prisma.job.findMany({
      where: { propertyId, property: { ownerId: appUser.id }, status: { not: "completed" } },
      select: { id: true, title: true, status: true },
    });

    if (jobs.length === 0) {
      return jsonWithCors(req, { ok: true, suggestions: [] });
    }

    // First tenant (most recent)
    const tenant = await prisma.tenant.findFirst({
      where: { propertyId, property: { ownerId: appUser.id } },
      orderBy: { createdAt: "desc" },
      include: { thread: { select: { id: true } } },
    });

    if (!tenant?.thread) {
      return jsonWithCors(req, { ok: true, suggestions: [] });
    }

    // Last 10 messages oldest→newest
    const rawMsgs = await prisma.message.findMany({
      where: { threadId: tenant.thread.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { direction: true, body: true },
    });

    if (rawMsgs.length === 0) {
      return jsonWithCors(req, { ok: true, suggestions: [] });
    }

    const messages: SuggestMessage[] = rawMsgs.reverse().map((m) => ({
      direction: m.direction as "inbound" | "outbound",
      body: m.body,
    }));

    const suggestions = await inferTaskTransitions(jobs, messages);
    return jsonWithCors(req, { ok: true, suggestions });
  } catch {
    return jsonWithCors(req, { ok: true, suggestions: [] });
  }
}
