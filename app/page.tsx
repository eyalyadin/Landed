export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-24 dark:bg-black">
      <div className="w-full max-w-xl rounded-2xl border border-black/[.08] bg-white p-10 text-center shadow-sm dark:border-white/[.145] dark:bg-zinc-950">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          האפליקציה פעילה · App is live
        </span>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          ניהול שוכרים
        </h1>
        <p className="mt-1 text-lg text-zinc-500 dark:text-zinc-400">
          Landlord ↔ Tenant Manager
        </p>

        <p className="mt-6 leading-7 text-zinc-600 dark:text-zinc-400" dir="auto">
          שלב 0 הושלם — Next.js, Tailwind (RTL) ו-Prisma מותקנים. הדשבורד והבוט
          ייבנו בשלבים הבאים.
        </p>
      </div>
    </main>
  );
}
