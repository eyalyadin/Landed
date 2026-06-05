import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
