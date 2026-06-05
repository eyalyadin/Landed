import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/telegram";
import { detectLanguage } from "@/lib/lang";

export const dynamic = "force-dynamic";

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

    // /start <token> → link this chat to the matching tenant.
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

    // For everything else, the chat must be linked.
    const tenant = await prisma.tenant.findUnique({
      where: { telegramChatId: chatId },
      include: { thread: true },
    });
    if (!tenant) {
      await sendMessage(chatId, NEED_LINK);
      return NextResponse.json({ ok: true });
    }

    // Photo → Job + JobAttachment.
    if (msg.photo && msg.photo.length > 0) {
      const largest = msg.photo[msg.photo.length - 1];
      const caption = msg.caption?.trim();
      const propertyId = tenant.propertyId;
      if (propertyId) {
        await prisma.job.create({
          data: {
            propertyId,
            tenantId: tenant.id,
            title: caption || "Maintenance request",
            category: "repair",
            status: "new",
            attachments: {
              create: {
                telegramFileId: largest.file_id,
                caption: caption || null,
              },
            },
          },
        });
      }
      await sendMessage(chatId, PHOTO_ACK);
      return NextResponse.json({ ok: true });
    }

    // Text → store an inbound message in the tenant's thread.
    if (text && tenant.thread) {
      const thread = tenant.thread;
      await prisma.$transaction([
        prisma.message.create({
          data: {
            threadId: thread.id,
            tenantId: tenant.id,
            direction: "inbound",
            body: text,
            detectedLanguage: detectLanguage(text),
            telegramMessageId: String(msg.message_id),
          },
        }),
        prisma.messageThread.update({
          where: { id: thread.id },
          data: {
            unreadCount: { increment: 1 },
            lastMessageAt: new Date(),
          },
        }),
      ]);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("telegram webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}
