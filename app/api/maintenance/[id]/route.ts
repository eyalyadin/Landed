import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsPreflight, jsonWithCors } from "@/lib/cors";

export const dynamic = "force-dynamic";

const VALID = new Set(["open", "in_progress", "resolved"]);

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payload = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = payload?.status;

  if (!status || !VALID.has(status)) {
    return jsonWithCors(req, { error: "invalid status" }, { status: 400 });
  }

  try {
    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: { status: status as "open" | "in_progress" | "resolved" },
    });
    return jsonWithCors(req, { ok: true, status: updated.status });
  } catch {
    return jsonWithCors(req, { error: "request not found" }, { status: 404 });
  }
}
