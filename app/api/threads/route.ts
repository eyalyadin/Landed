import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/threads — all message threads with last message preview.
export async function GET() {
  try {
    const threads = await prisma.messageThread.findMany({
      orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            propertyId: true,
            property: { select: { address: true, unitLabel: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, direction: true, createdAt: true },
        },
      },
    });

    const result = threads.map((t) => ({
      id: t.id,
      tenantId: t.tenantId,
      tenantName: t.tenant.name,
      propertyId: t.tenant.propertyId,
      propertyAddress: t.tenant.property?.address ?? null,
      propertyUnitLabel: t.tenant.property?.unitLabel ?? null,
      unreadCount: t.unreadCount,
      lastMessageAt: t.lastMessageAt?.toISOString() ?? null,
      lastMessagePreview: t.messages[0]?.body ?? null,
      status: t.status,
      urgency: t.urgency,
      summary: t.summary,
      suggestedNextAction: t.suggestedNextAction,
    }));

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
