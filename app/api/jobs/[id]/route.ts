import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_STATUS = new Set([
  "new", "in_progress", "waiting_on_tenant", "waiting_on_vendor", "completed"
]);

// PATCH /api/jobs/[id] { status, priority, contractorName, notes }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const jobId = parseInt(id, 10);
  if (!Number.isFinite(jobId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const payload = (await req.json().catch(() => null)) as {
    status?: string;
    priority?: string;
    contractorName?: string;
    notes?: string;
  } | null;

  if (payload?.status && !VALID_STATUS.has(payload.status)) {
    return NextResponse.json(
      { error: `invalid status — valid: ${[...VALID_STATUS].join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...(payload?.status && { status: payload.status as "new" | "in_progress" | "waiting_on_tenant" | "waiting_on_vendor" | "completed" }),
        ...(payload?.priority && { priority: payload.priority as "low" | "medium" | "high" | "urgent" }),
        ...(payload?.contractorName !== undefined && { contractorName: payload.contractorName }),
        ...(payload?.notes !== undefined && { notes: payload.notes }),
      },
    });
    return NextResponse.json({ ok: true, status: updated.status });
  } catch {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }
}
