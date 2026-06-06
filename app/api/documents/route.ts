import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/documents — record a new contract/document, optionally with a PDF file.
// Accepts multipart/form-data (not JSON) so the browser can attach the file.
// Fields: documentName (required), documentType, propertyId (required), uploadedAt, file (PDF, optional).
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const documentName = (formData.get("documentName") as string | null)?.trim();
    const documentType = formData.get("documentType") as string | null;
    const propertyId = formData.get("propertyId") as string | null;
    const uploadedAt = formData.get("uploadedAt") as string | null;
    const file = formData.get("file") as File | null;

    if (!documentName || !propertyId) {
      return NextResponse.json({ error: "documentName and propertyId are required" }, { status: 400 });
    }

    // Validate and read PDF file bytes if provided
    let fileData: Uint8Array<ArrayBuffer> | undefined;
    if (file && file.size > 0) {
      const name = file.name.toLowerCase();
      if (file.type !== "application/pdf" && !name.endsWith(".pdf")) {
        return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
      }
      fileData = new Uint8Array(await file.arrayBuffer());
    }

    const doc = await prisma.document.create({
      data: {
        propertyId: parseInt(propertyId, 10),
        documentName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        documentType: (documentType ?? "other") as any,
        uploadedAt: uploadedAt ? new Date(uploadedAt) : new Date(),
        ...(fileData ? { fileData } : {}),
      },
    });
    return NextResponse.json({ id: doc.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// GET /api/documents — list documents (metadata only; bytes are served via /api/documents/[id]/file).
export async function GET() {
  try {
    const [docs, withFile] = await Promise.all([
      prisma.document.findMany({
        orderBy: { uploadedAt: "desc" },
        select: {
          id: true,
          propertyId: true,
          documentName: true,
          documentType: true,
          uploadedAt: true,
          property: { select: { address: true, unitLabel: true } },
        },
      }),
      prisma.$queryRaw<{ id: number }[]>`SELECT id FROM "Document" WHERE "fileData" IS NOT NULL`,
    ]);

    const fileIds = new Set(withFile.map((r) => r.id));

    return NextResponse.json(
      docs.map((d) => ({
        id: d.id,
        propertyId: d.propertyId,
        propertyAddress: d.property.address,
        propertyUnitLabel: d.property.unitLabel,
        documentName: d.documentName,
        documentType: d.documentType,
        hasFile: fileIds.has(d.id),
        uploadedAt: d.uploadedAt.toISOString(),
      }))
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
