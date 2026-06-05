import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [landlords, properties, tenants, linkedTenants, messages, openJobs] =
      await Promise.all([
        prisma.landlord.count(),
        prisma.property.count(),
        prisma.tenant.count(),
        prisma.tenant.count({ where: { telegramChatId: { not: null } } }),
        prisma.message.count(),
        prisma.job.count({ where: { status: { not: "completed" } } }),
      ]);
    return NextResponse.json({
      ok: true,
      db: "up",
      landlords,
      properties,
      tenants,
      linkedTenants,
      messages,
      openJobs,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, db: "down", error: (err as Error).message },
      { status: 503 },
    );
  }
}
