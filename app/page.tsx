import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import LogoutButton from "@/app/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
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
          <h1 className="text-lg font-semibold tracking-tight">ניהול שוכרים</h1>
          <p className="mt-1 text-sm text-muted">{tenants.length} שוכרים</p>
        </div>
        <LogoutButton />
      </header>

      <ul className="flex flex-col gap-5">
        {tenants.map((t) => {
          const last = t.messages[0];
          const openCount = t.maintenanceRequests.length;
          const inviteLink =
            botUsername && !t.telegramChatId
              ? `https://t.me/${botUsername}?start=${t.linkToken}`
              : null;

          return (
            <li key={t.id} className="pixel-card p-0">
              <Link
                href={`/tenants/${t.id}`}
                className="block cursor-pointer px-4 pt-4 pb-3 transition-colors hover:bg-surface"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{t.name}</span>
                      <span className="text-sm text-muted">· {t.unitLabel}</span>
                    </div>
                    {last ? (
                      <p dir="auto" className="mt-1 truncate text-sm text-muted">
                        {last.direction === "outbound" ? "↩ " : ""}
                        {last.body}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted">אין הודעות עדיין</p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {last && (
                      <span className="font-vt text-xs text-muted">
                        {formatDateTime(last.createdAt)}
                      </span>
                    )}
                    {openCount > 0 && (
                      <span className="pixel-pill pixel-pill--maint">
                        {openCount} תחזוקה
                      </span>
                    )}
                    <span
                      className={
                        t.telegramChatId
                          ? "pixel-pill pixel-pill--linked"
                          : "pixel-pill pixel-pill--unlinked"
                      }
                    >
                      {t.telegramChatId ? "מקושר ✓" : "לא מקושר"}
                    </span>
                  </div>
                </div>
              </Link>

              {inviteLink && (
                <div className="border-t-2 border-dashed border-ink px-4 py-2">
                  <span className="text-xs text-muted">קישור הזמנה לטלגרם:</span>
                  <a
                    href={inviteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ms-2 break-all text-xs text-accent hover:underline"
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
