import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/documents/[id]/file — stream the stored PDF bytes.
// Returns application/pdf so it opens inline in a new tab.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const docId = parseInt(id, 10);
    if (!Number.isFinite(docId)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }

    const doc = await prisma.document.findUnique({
      where: { id: docId },
      select: { documentName: true, fileData: true },
    });

    if (!doc || !doc.fileData) {
      return NextResponse.json({ error: "file not found" }, { status: 404 });
    }

    // Sanitise the document name for use as a filename (allow Hebrew chars + ASCII)
    const filename = (doc.documentName || "document")
      .replace(/[^\w֐-׿\s\-]/g, "")
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
