import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID = new Set(["open", "in_progress", "resolved"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payload = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = payload?.status;

  if (!status || !VALID.has(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  try {
    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: { status: status as "open" | "in_progress" | "resolved" },
    });
    return NextResponse.json({ ok: true, status: updated.status });
  } catch {
    return NextResponse.json({ error: "request not found" }, { status: 404 });
  }
}
