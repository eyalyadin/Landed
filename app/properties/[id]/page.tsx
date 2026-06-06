import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dec, dateIso, dateDDMMYYYY } from "@/lib/serialize";
import { formatILS } from "@/lib/format";
import MaintenanceStatusSelect from "@/app/tenants/[id]/MaintenanceStatusSelect";
import RentSection from "@/app/tenants/[id]/RentSection";
import {
  Building2,
  Home,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Wrench,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Label helpers
function propertyTypeLabel(t: string) {
  const map: Record<string, string> = {
    apartment: "Apartment", house: "House", condo: "Condo",
    townhouse: "Townhouse", commercial: "Commercial",
  };
  return map[t] ?? t;
}

function PropertyIcon({ type }: { type: string }) {
  if (type === "house") return <Home className="h-5 w-5 text-muted-foreground" />;
  if (type === "commercial") return <Building className="h-5 w-5 text-muted-foreground" />;
  return <Building2 className="h-5 w-5 text-muted-foreground" />;
}

function OccupancyBadge({ status }: { status: string }) {
  if (status === "occupied") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        Occupied
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
      Vacant
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: "pending" | "paid" | "overdue" }) {
  const map = {
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    pending: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };
  const labels = { paid: "Paid", overdue: "Overdue", pending: "Pending" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

const JOB_STATUS_LABEL: Record<string, string> = {
  new: "New",
  in_progress: "In progress",
  waiting_on_tenant: "Waiting on tenant",
  waiting_on_vendor: "Waiting on vendor",
  completed: "Completed",
};

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
          payments: {
            where: { type: "rent" },
            orderBy: { dueDate: "asc" },
          },
        },
      },
      jobs: {
        orderBy: { createdAt: "desc" },
        include: { attachments: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  if (!property) notFound();

  const tenant = property.tenants[0] ?? null;

  const schedules = tenant?.rentSchedules.map((s) => ({
    id: String(s.id),
    amount: dec(s.amount),
    dueDayOfMonth: s.dueDayOfMonth,
    startDate: s.startDate.toISOString(),
    active: s.active,
  })) ?? [];

  const invoices = tenant?.payments.map((p) => ({
    id: String(p.id),
    amount: dec(p.amount),
    dueDate: p.dueDate.toISOString(),
    status: p.status as "pending" | "paid" | "overdue",
    paidDate: dateIso(p.paidDate),
  })) ?? [];

  // Payment quick stats
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const pendingInvoices = invoices.filter((i) => i.status === "pending");
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const overdueTotal = overdueInvoices.reduce((s, i) => s + i.amount, 0);
  const collectedTotal = paidInvoices.reduce((s, i) => s + i.amount, 0);

  return (
    <AppShell pageTitle={property.address}>
      <div className="p-4 lg:p-5 space-y-5">

        {/* Back link */}
        <Link
          href="/properties"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          ← Back to Properties
        </Link>

        {/* Property header */}
        <Card className="border-border shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                <PropertyIcon type={property.propertyType} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-semibold text-foreground leading-tight">
                      {property.address}
                      {property.unitLabel && (
                        <span className="text-muted-foreground font-normal"> · {property.unitLabel}</span>
                      )}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {property.city} · {propertyTypeLabel(property.propertyType)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <OccupancyBadge status={property.occupancyStatus} />
                    <span className="text-lg font-semibold text-foreground">
                      {formatILS(Number(property.monthlyRent))}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </span>
                  </div>
                </div>
                {property.notes && (
                  <p className="mt-2 text-sm text-muted-foreground">{property.notes}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment stats row */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground leading-none mb-0.5">
                    {formatILS(Number(property.monthlyRent))}
                  </p>
                  <p className="text-xs text-muted-foreground">Monthly Rent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/30">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground leading-none mb-0.5">
                    {formatILS(collectedTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground">Collected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground leading-none mb-0.5">
                    {formatILS(overdueTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main grid: Tenant info + Rent section */}
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Tenant card */}
          <div className="lg:col-span-1">
            <Card className="border-border shadow-none h-full">
              <CardHeader className="px-5 py-4 border-b border-border">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Current Tenant
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {tenant ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-base font-semibold text-foreground">{tenant.name}</p>
                      <p className={`text-xs mt-0.5 ${tenant.telegramChatId ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                        {tenant.telegramChatId ? "Telegram linked ✓" : "Telegram not linked"}
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      {tenant.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <a href={`tel:${tenant.phone}`} className="text-foreground hover:underline">
                            {tenant.phone}
                          </a>
                        </div>
                      )}
                      {tenant.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <a href={`mailto:${tenant.email}`} className="text-foreground hover:underline truncate">
                            {tenant.email}
                          </a>
                        </div>
                      )}
                      {tenant.moveInDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-foreground">
                            Move in: {dateDDMMYYYY(tenant.moveInDate)}
                          </span>
                        </div>
                      )}
                      {tenant.leaseEndDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-foreground">
                            Lease ends: {dateDDMMYYYY(tenant.leaseEndDate)}
                          </span>
                        </div>
                      )}
                    </div>

                    {tenant.notes && (
                      <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                        {tenant.notes}
                      </p>
                    )}

                    <div className="pt-2 border-t border-border flex flex-col gap-2">
                      <Link
                        href={`/tenants/${tenant.id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Open conversation
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <User className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-foreground">No tenant</p>
                    <p className="text-xs text-muted-foreground mt-0.5">This property is vacant</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rent & Payments */}
          <div className="lg:col-span-2">
            <Card className="border-border shadow-none">
              <CardHeader className="px-5 py-4 border-b border-border">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Rent & Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
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
        </div>

        {/* Maintenance Requests */}
        <Card className="border-border shadow-none">
          <CardHeader className="px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Maintenance Requests
              </CardTitle>
              {property.jobs.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-muted text-muted-foreground text-[11px] font-medium">
                  {property.jobs.length}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {property.jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-7 w-7 text-emerald-500 mb-2" />
                <p className="text-sm text-muted-foreground">No maintenance requests</p>
              </div>
            ) : (
              <div>
                {property.jobs.map((job, i) => (
                  <div
                    key={job.id}
                    className={`px-5 py-4 ${i < property.jobs.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p dir="auto" className="text-[13px] font-medium text-foreground">{job.title}</p>
                        {job.description && (
                          <p dir="auto" className="text-xs text-muted-foreground mt-0.5">{job.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {job.createdAt.toLocaleDateString("en-GB")}
                          {job.contractorName && ` · ${job.contractorName}`}
                        </p>
                      </div>
                      <MaintenanceStatusSelect
                        requestId={String(job.id)}
                        status={job.status}
                        label={JOB_STATUS_LABEL[job.status] ?? job.status}
                      />
                    </div>
                    {job.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {job.attachments.map((att) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={att.id}
                            src={`/api/photo/${encodeURIComponent(att.telegramFileId)}`}
                            alt={att.caption ?? "Maintenance photo"}
                            className="h-24 w-24 rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}
