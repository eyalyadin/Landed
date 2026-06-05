// Server-only i18n helpers — imports "next/headers", do NOT import in Client Components.
import { cookies } from "next/headers";
import { type Locale, LOCALE_COOKIE, DEFAULT_LOCALE } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const val = cookieStore.get(LOCALE_COOKIE)?.value;
  if (val === "he" || val === "en") return val;
  return DEFAULT_LOCALE;
}
