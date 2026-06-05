import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/telegram";
import { detectLanguage } from "@/lib/lang";

export const dynamic = "force-dynamic";

// Minimal shape of the Telegram updates we handle.
type TgPhotoSize = { file_id: string; width: number; height: number };
type TgMessage = {
  message_id: number;
  chat: { id: number };
  text?: string;
  caption?: string;
  photo?: TgPhotoSize[];
};
type TgUpdate = { message?: TgMessage; edited_message?: TgMessage };

const WELCOME = (name: string) =>
  `שלום ${name}! חוברת בהצלחה אל בעל הבית. אפשר לשלוח כאן הודעות, ולצרף תמונה כדי לפתוח בקשת תחזוקה.\n\n` +
  `Hi ${name}! You're now linked to your landlord. You can send messages here, and attach a photo to open a maintenance request.`;

const NEED_LINK =
  `החשבון אינו מקושר עדיין. נא להשתמש בקישור שקיבלת מבעל הבית כדי להתחבר.\n\n` +
  `This chat isn't linked yet. Please use the link your landlord gave you to connect.`;

const PHOTO_ACK =
  `קיבלנו את התמונה ופתחנו עבורך בקשת תחזוקה. תודה!\n\n` +
  `Got your photo and opened a maintenance request for you. Thanks!`;

export async function POST(req: NextRequest) {
  // 1. Verify the secret header — reject anything that isn't from our Telegram webhook.
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const msg = update.message ?? update.edited_message;
    if (!msg?.chat) return NextResponse.json({ ok: true });

    const chatId = String(msg.chat.id);
    const text = msg.text;

    // 2. /start <token> → link this chat to the matching tenant.
    if (text && text.startsWith("/start")) {
      const linkToken = text.split(/\s+/)[1];
      if (linkToken) {
        const tenant = await prisma.tenant.findUnique({ where: { linkToken } });
        if (tenant) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { telegramChatId: chatId },
          });
          await sendMessage(chatId, WELCOME(tenant.name));
          return NextResponse.json({ ok: true });
        }
      }
      await sendMessage(chatId, NEED_LINK);
      return NextResponse.json({ ok: true });
    }

    // 3. For everything else, the chat must already be linked.
    const tenant = await prisma.tenant.findUnique({
      where: { telegramChatId: chatId },
    });
    if (!tenant) {
      await sendMessage(chatId, NEED_LINK);
      return NextResponse.json({ ok: true });
    }

    // 4. Photo → maintenance request (+ photo with the largest file_id).
    if (msg.photo && msg.photo.length > 0) {
      const largest = msg.photo[msg.photo.length - 1]; // Telegram orders smallest→largest
      const caption = msg.caption?.trim();
      await prisma.maintenanceRequest.create({
        data: {
          tenantId: tenant.id,
          title: caption || "Maintenance request",
          status: "open",
          photos: {
            create: {
              telegramFileId: largest.file_id,
              caption: caption || null,
            },
          },
        },
      });
      await sendMessage(chatId, PHOTO_ACK);
      return NextResponse.json({ ok: true });
    }

    // 5. Text → store an inbound message.
    if (text) {
      await prisma.message.create({
        data: {
          tenantId: tenant.id,
          direction: "inbound",
          body: text,
          detectedLanguage: detectLanguage(text),
          telegramMessageId: String(msg.message_id),
        },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Log and still return 200 so Telegram doesn't enter an aggressive retry loop.
    console.error("telegram webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}
