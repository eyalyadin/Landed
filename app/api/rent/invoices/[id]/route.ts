import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jerusalemTodayUTCDate } from "@/lib/dates";
import { corsPreflight, jsonWithCors } from "@/lib/cors";

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
  const { id } = await params;
  const payload = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = payload?.status;

  if (status !== "paid" && status !== "pending") {
    return jsonWithCors(req, { error: "status must be 'paid' or 'pending'" }, { status: 400 });
  }

  try {
    const updated = await prisma.rentInvoice.update({
      where: { id },
      data: {
        status,
        paidDate: status === "paid" ? jerusalemTodayUTCDate() : null,
      },
    });
    return jsonWithCors(req, { ok: true, status: updated.status });
  } catch {
    return jsonWithCors(req, { error: "invoice not found" }, { status: 404 });
  }
}
