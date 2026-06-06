import { NextResponse } from "next/server";
import { notFoundResponse, requireAppUserForApi, unauthorized } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/documents/[id]/file - stream owned stored PDF bytes.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const appUser = await requireAppUserForApi();
    if (!appUser) return unauthorized();

    const { id } = await params;
    const docId = parseInt(id, 10);
    if (!Number.isFinite(docId)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }

    const doc = await prisma.document.findFirst({
      where: { id: docId, property: { ownerId: appUser.id } },
      select: { documentName: true, fileData: true },
    });

    if (!doc) return notFoundResponse();
    if (!doc.fileData) {
      return NextResponse.json({ error: "file not found" }, { status: 404 });
    }

    const filename = (doc.documentName || "document")
      .replace(/[^\w\u0590-\u05FF\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_") || "document";

    return new Response(doc.fileData, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
