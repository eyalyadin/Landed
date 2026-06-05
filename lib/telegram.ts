// Thin wrapper over the Telegram Bot API using fetch (no third-party library).
// Server-side only: relies on TELEGRAM_BOT_TOKEN, which must never reach the browser.

const API_BASE = "https://api.telegram.org";

function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

async function callTelegram<T = unknown>(
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${API_BASE}/bot${botToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!data.ok) {
    throw new Error(`Telegram ${method} failed: ${data.description ?? "unknown error"}`);
  }
  return data.result as T;
}

export type TelegramMessage = { message_id: number };

export function sendMessage(chatId: string | number, text: string) {
  return callTelegram<TelegramMessage>("sendMessage", {
    chat_id: chatId,
    text,
  });
}

export function getFile(fileId: string) {
  return callTelegram<{ file_id: string; file_path?: string }>("getFile", {
    file_id: fileId,
  });
}

// Build the temporary download URL for a Telegram file path.
// IMPORTANT: file paths expire (~1h) — always re-fetch via getFile, never persist this URL.
export function fileDownloadUrl(filePath: string): string {
  return `${API_BASE}/file/bot${botToken()}/${filePath}`;
}

export function setWebhook(url: string, secretToken: string) {
  return callTelegram<boolean>("setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message", "edited_message"],
  });
}
