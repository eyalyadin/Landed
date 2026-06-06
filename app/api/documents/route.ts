import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertOwnedProperty,
  notFoundResponse,
  requireAppUserForApi,
  unauthorized,
} from "@/lib/current-user";

export const dynamic = "force-dynamic";

// POST /api/documents - record a new contract/document for an owned property.
export async function POST(req: Request) {
  try {
    const appUser = await requireAppUserForApi();
    if (!appUser) return unauthorized();

    const formData = await req.formData();
    const documentName = (formData.get("documentName") as string | null)?.trim();
    const documentType = formData.get("documentType") as string | null;
    const propertyId = formData.get("propertyId") as string | null;
    const uploadedAt = formData.get("uploadedAt") as string | null;
    const file = formData.get("file") as File | null;

    if (!documentName || !propertyId) {
      return NextResponse.json({ error: "documentName and propertyId are required" }, { status: 400 });
    }

    const ownedProperty = await assertOwnedProperty(parseInt(propertyId, 10), appUser.id);
    if (!ownedProperty) return notFoundResponse();

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
        propertyId: ownedProperty.id,
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

// GET /api/documents - list owned documents.
export async function GET() {
  try {
    const appUser = await requireAppUserForApi();
    if (!appUser) return unauthorized();

    const [docs, withFile] = await Promise.all([
      prisma.document.findMany({
        where: { property: { ownerId: appUser.id } },
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
      prisma.$queryRaw<{ id: number }[]>`
        SELECT d.id
        FROM "Document" d
        JOIN "Property" p ON p.id = d."propertyId"
        WHERE d."fileData" IS NOT NULL AND p."ownerId" = ${appUser.id}
      `,
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
