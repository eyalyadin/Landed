import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dec, dateIso, dateDDMMYYYY } from "@/lib/serialize";
import { formatILS } from "@/lib/format";
import RentSection from "@/app/tenants/[id]/RentSection";
import { PropertyMessagesPanel } from "./PropertyMessagesPanel";
import { TasksBoard, type TaskItem } from "./TasksBoard";
import { AddTaskButton } from "./AddTaskButton";
import { AddPaymentButton } from "./AddPaymentButton";
import { AddContractButton } from "./AddContractButton";
import { TenantButton } from "./TenantButton";
import { PropertyHealthCard } from "./PropertyHealthCard";
import {
  Building2,
  Home,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  Download,
} from "lucide-react";

export const dynamic = "force-dynamic";

function propertyTypeLabel(t: string) {
  const map: Record<string, string> = {
    apartment: "Apartment",
    house: "House",
    condo: "Condo",
    townhouse: "Townhouse",
    commercial: "Commercial",
  };
  return map[t] ?? t;
}

function jobCategoryLabel(c: string) {
  const map: Record<string, string> = {
    repair: "Repair",
    payment_followup: "Payment Follow-up",
    contract_renewal: "Contract Renewal",
    tenant_issue: "Tenant Issue",
    inspection: "Inspection",
    maintenance: "Maintenance",
  };
  return map[c] ?? c;
}

function documentTypeLabel(t: string) {
  const map: Record<string, string> = {
    rental_contract: "Rental Contract",
    inventory: "Inventory",
    deposit_document: "Deposit",
    keys_record: "Keys Record",
    other: "Other",
  };
  return map[t] ?? t;
}

function PropertyIcon({ type }: { type: string }) {
  if (type === "house") return <Home className="h-5 w-5 text-muted-foreground" />;
  if (type === "commercial") return <Building className="h-5 w-5 text-muted-foreground" />;
  return <Building2 className="h-5 w-5 text-muted-foreground" />;
}

