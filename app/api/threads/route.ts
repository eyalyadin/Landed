import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUserForApi, unauthorized } from "@/lib/current-user";

export const dynamic = "force-dynamic";

// GET /api/threads - owned message threads with last message preview and linking info.
export async function GET() {
  try {
    const appUser = await requireAppUserForApi();
    if (!appUser) return unauthorized();

    const threads = await prisma.messageThread.findMany({
      where: { tenant: { property: { ownerId: appUser.id } } },
      orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            phone: true,
            propertyId: true,
            telegramChatId: true,
            linkToken: true,
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

    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? null;

    const result = threads.map((t) => {
      const linked = Boolean(t.tenant.telegramChatId);
      const inviteLink =
        !linked && botUsername
          ? `https://t.me/${botUsername}?start=${t.tenant.linkToken}`
          : null;
      return {
        id: t.id,
        tenantId: t.tenantId,
        tenantName: t.tenant.name,
        tenantPhone: t.tenant.phone ?? null,
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
        linked,
        inviteLink,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
