import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { dec, dateIso } from "@/lib/serialize";
import ReplyBox from "./ReplyBox";
import MaintenanceStatusSelect from "./MaintenanceStatusSelect";
import RentSection from "./RentSection";

export const dynamic = "force-dynamic";

const JOB_STATUS_LABEL: Record<string, string> = {
  new: "New",
  in_progress: "In progress",
  waiting_on_tenant: "Waiting on tenant",
  waiting_on_vendor: "Waiting on vendor",
  completed: "Completed",
};

export default async function TenantThread({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = parseInt(id, 10);
  if (!Number.isFinite(tenantId)) notFound();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      property: { select: { address: true, unitLabel: true } },
      thread: {
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      },
      jobs: {
        orderBy: { createdAt: "desc" },
        include: { attachments: { orderBy: { createdAt: "asc" } } },
      },
      rentSchedules: { orderBy: { startDate: "desc" } },
      payments: {
        where: { type: "rent" },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!tenant) notFound();

  const schedules = tenant.rentSchedules.map((s) => ({
    id: String(s.id),
    amount: dec(s.amount),
    dueDayOfMonth: s.dueDayOfMonth,
    startDate: s.startDate.toISOString(),
    active: s.active,
  }));

  const invoices = tenant.payments.map((p) => ({
    id: String(p.id),
    amount: dec(p.amount),
    dueDate: p.dueDate.toISOString(),
    status: p.status as "pending" | "paid" | "overdue",
    paidDate: dateIso(p.paidDate),
  }));

  const unitLabel = tenant.property?.unitLabel ?? "";
  const propertyAddress = tenant.property?.address ?? "";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/tenants" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← Back to tenants
          </Link>
          <h1 dir="auto" className="mt-1 text-2xl font-semibold tracking-tight">
            {tenant.name}
            {(propertyAddress || unitLabel) && (
              <span className="text-base text-zinc-500">
                {" · "}
                {[propertyAddress, unitLabel].filter(Boolean).join(" ")}
              </span>
            )}
          </h1>
        </div>
        <span
          className={`text-sm ${
            tenant.telegramChatId
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-zinc-400"
          }`}
        >
          {tenant.telegramChatId ? "Linked ✓" : "Not linked"}
        </span>
      </header>

      {/* Message thread */}
      <section className="mb-6">
        <div className="flex flex-col gap-2 rounded-xl border border-black/[.08] bg-zinc-50 p-4 dark:border-white/[.145] dark:bg-zinc-900/40">
          {(!tenant.thread || tenant.thread.messages.length === 0) && (
            <p className="py-8 text-center text-sm text-zinc-400">No messages yet</p>
          )}
          {tenant.thread?.messages.map((m) => {
            const outbound = m.direction === "outbound";
            return (
              <div key={m.id} className={`flex ${outbound ? "justify-end" : "justify-start"}`}>
                <div
                  dir="auto"
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    outbound
                      ? "bg-blue-600 text-white"
                      : "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  <div className={`mt-1 text-[10px] ${outbound ? "text-blue-100" : "text-zinc-400"}`}>
                    {formatDateTime(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3">
          <ReplyBox tenantId={String(tenant.id)} linked={Boolean(tenant.telegramChatId)} />
        </div>
      </section>

      {/* Jobs (maintenance) */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Maintenance requests</h2>
        {tenant.jobs.length === 0 ? (
          <p className="text-sm text-zinc-400">No maintenance requests</p>
        ) : (
          <ul className="space-y-3">
            {tenant.jobs.map((job) => (
              <li
                key={job.id}
                className="rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p dir="auto" className="font-medium">{job.title}</p>
                    {job.description && (
                      <p dir="auto" className="mt-0.5 text-sm text-zinc-500">{job.description}</p>
                    )}
                    <p className="mt-1 text-xs text-zinc-400">{formatDateTime(job.createdAt)}</p>
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
                        className="h-28 w-28 rounded-lg object-cover"
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
        <h2 className="mb-3 text-lg font-semibold">Rent</h2>
        <RentSection tenantId={String(tenant.id)} schedules={schedules} invoices={invoices} />
      </section>
    </main>
  );
}