function OccupancyBadge({ status }: { status: string }) {
  if (status === "occupied")
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        Occupied
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
      Vacant
    </span>
  );
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const propertyId = parseInt(id, 10);
  if (!Number.isFinite(propertyId)) notFound();

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      tenants: {
        orderBy: { createdAt: "desc" },
        include: {
          rentSchedules: { orderBy: { startDate: "desc" } },
          payments: { where: { type: "rent" }, orderBy: { dueDate: "asc" } },
          thread: { select: { id: true } },
        },
      },
      jobs: {
        orderBy: { createdAt: "desc" },
        include: { attachments: { orderBy: { createdAt: "asc" } } },
      },
      documents: {
        orderBy: { uploadedAt: "desc" },
        select: { id: true, documentName: true, documentType: true, uploadedAt: true },
      },
    },
  });

  if (!property) notFound();

  // Which documents have a stored PDF file (avoid loading bytes into the page render)
  const docsWithFile = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM "Document" WHERE "propertyId" = ${propertyId} AND "fileData" IS NOT NULL
  `;
  const fileIdSet = new Set(docsWithFile.map((r: { id: number }) => r.id));

  const tenant = property.tenants[0] ?? null;

  // Serialise rent data
  const schedules =
    tenant?.rentSchedules.map((s) => ({
      id: String(s.id),
      amount: dec(s.amount),
      dueDayOfMonth: s.dueDayOfMonth,
      startDate: s.startDate.toISOString(),
      active: s.active,
    })) ?? [];

  const invoices =
    tenant?.payments.map((p) => ({
      id: String(p.id),
      amount: dec(p.amount),
      dueDate: p.dueDate.toISOString(),
      status: p.status as "pending" | "paid" | "overdue",
      paidDate: dateIso(p.paidDate),
    })) ?? [];

  // Payment summary stats
  const monthlyRentAmt = Number(property.monthlyRent);
  const collectedTotal = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0);
  const overdueTotal = invoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + i.amount, 0);

  // Tasks overdue check
  const today = new Date();

  // Serialise initial messages
  const threadId = tenant?.thread?.id ?? null;
  const rawMessages = threadId
    ? await prisma.message.findMany({
        where: { threadId, isInternalNote: false },
        orderBy: { createdAt: "asc" },
        select: { id: true, direction: true, body: true, createdAt: true },
      })
    : [];
  const initialMessages = rawMessages.map((m) => ({
    id: m.id,
    direction: m.direction as "inbound" | "outbound",
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  }));

  // Telegram invite link (server-side only)
  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "";
  const inviteLink =
    tenant && !tenant.telegramChatId && botUsername
      ? `https://t.me/${botUsername}?start=${tenant.linkToken}`
      : null;

  const openJobs = property.jobs.filter((j) => j.status !== "completed");

  const serializedJobs: TaskItem[] = property.jobs.map((j) => ({
    id: j.id,
    title: j.title,
    description: j.description,
    category: j.category as string,
    status: j.status as string,
    priority: j.priority as string,
    dueDate: j.dueDate?.toISOString() ?? null,
    contractorName: j.contractorName,
    notes: j.notes,
    createdAt: j.createdAt.toISOString(),
    attachments: j.attachments.map((a) => ({
      id: a.id,
      telegramFileId: a.telegramFileId,
      caption: a.caption,
    })),
  }));

  const tenantProp = tenant
    ? {
        id: tenant.id,
        name: tenant.name,
        telegramLinked: !!tenant.telegramChatId,
        phone: tenant.phone,
        email: tenant.email,
        moveInDate: dateIso(tenant.moveInDate),
        leaseEndDate: dateIso(tenant.leaseEndDate),
        notes: tenant.notes,
      }
    : null;

  return (
    <AppShell pageTitle={property.address}>
      <div className="p-4 lg:p-5 space-y-4">

        {/* Back */}
        <Link
          href="/properties"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Properties
        </Link>

        {/* ── 1. HEADER — Tenant (left) | Property (right) ── */}
        <Card className="border-border shadow-none">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">

              {/* Left: Tenant */}
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Current Tenant
                  </p>
                  <TenantButton propertyId={property.id} tenant={tenantProp} />
                </div>
                {tenant ? (
                  <div className="space-y-2">
                    {/* Name + Telegram status */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-semibold text-foreground leading-tight">{tenant.name}</p>
                      <span
                        className={`shrink-0 text-[11px] font-medium ${
                          tenant.telegramChatId
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {tenant.telegramChatId ? "Telegram linked ✓" : "Telegram not linked"}
                      </span>
                    </div>

                    {/* Contact */}
                    {tenant.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <a href={`tel:${tenant.phone}`} className="text-foreground hover:underline">
                          {tenant.phone}
                        </a>
                      </div>
                    )}
                    {tenant.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <a
                          href={`mailto:${tenant.email}`}
                          className="truncate text-foreground hover:underline"
                        >
                          {tenant.email}
                        </a>
                      </div>
                    )}

                    {/* Lease facts — inline row */}
                    {(tenant.moveInDate || tenant.leaseEndDate || tenant.contractStatus) && (
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border pt-3 mt-1">
                        {tenant.moveInDate && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Calendar className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="text-muted-foreground">Move in</span>
                            <span className="font-medium text-foreground">
                              {dateDDMMYYYY(tenant.moveInDate)}
                            </span>
                          </div>
                        )}
                        {tenant.leaseEndDate && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="text-muted-foreground">Lease ends</span>
                            <span className="font-medium text-foreground">
                              {dateDDMMYYYY(tenant.leaseEndDate)}
                            </span>
                          </div>
                        )}
                        {tenant.contractStatus && (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              tenant.contractStatus === "active"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : tenant.contractStatus === "expiring-soon"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                            }`}
                          >
                            Contract: {tenant.contractStatus}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {(tenant.notes || tenant.keysAccessNotes) && (
                      <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-1">
                        {[tenant.keysAccessNotes, tenant.notes].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Vacant — no current tenant</span>
                  </div>
                )}
              </div>

              {/* Right: Property */}
              <div className="p-5">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Property
                </p>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <PropertyIcon type={property.propertyType} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold text-foreground leading-tight">
                          {property.address}
                          {property.unitLabel && (
                            <span className="font-normal text-muted-foreground"> · {property.unitLabel}</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {property.city} · {propertyTypeLabel(property.propertyType)}
                        </p>
                      </div>
                      <OccupancyBadge status={property.occupancyStatus} />
                    </div>
                    {property.notes && (
                      <p className="mt-2 text-xs text-muted-foreground">{property.notes}</p>
                    )}
                  </div>
                </div>

                {/* Property Health — below address */}
                <PropertyHealthCard
                  jobs={serializedJobs.map((j) => ({
                    status: j.status,
                    category: j.category,
                    priority: j.priority,
                    createdAt: j.createdAt,
                    title: j.title,
                  }))}
                  payments={invoices.map((i) => ({
                    status: i.status,
                    amount: i.amount,
                    dueDate: i.dueDate,
                  }))}
                  occupancyStatus={property.occupancyStatus}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. CURRENT TASKS ── */}
        <Card className="border-border shadow-none">
          <CardHeader className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Current Tasks
                </CardTitle>
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-muted text-muted-foreground text-[11px] font-medium">
                  {openJobs.length}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {openJobs.length === 1 ? "task" : "tasks"} for this property
                </span>
              </div>
              <AddTaskButton propertyId={property.id} />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <TasksBoard propertyId={property.id} jobs={serializedJobs} tenant={tenantProp} />
          </CardContent>
        </Card>

        {/* ── 3. MESSAGES (left) | RENT & PAYMENTS (right) ── */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Left: Messages — only when there is a tenant */}
          {tenant && (
            <Card className="border-border shadow-none lg:col-span-1">
              <CardHeader className="px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold text-foreground truncate">
                    Messages with {tenant.name}
                  </CardTitle>
                  <Link
                    href={`/tenants/${tenant.id}`}
                    className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Open full thread
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <PropertyMessagesPanel
                  tenantId={tenant.id}
                  threadId={threadId}
                  tenantName={tenant.name}
                  telegramLinked={!!tenant.telegramChatId}
                  inviteLink={inviteLink}
                  initialMessages={initialMessages}
                />
              </CardContent>
            </Card>
          )}

          {/* Right: Rent & Payments — takes full width when no tenant */}
          <Card className={`border-border shadow-none ${tenant ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <CardHeader className="px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">Rent & Payments</CardTitle>
                {tenant && <AddPaymentButton tenantId={tenant.id} />}
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {/* Inline stats bar */}
              <div className="mb-4 flex flex-wrap gap-px overflow-hidden rounded-lg border border-border bg-border">
                <div className="flex flex-1 flex-col items-center bg-card px-4 py-2.5">
                  <p className="text-[11px] text-muted-foreground">Monthly Rent</p>
                  <p className="text-sm font-semibold text-foreground">{formatILS(monthlyRentAmt)}</p>
                </div>
                <div className="flex flex-1 flex-col items-center bg-card px-4 py-2.5">
                  <p className="text-[11px] text-muted-foreground">Collected</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatILS(collectedTotal)}
                  </p>
                </div>
                <div className="flex flex-1 flex-col items-center bg-card px-4 py-2.5">
                  <p className="text-[11px] text-muted-foreground">Overdue</p>
                  <p className={`text-sm font-semibold ${overdueTotal > 0 ? "text-destructive" : "text-foreground"}`}>
                    {formatILS(overdueTotal)}
                  </p>
                </div>
              </div>

              {tenant ? (
                <RentSection
                  tenantId={String(tenant.id)}
                  schedules={schedules}
                  invoices={invoices}
                />
              ) : (
                <p className="text-sm text-muted-foreground">No tenant — no payment data.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── 4. CONTRACTS ── */}
        <Card className="border-border shadow-none">
          <CardHeader className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Contracts
                {property.documents.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
                    {property.documents.length}
                  </span>
                )}
              </CardTitle>
              <AddContractButton propertyId={property.id} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {property.documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <FileText className="mb-2 h-7 w-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No contracts yet</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[2fr_1fr_120px_40px] gap-4 border-b border-border bg-muted/40 px-5 py-2.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Document</span>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Type</span>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Uploaded</span>
                  <span />
                </div>
                {property.documents.map((doc, i) => (
                  <div
                    key={doc.id}
                    className={[
                      "grid grid-cols-[2fr_1fr_120px_40px] gap-4 items-center px-5 py-3.5 hover:bg-muted/40 transition-colors",
                      i < property.documents.length - 1 ? "border-b border-border" : "",
                    ].join(" ")}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-[13px] font-medium text-foreground">
                        {doc.documentName}
                      </span>
                    </div>
                    <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {documentTypeLabel(doc.documentType)}
                    </span>
                    <span className="text-[13px] tabular-nums text-muted-foreground">
                      {new Date(doc.uploadedAt).toLocaleDateString("en-GB")}
                    </span>
                    <div className="flex justify-end">
                      {fileIdSet.has(doc.id) ? (
                        <a
                          href={`/api/documents/${doc.id}/file`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span className="sr-only">Download</span>
                        </a>
                      ) : (
                        <span className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground/40">
                          <Download className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}
