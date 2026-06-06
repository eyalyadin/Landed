import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jerusalemTodayUTCDate } from "@/lib/dates";
import { corsPreflight, jsonWithCors } from "@/lib/cors";
import { requireAppUserForApi } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

// PATCH /api/rent/invoices/[id] { status: 'paid' | 'pending' }
// Marking paid stamps paidDate = today (Asia/Jerusalem). Reverting clears it.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const appUser = await requireAppUserForApi();
  if (!appUser) return jsonWithCors(req, { error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const paymentId = parseInt(id, 10);
  if (!Number.isFinite(paymentId)) {
    return jsonWithCors(req, { error: "invalid id" }, { status: 400 });
  }

  const payload = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = payload?.status;

  if (status !== "paid" && status !== "pending") {
    return jsonWithCors(req, { error: "status must be 'paid' or 'pending'" }, { status: 400 });
  }

  try {
    const existing = await prisma.payment.findFirst({
      where: { id: paymentId, property: { ownerId: appUser.id } },
      select: { id: true },
    });
    if (!existing) return jsonWithCors(req, { error: "payment not found" }, { status: 404 });

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        paidDate: status === "paid" ? jerusalemTodayUTCDate() : null,
      },
    });
    return jsonWithCors(req, { ok: true, status: updated.status });
  } catch {
    return jsonWithCors(req, { error: "payment not found" }, { status: 404 });
  }
}
