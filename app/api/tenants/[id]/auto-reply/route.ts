import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/tenants/[id]/auto-reply { autoReply: boolean }
// Enables or disables automatic AI replies for a tenant.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payload = (await req.json().catch(() => null)) as { autoReply?: boolean } | null;
  if (typeof payload?.autoReply !== "boolean") {
    return NextResponse.json({ error: "autoReply (boolean) is required" }, { status: 400 });
  }

  const tenant = await prisma.tenant.update({
    where: { id },
    data: { autoReply: payload.autoReply },
  });
  return NextResponse.json({ ok: true, autoReply: tenant.autoReply });
}
