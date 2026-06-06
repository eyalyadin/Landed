import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_STATUS = new Set([
  "new", "in_progress", "waiting_on_tenant", "waiting_on_vendor", "completed",
]);
const VALID_PRIORITY = new Set(["low", "medium", "high", "urgent"]);
const VALID_CATEGORY = new Set([
  "repair", "payment_followup", "contract_renewal",
  "tenant_issue", "inspection", "maintenance",
]);

// PATCH /api/jobs/[id] { status?, priority?, contractorName?, notes?, title?, description?, dueDate?, category? }
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
    title?: string;
    description?: string;
    dueDate?: string | null;
    category?: string;
  } | null;

  if (payload?.status && !VALID_STATUS.has(payload.status)) {
    return NextResponse.json(
      { error: `invalid status — valid: ${[...VALID_STATUS].join(", ")}` },
      { status: 400 },
    );
  }
  if (payload?.priority && !VALID_PRIORITY.has(payload.priority)) {
    return NextResponse.json(
      { error: `invalid priority — valid: ${[...VALID_PRIORITY].join(", ")}` },
      { status: 400 },
    );
  }
  if (payload?.category && !VALID_CATEGORY.has(payload.category)) {
    return NextResponse.json(
      { error: `invalid category — valid: ${[...VALID_CATEGORY].join(", ")}` },
      { status: 400 },
    );
  }

  // Build the update data conditionally — only include keys explicitly present in the payload
  type JobData = {
    status?: "new" | "in_progress" | "waiting_on_tenant" | "waiting_on_vendor" | "completed";
    priority?: "low" | "medium" | "high" | "urgent";
    category?: "repair" | "payment_followup" | "contract_renewal" | "tenant_issue" | "inspection" | "maintenance";
    contractorName?: string | null;
    notes?: string | null;
    title?: string;
    description?: string | null;
    dueDate?: Date | null;
  };

  const data: JobData = {};

  if (payload?.status) data.status = payload.status as JobData["status"];
  if (payload?.priority) data.priority = payload.priority as JobData["priority"];
  if (payload?.category) data.category = payload.category as JobData["category"];
  if (payload?.contractorName !== undefined) data.contractorName = payload.contractorName || null;
  if (payload?.notes !== undefined) data.notes = payload.notes || null;
  if (payload?.title) data.title = payload.title.trim();
  if (payload?.description !== undefined) data.description = payload.description || null;
  if ("dueDate" in (payload ?? {})) {
    data.dueDate = payload!.dueDate ? new Date(payload!.dueDate) : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no updatable fields provided" }, { status: 400 });
  }

  try {
    const updated = await prisma.job.update({
      where: { id: jobId },
      data,
    });
    return NextResponse.json({ ok: true, status: updated.status });
  } catch {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }
}
