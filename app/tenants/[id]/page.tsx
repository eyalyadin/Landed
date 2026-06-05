import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import ReplyBox from "./ReplyBox";
import MaintenanceStatusSelect from "./MaintenanceStatusSelect";
import RentSection from "./RentSection";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  open: "פתוח",
  in_progress: "בטיפול",
  resolved: "טופל",
};

const STATUS_PILL: Record<string, string> = {
  open: "pixel-pill pixel-pill--open",
  in_progress: "pixel-pill pixel-pill--in-progress",
  resolved: "pixel-pill pixel-pill--done",
};

export default async function TenantThread({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      maintenanceRequests: {
        orderBy: { createdAt: "desc" },
        include: { photos: { orderBy: { createdAt: "asc" } } },
      },
      rentSchedules: { orderBy: { startDate: "desc" } },
      rentInvoices: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!tenant) notFound();

  const schedules = tenant.rentSchedules.map((s) => ({
    id: s.id,
    amount: Number(s.amount),
    dueDayOfMonth: s.dueDayOfMonth,
    startDate: s.startDate.toISOString(),
    active: s.active,
  }));
  const invoices = tenant.rentInvoices.map((inv) => ({
    id: inv.id,
    amount: Number(inv.amount),
    dueDate: inv.dueDate.toISOString(),
    status: inv.status as "pending" | "paid" | "overdue",
    paidDate: inv.paidDate ? inv.paidDate.toISOString() : null,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      {/* Header */}
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="pixel-btn inline-flex text-xs"
            aria-label="חזרה לרשימת השוכרים"
          >
            ← חזרה לרשימה
          </Link>
          <h1 className="mt-3 text-lg font-semibold leading-snug">
            {tenant.name}{" "}
            <span className="text-sm font-normal text-muted">· {tenant.unitLabel}</span>
          </h1>
        </div>
        <span
          className={
            tenant.telegramChatId
              ? "pixel-pill pixel-pill--linked mt-1"
              : "pixel-pill pixel-pill--unlinked mt-1"
          }
        >
          {tenant.telegramChatId ? "מקושר ✓" : "לא מקושר"}
        </span>
      </header>

      {/* Message thread */}
      <section className="mb-6">
        <div className="pixel-card flex flex-col gap-2 bg-surface p-4">
          {tenant.messages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">אין הודעות עדיין</p>
          )}
          {tenant.messages.map((m) => {
            const outbound = m.direction === "outbound";
            return (
              <div
                key={m.id}
                className={`flex ${outbound ? "justify-end" : "justify-start"}`}
              >
                <div
                  dir="auto"
                  className={outbound ? "pixel-bubble-out" : "pixel-bubble-in"}
                >
                  <div className="whitespace-pre-wrap break-words text-sm">{m.body}</div>
                  <div
                    className={`font-vt mt-1 text-xs ${
                      outbound ? "opacity-80" : "text-muted"
                    }`}
                  >
                    {formatDateTime(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <ReplyBox tenantId={tenant.id} linked={Boolean(tenant.telegramChatId)} />
        </div>
      </section>

      {/* Maintenance */}
      <section>
        <h2 className="mb-3 text-base font-semibold">בקשות תחזוקה</h2>
        {tenant.maintenanceRequests.length === 0 ? (
          <p className="text-sm text-muted">אין בקשות תחזוקה</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {tenant.maintenanceRequests.map((r) => (
              <li key={r.id} className="pixel-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p dir="auto" className="font-semibold">
                      {r.title}
                    </p>
                    {r.description && (
                      <p dir="auto" className="mt-0.5 text-sm text-muted">
                        {r.description}
                      </p>
                    )}
                    <p className="font-vt mt-1 text-xs text-muted">
                      {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className={STATUS_PILL[r.status] ?? "pixel-pill pixel-pill--open"}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                    <MaintenanceStatusSelect
                      requestId={r.id}
                      status={r.status}
                      label={STATUS_LABEL[r.status] ?? r.status}
                    />
                  </div>
                </div>

                {r.photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.photos.map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={p.id}
                        src={`/api/photo/${encodeURIComponent(p.telegramFileId)}`}
                        alt={p.caption ?? "תמונת תחזוקה"}
                        className="h-28 w-28 object-cover border-2 border-ink"
                        style={{ boxShadow: "var(--pixel-shadow-sm)" }}
                      />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Rent */}
      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">שכר דירה</h2>
        <RentSection tenantId={tenant.id} schedules={schedules} invoices={invoices} />
      </section>
    </main>
  );
}
