import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Valid job statuses (matches JobStatus enum)
const VALID = new Set(["new", "in_progress", "waiting_on_tenant", "waiting_on_vendor", "completed"]);

// PATCH /api/maintenance/[id] { status } — kept for backward compat (prefer /api/jobs/[id])
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const jobId = parseInt(id, 10);
  if (!Number.isFinite(jobId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const payload = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = payload?.status;

  if (!status || !VALID.has(status)) {
    return NextResponse.json({ error: `invalid status — valid: ${[...VALID].join(", ")}` }, { status: 400 });
  }

  try {
    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { status: status as "new" | "in_progress" | "waiting_on_tenant" | "waiting_on_vendor" | "completed" },
    });
    return NextResponse.json({ ok: true, status: updated.status });
  } catch {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }
}
