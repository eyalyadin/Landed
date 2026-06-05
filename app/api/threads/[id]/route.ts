import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/threads/[id] — messages in a thread, oldest → newest.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const threadId = parseInt(id, 10);
  if (!Number.isFinite(threadId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    const messages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        threadId: true,
        tenantId: true,
        direction: true,
        body: true,
        detectedLanguage: true,
        isInternalNote: true,
        createdAt: true,
      },
    });

    // Mark thread as read
    await prisma.messageThread.update({
      where: { id: threadId },
      data: { unreadCount: 0 },
    }).catch(() => { /* non-fatal */ });

    return NextResponse.json(
      messages.map((m) => ({
        ...m,
        id: m.id,
        createdAt: m.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
