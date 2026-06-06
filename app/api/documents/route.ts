import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/documents — record a new contract/document.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { documentName, documentType, propertyId } = body;

    if (!documentName || !propertyId) {
      return NextResponse.json({ error: "documentName and propertyId are required" }, { status: 400 });
    }

    const doc = await prisma.document.create({
      data: {
        propertyId: parseInt(propertyId, 10),
        documentName,
        documentType: documentType ?? "other",
        uploadedAt: new Date(),
      },
    });
    return NextResponse.json({ id: doc.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// GET /api/documents
export async function GET() {
  try {
    const docs = await prisma.document.findMany({
      orderBy: { uploadedAt: "desc" },
      include: {
        property: { select: { address: true, unitLabel: true } },
      },
    });

    return NextResponse.json(
      docs.map((d) => ({
        id: d.id,
        propertyId: d.propertyId,
        propertyAddress: d.property.address,
        propertyUnitLabel: d.property.unitLabel,
        documentName: d.documentName,
        documentType: d.documentType,
        fileUrl: d.fileUrl,
        uploadedAt: d.uploadedAt.toISOString(),
      }))
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
