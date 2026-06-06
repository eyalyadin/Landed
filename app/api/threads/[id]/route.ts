import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFoundResponse, requireAppUserForApi, unauthorized } from "@/lib/current-user";

export const dynamic = "force-dynamic";

// GET /api/threads/[id] - messages in an owned thread, oldest to newest.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const appUser = await requireAppUserForApi();
  if (!appUser) return unauthorized();

  const { id } = await params;
  const threadId = parseInt(id, 10);
  if (!Number.isFinite(threadId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    const thread = await prisma.messageThread.findFirst({
      where: { id: threadId, tenant: { property: { ownerId: appUser.id } } },
      select: { id: true },
    });
    if (!thread) return notFoundResponse();

    const messages = await prisma.message.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        threadId: true,
        tenantId: true,
        direction: true,
        body: true,
        photoFileId: true,
        detectedLanguage: true,
        isInternalNote: true,
        createdAt: true,
      },
    });

    await prisma.messageThread.update({
      where: { id: thread.id },
      data: { unreadCount: 0 },
    }).catch(() => {});

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
