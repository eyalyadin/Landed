import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/calendar — all calendar events.
export async function GET() {
  try {
    const events = await prisma.calendarEvent.findMany({
      orderBy: { start: "asc" },
      include: {
        property: { select: { address: true } },
        tenant: { select: { name: true } },
      },
    });

    return NextResponse.json(
      events.map((e) => ({
        id: e.id,
        title: e.title,
        eventType: e.eventType,
        propertyId: e.propertyId,
        propertyAddress: e.property?.address ?? null,
        tenantId: e.tenantId,
        tenantName: e.tenant?.name ?? null,
        jobId: e.jobId,
        start: e.start.toISOString(),
        end: e.end?.toISOString() ?? null,
        status: e.status,
        notes: e.notes,
      }))
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
