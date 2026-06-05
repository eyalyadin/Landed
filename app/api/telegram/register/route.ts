import { NextRequest, NextResponse } from "next/server";
import { setWebhook } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// GET /api/telegram/register?secret=CRON_SECRET
// One-shot webhook (re-)registration. Run once after each deploy or domain change.
// Guards with CRON_SECRET so it's not publicly callable. TELEGRAM_BOT_TOKEN never
// leaves the server — it is used internally by setWebhook() via lib/telegram.ts.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const publicUrl = process.env.PUBLIC_URL;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!publicUrl) {
    return NextResponse.json(
      { error: "PUBLIC_URL env var is not set — add it in Railway then redeploy" },
      { status: 500 },
    );
  }
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "TELEGRAM_WEBHOOK_SECRET env var is not set — add it in Railway then redeploy" },
      { status: 500 },
    );
  }

  const webhookUrl = `${publicUrl}/api/telegram/webhook`;
  try {
    const result = await setWebhook(webhookUrl, webhookSecret);
    return NextResponse.json({ ok: true, webhookUrl, telegramResult: result });
  } catch (err) {
    return NextResponse.json(
      { error: `setWebhook failed: ${(err as Error).message}` },
      { status: 502 },
    );
  }
}
