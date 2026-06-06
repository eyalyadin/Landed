import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUserForApi } from "@/lib/current-user";

export const dynamic = "force-dynamic";

// GET /api/summary — lightweight aggregate counts for the app-shell chrome.
// Always responds 200 (falls back to zeros) so the shell never crashes.
export async function GET() {
  try {
    const appUser = await requireAppUserForApi();
    if (!appUser) {
      return NextResponse.json({
        unreadCount: 0,
        openTaskCount: 0,
        overdueCount: 0,
        landlordName: "Landlord",
      });
    }

    const [unreadAgg, openTaskCount, overdueCount] = await Promise.all([
      prisma.messageThread.aggregate({
        where: { tenant: { property: { ownerId: appUser.id } } },
        _sum: { unreadCount: true },
      }),
      prisma.job.count({ where: { status: { not: "completed" }, property: { ownerId: appUser.id } } }),
      prisma.payment.count({ where: { status: "overdue", type: "rent", property: { ownerId: appUser.id } } }),
    ]);

    return NextResponse.json({
      unreadCount: unreadAgg._sum.unreadCount ?? 0,
      openTaskCount,
      overdueCount,
      landlordName: appUser.name ?? appUser.email,
    });
  } catch {
    return NextResponse.json({
      unreadCount: 0,
      openTaskCount: 0,
      overdueCount: 0,
      landlordName: "Landlord",
    });
  }
}
