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
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ניהול שוכרים</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {tenants.length} שוכרים
          </p>
        </div>
        <LogoutButton />
      </header>

      <ul className="space-y-3">
        {tenants.map((t) => {
          const last = t.messages[0];
          const openCount = t.maintenanceRequests.length;
          const inviteLink =
            botUsername && !t.telegramChatId
              ? `https://t.me/${botUsername}?start=${t.linkToken}`
              : null;

          return (
            <li
              key={t.id}
              className="rounded-xl border border-black/[.08] bg-white p-4 transition-colors hover:border-zinc-400 dark:border-white/[.145] dark:bg-zinc-950"
            >
              <Link href={`/tenants/${t.id}`} className="block">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-sm text-zinc-500">· {t.unitLabel}</span>
                    </div>
                    {last ? (
                      <p
                        dir="auto"
                        className="mt-1 truncate text-sm text-zinc-500 dark:text-zinc-400"
                      >
                        {last.direction === "outbound" ? "↩ " : ""}
                        {last.body}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-zinc-400">אין הודעות עדיין</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {last && (
                      <span className="text-xs text-zinc-400">
                        {formatDateTime(last.createdAt)}
                      </span>
                    )}
                    {openCount > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {openCount} תחזוקה
                      </span>
                    )}
                    <span
                      className={`text-xs ${
                        t.telegramChatId
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-400"
                      }`}
                    >
                      {t.telegramChatId ? "מקושר ✓" : "לא מקושר"}
                    </span>
                  </div>
                </div>
              </Link>

              {inviteLink && (
                <div className="mt-3 border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-800">
                  <span className="text-xs text-zinc-500">קישור הזמנה לטלגרם:</span>
                  <a
                    href={inviteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ms-2 break-all text-xs text-blue-600 hover:underline dark:text-blue-400"
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
