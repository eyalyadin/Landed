import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsPreflight, jsonWithCors } from "@/lib/cors";
import { draftVendorNotice, type SuggestMessage } from "@/lib/gemini";
import { requireAppUserForApi } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function POST(req: NextRequest) {
  const appUser = await requireAppUserForApi();
  if (!appUser) return jsonWithCors(req, { error: "unauthorized" }, { status: 401 });

  const payload = (await req.json().catch(() => null)) as {
    tenantId?: unknown;
    vendorName?: unknown;
    vendorPhone?: unknown;
    jobTitle?: unknown;
  } | null;

  const tenantId = Number(payload?.tenantId);
  const vendorName = String(payload?.vendorName ?? "").trim();
  const vendorPhone = String(payload?.vendorPhone ?? "").trim();
  const jobTitle = String(payload?.jobTitle ?? "").trim();

  if (!Number.isFinite(tenantId) || !vendorName || !vendorPhone || !jobTitle) {
    return jsonWithCors(req, { error: "tenantId, vendorName, vendorPhone, jobTitle required" }, { status: 400 });
  }

  // Fallback template used when Gemini is unavailable / throws.
  function fallbackDraft(): string {
    return (
      `שלום, תיאמנו עבורך את ${vendorName} (${vendorPhone}) לטיפול בבקשת התחזוקה שלך. ` +
      `ניתן ליצור איתם קשר ישירות לתיאום מועד.\n\n` +
      `Hi, we've arranged for ${vendorName} (${vendorPhone}) to handle your maintenance request. ` +
      `You can contact them directly to schedule a time.`
    );
  }

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, property: { ownerId: appUser.id } },
      select: { name: true, thread: { select: { id: true } } },
    });

    if (!tenant) {
      return jsonWithCors(req, { error: "tenant not found" }, { status: 404 });
    }

    // Load last 8 messages for language detection.
    const rawMsgs = tenant.thread
      ? await prisma.message.findMany({
          where: { threadId: tenant.thread.id },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { direction: true, body: true },
        })
      : [];

    const recentMessages: SuggestMessage[] = rawMsgs
      .reverse()
      .map((m) => ({ direction: m.direction as "inbound" | "outbound", body: m.body }));

    let draft: string;
    try {
      draft = await draftVendorNotice({
        tenantName: tenant.name,
        vendorName,
        vendorPhone,
        jobTitle,
        recentMessages,
      });
    } catch {
      draft = fallbackDraft();
    }

    return jsonWithCors(req, { ok: true, draft });
  } catch {
    return jsonWithCors(req, { ok: true, draft: fallbackDraft() });
  }
}
