import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import LogoutButton from "@/app/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const locale = await getLocale();
  const t = getDict(locale);
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      maintenanceRequests: { where: { status: { not: "resolved" } }, select: { id: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      <header className="mb-7 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
            {t.dashboard.title}
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
            {t.dashboard.tenantsCount(tenants.length)}
          </p>
        </div>
        <LogoutButton />
      </header>

      <ul className="flex flex-col gap-3">
        {tenants.map((tenant) => {
          const last = tenant.messages[0];
          const openCount = tenant.maintenanceRequests.length;
          const inviteLink =
            botUsername && !tenant.telegramChatId
              ? `https://t.me/${botUsername}?start=${tenant.linkToken}`
              : null;

          return (
            <li key={tenant.id} className="card p-0">
              <Link
                href={`/tenants/${tenant.id}`}
                className="block cursor-pointer px-4 pt-4 pb-3 transition-colors hover:opacity-90"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: "var(--text)" }}>
                        {tenant.name}
                      </span>
                      <span className="text-sm" style={{ color: "var(--muted)" }}>
                        · {tenant.unitLabel}
                      </span>
                    </div>
                    {last ? (
                      <p
                        dir="auto"
                        className="mt-1 truncate text-sm"
                        style={{ color: "var(--muted)" }}
                      >
                        {last.direction === "outbound" ? "↩ " : ""}
                        {last.body}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                        {t.dashboard.noMessages}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {last && (
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        {formatDateTime(last.createdAt)}
                      </span>
                    )}
                    {openCount > 0 && (
                      <span className="pill pill--maint">
                        {t.dashboard.maintenanceBadge(openCount)}
                      </span>
                    )}
                    <span className={tenant.telegramChatId ? "pill pill--linked" : "pill pill--unlinked"}>
                      {tenant.telegramChatId ? t.dashboard.linked : t.dashboard.unlinked}
                    </span>
                  </div>
                </div>
              </Link>

              {inviteLink && (
                <div
                  className="border-t px-4 py-2 text-xs"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span style={{ color: "var(--muted)" }}>{t.dashboard.inviteLabel}</span>
                  <a
                    href={inviteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ms-2 break-all hover:underline"
                    style={{ color: "var(--primary)" }}
                  >
                    {inviteLink}
                  </a>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
