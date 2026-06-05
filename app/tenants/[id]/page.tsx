import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import ReplyBox from "./ReplyBox";
import MaintenanceStatusSelect from "./MaintenanceStatusSelect";
import RentSection from "./RentSection";

export const dynamic = "force-dynamic";

const STATUS_PILL: Record<string, string> = {
  open:        "pill pill--open",
  in_progress: "pill pill--in-progress",
  resolved:    "pill pill--done",
};

export default async function TenantThread({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const t = getDict(locale);

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
            className="btn btn-ghost inline-flex text-sm"
            aria-label={t.nav.backLabel}
          >
            {t.nav.back}
          </Link>
          <h1 className="mt-2 text-xl font-semibold" style={{ color: "var(--text)" }}>
            {tenant.name}{" "}
            <span className="text-sm font-normal" style={{ color: "var(--muted)" }}>
              · {tenant.unitLabel}
            </span>
          </h1>
        </div>
        <span
          className={`mt-1 ${
            tenant.telegramChatId ? "pill pill--linked" : "pill pill--unlinked"
          }`}
        >
          {tenant.telegramChatId ? t.thread.linkedYes : t.thread.linkedNo}
        </span>
      </header>

      {/* Message thread */}
      <section className="mb-6">
        <div
          className="card flex flex-col gap-2 p-4"
          style={{ background: "var(--surface)" }}
        >
          {tenant.messages.length === 0 && (
            <p
              className="py-8 text-center text-sm"
              style={{ color: "var(--muted)" }}
            >
              {t.thread.noMessages}
            </p>
          )}
          {tenant.messages.map((m) => {
            const outbound = m.direction === "outbound";
            return (
              <div
                key={m.id}
                className={`flex ${outbound ? "justify-end" : "justify-start"}`}
              >
                <div dir="auto" className={outbound ? "bubble-out" : "bubble-in"}>
                  <div className="whitespace-pre-wrap break-words text-sm">{m.body}</div>
                  <div
                    className="mt-1 text-xs"
                    style={{ opacity: 0.75 }}
                  >
                    {formatDateTime(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3">
          <ReplyBox tenantId={tenant.id} linked={Boolean(tenant.telegramChatId)} />
        </div>
      </section>

      {/* Maintenance */}
      <section>
        <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text)" }}>
          {t.maintenance.title}
        </h2>
        {tenant.maintenanceRequests.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t.maintenance.empty}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {tenant.maintenanceRequests.map((r) => (
              <li key={r.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p dir="auto" className="font-medium" style={{ color: "var(--text)" }}>
                      {r.title}
                    </p>
                    {r.description && (
                      <p dir="auto" className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
                        {r.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                      {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className={STATUS_PILL[r.status] ?? "pill pill--open"}>
                      {t.maintenance.status[r.status as keyof typeof t.maintenance.status] ?? r.status}
                    </span>
                    <MaintenanceStatusSelect requestId={r.id} status={r.status} />
                  </div>
                </div>

                {r.photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.photos.map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={p.id}
                        src={`/api/photo/${encodeURIComponent(p.telegramFileId)}`}
                        alt={p.caption ?? t.maintenance.photoAlt}
                        className="h-28 w-28 rounded-md object-cover"
                        style={{ border: "1px solid var(--border)" }}
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
        <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text)" }}>
          {t.rent.title}
        </h2>
        <RentSection tenantId={tenant.id} schedules={schedules} invoices={invoices} />
      </section>
    </main>
  );
}
