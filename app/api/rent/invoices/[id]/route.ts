import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jerusalemTodayUTCDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

// PATCH /api/rent/invoices/[id] { status: 'paid' | 'pending' }
// Marking paid stamps paidDate = today (Asia/Jerusalem). Reverting clears it.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const paymentId = parseInt(id, 10);
  if (!Number.isFinite(paymentId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const payload = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = payload?.status;

  if (status !== "paid" && status !== "pending") {
    return NextResponse.json({ error: "status must be 'paid' or 'pending'" }, { status: 400 });
  }

  try {
    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        paidDate: status === "paid" ? jerusalemTodayUTCDate() : null,
      },
    });
    return NextResponse.json({ ok: true, status: updated.status });
  } catch {
    return NextResponse.json({ error: "payment not found" }, { status: 404 });
  }
}
