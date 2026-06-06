import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DocumentType } from "@/app/generated/prisma/client";
import { notFoundResponse, requireAppUserForApi, unauthorized } from "@/lib/current-user";

export const dynamic = "force-dynamic";

// DELETE /api/documents/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const appUser = await requireAppUserForApi();
  if (!appUser) return unauthorized();

  const { id } = await params;
  const docId = parseInt(id, 10);
  if (!Number.isFinite(docId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const existing = await prisma.document.findFirst({
    where: { id: docId, property: { ownerId: appUser.id } },
    select: { id: true },
  });
  if (!existing) return notFoundResponse();

  await prisma.document.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}

// PATCH /api/documents/[id] { documentName?, documentType? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const appUser = await requireAppUserForApi();
  if (!appUser) return unauthorized();

  const { id } = await params;
  const docId = parseInt(id, 10);
  if (!Number.isFinite(docId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const existing = await prisma.document.findFirst({
    where: { id: docId, property: { ownerId: appUser.id } },
    select: { id: true },
  });
  if (!existing) return notFoundResponse();

  const body = await req.json().catch(() => ({}));
  const data: { documentName?: string; documentType?: DocumentType } = {};
  if (body.documentName?.trim()) data.documentName = body.documentName.trim();
  if (body.documentType) data.documentType = body.documentType as DocumentType;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no fields provided" }, { status: 400 });
  }

  await prisma.document.update({ where: { id: docId }, data });
  return NextResponse.json({ ok: true });
}
