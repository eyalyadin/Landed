// lib/reminders.ts
//
// Shared bilingual reminder text used by both the nightly overdue cron
// (app/api/cron/check-overdue/route.ts) and the on-demand remind endpoint
// (app/api/rent/remind/route.ts), so both produce identical wording.

import { formatILS } from "@/lib/format";

/**
 * Returns a Hebrew or English overdue-rent reminder message.
 * @param lang  tenant.preferredLanguage — "en" → English, anything else → Hebrew
 * @param count number of overdue payments
 * @param total sum of their amounts (ILS)
 */
export function reminderText(
  lang: string | null,
  count: number,
  total: number,
): string {
  const amount = formatILS(total);
  if (lang === "en") {
    return (
      `Friendly reminder: you have ${count} overdue rent payment(s) totaling ${amount}. ` +
      `Please arrange payment as soon as possible. Thank you!`
    );
  }
  return (
    `תזכורת ידידותית: יש ${count} תשלומי שכר דירה באיחור בסך ${amount}. ` +
    `נא להסדיר את התשלום בהקדם האפשרי. תודה!`
  );
}
