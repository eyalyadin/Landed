import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/summary — lightweight aggregate counts for the app-shell chrome.
// Always responds 200 (falls back to zeros) so the shell never crashes.
export async function GET() {
  try {
    const [unreadAgg, openTaskCount, overdueCount, landlord] = await Promise.all([
      prisma.messageThread.aggregate({ _sum: { unreadCount: true } }),
      prisma.job.count({ where: { status: { not: "completed" } } }),
      prisma.payment.count({ where: { status: "overdue", type: "rent" } }),
      prisma.landlord.findFirst({ select: { name: true } }),
    ]);

    return NextResponse.json({
      unreadCount: unreadAgg._sum.unreadCount ?? 0,
      openTaskCount,
      overdueCount,
      landlordName: landlord?.name ?? "Landlord",
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
