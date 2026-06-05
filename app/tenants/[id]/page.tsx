import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import ReplyBox from "./ReplyBox";
import MaintenanceStatusSelect from "./MaintenanceStatusSelect";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  open: "פתוח",
  in_progress: "בטיפול",
  resolved: "טופל",
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
    },
  });

  if (!tenant) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← חזרה לרשימה
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {tenant.name} <span className="text-base text-zinc-500">· {tenant.unitLabel}</span>
          </h1>
        </div>
        <span
          className={`text-sm ${
            tenant.telegramChatId
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-zinc-400"
          }`}
        >
          {tenant.telegramChatId ? "מקושר ✓" : "לא מקושר"}
        </span>
      </header>

      {/* Message thread */}
      <section className="mb-6">
        <div className="flex flex-col gap-2 rounded-xl border border-black/[.08] bg-zinc-50 p-4 dark:border-white/[.145] dark:bg-zinc-900/40">
          {tenant.messages.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-400">אין הודעות עדיין</p>
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
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    outbound
                      ? "bg-blue-600 text-white"
                      : "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  <div
                    className={`mt-1 text-[10px] ${
                      outbound ? "text-blue-100" : "text-zinc-400"
                    }`}
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
        <h2 className="mb-3 text-lg font-semibold">בקשות תחזוקה</h2>
        {tenant.maintenanceRequests.length === 0 ? (
          <p className="text-sm text-zinc-400">אין בקשות תחזוקה</p>
        ) : (
          <ul className="space-y-3">
            {tenant.maintenanceRequests.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p dir="auto" className="font-medium">
                      {r.title}
                    </p>
                    {r.description && (
                      <p dir="auto" className="mt-0.5 text-sm text-zinc-500">
                        {r.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-zinc-400">
                      {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                  <MaintenanceStatusSelect
                    requestId={r.id}
                    status={r.status}
                    label={STATUS_LABEL[r.status] ?? r.status}
                  />
                </div>

                {r.photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.photos.map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={p.id}
                        src={`/api/photo/${encodeURIComponent(p.telegramFileId)}`}
                        alt={p.caption ?? "תמונת תחזוקה"}
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
    </main>
  );
}
