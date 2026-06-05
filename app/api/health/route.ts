import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lightweight ops/health check: confirms the app is up, the DB is reachable,
// and reports how many landlords/tenants exist (used to verify the seed).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [landlords, tenants, linkedTenants, messages, maintenanceRequests] =
      await Promise.all([
        prisma.landlord.count(),
        prisma.tenant.count(),
        prisma.tenant.count({ where: { telegramChatId: { not: null } } }),
        prisma.message.count(),
        prisma.maintenanceRequest.count(),
      ]);
    return NextResponse.json({
      ok: true,
      db: "up",
      landlords,
      tenants,
      linkedTenants,
      messages,
      maintenanceRequests,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, db: "down", error: (err as Error).message },
      { status: 503 },
    );
  }
}
