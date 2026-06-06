import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/jobs — create a new task/repair job.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, category, propertyId, status, dueDate, notes } = body;

    if (!title || !propertyId) {
      return NextResponse.json({ error: "title and propertyId are required" }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        propertyId: parseInt(propertyId, 10),
        title,
        category: category ?? "repair",
        status: status ?? "new",
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes ?? null,
      },
    });
    return NextResponse.json({ id: job.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// GET /api/jobs — all jobs with property and tenant context.
export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        property: { select: { address: true, unitLabel: true, city: true } },
        tenant: { select: { name: true } },
        attachments: { select: { id: true, telegramFileId: true, caption: true } },
      },
    });

    return NextResponse.json(
      jobs.map((j) => ({
        id: j.id,
        propertyId: j.propertyId,
        propertyAddress: j.property.address,
        propertyUnitLabel: j.property.unitLabel,
        propertyCity: j.property.city,
        tenantId: j.tenantId,
        tenantName: j.tenant?.name ?? null,
        title: j.title,
        description: j.description,
        category: j.category,
        priority: j.priority,
        status: j.status,
        dueDate: j.dueDate?.toISOString() ?? null,
        contractorName: j.contractorName,
        notes: j.notes,
        createdAt: j.createdAt.toISOString(),
        updatedAt: j.updatedAt.toISOString(),
        attachments: j.attachments,
      }))
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
