import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { suggestReply } from "@/lib/gemini";

export const dynamic = "force-dynamic";

// POST /api/suggest { tenantId } → AI-suggested reply in the tenant's language.
export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as { tenantId?: number | string } | null;
  const rawId = payload?.tenantId;
  const tenantId = rawId !== undefined ? Number(rawId) : NaN;

  if (!Number.isFinite(tenantId)) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { thread: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "tenant not found" }, { status: 404 });
  }
  if (!tenant.thread) {
    return NextResponse.json({ error: "tenant has no message thread" }, { status: 409 });
  }

  // Last ~10 messages from the thread, oldest → newest for a natural transcript.
  const recent = await prisma.message.findMany({
    where: { threadId: tenant.thread.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  if (recent.length === 0) {
    return NextResponse.json(
      { error: "no messages yet to base a suggestion on" },
      { status: 409 },
    );
  }
  const messages = recent.reverse().map((m) => ({ direction: m.direction, body: m.body }));

  try {
    const suggestion = await suggestReply(messages);
    return NextResponse.json({ ok: true, suggestion });
  } catch (err) {
    return NextResponse.json(
      { error: `suggestion failed: ${(err as Error).message}` },
      { status: 502 },
    );
  }
}
