import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsPreflight, jsonWithCors } from "@/lib/cors";
import { requireAppUserForApi } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const STATUS_MAP = new Map([
  ["open", "new"],
  ["resolved", "completed"],
  ["new", "new"],
  ["in_progress", "in_progress"],
  ["waiting_on_tenant", "waiting_on_tenant"],
  ["waiting_on_vendor", "waiting_on_vendor"],
  ["completed", "completed"],
]);

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

// PATCH /api/maintenance/[id] { status } — kept for backward compat (prefer /api/jobs/[id])
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const appUser = await requireAppUserForApi();
  if (!appUser) return jsonWithCors(req, { error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const jobId = parseInt(id, 10);
  if (!Number.isFinite(jobId)) {
    return jsonWithCors(req, { error: "invalid id" }, { status: 400 });
  }

  const payload = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = payload?.status ? STATUS_MAP.get(payload.status) : undefined;

  if (!status) {
    return jsonWithCors(req, { error: "invalid status" }, { status: 400 });
  }

  try {
    const existing = await prisma.job.findFirst({
      where: { id: jobId, property: { ownerId: appUser.id } },
      select: { id: true },
    });
    if (!existing) return jsonWithCors(req, { error: "job not found" }, { status: 404 });

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { status: status as "new" | "in_progress" | "waiting_on_tenant" | "waiting_on_vendor" | "completed" },
    });
    return jsonWithCors(req, { ok: true, status: updated.status });
  } catch {
    return jsonWithCors(req, { error: "job not found" }, { status: 404 });
  }
}
