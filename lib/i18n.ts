// Shared i18n — safe to import in both Server and Client components.
// Keep this file free of any "next/headers" or other server-only imports.

export type Locale = "he" | "en";
export const LOCALE_COOKIE = "landed_locale";
export const DEFAULT_LOCALE: Locale = "en";

// ─── Dictionary type ────────────────────────────────────────────────────────
export interface Dict {
  app: { title: string; description: string };
  nav: {
    logout: string;
    back: string;
    backLabel: string;
  };
  login: {
    title: string;
    subtitle: string;
    passwordLabel: string;
    submit: string;
    submitting: string;
    error: string;
  };
  dashboard: {
    title: string;
    tenantsCount: (n: number) => string;
    noMessages: string;
    maintenanceBadge: (n: number) => string;
    linked: string;
    unlinked: string;
    inviteLabel: string;
  };
  thread: {
    linkedYes: string;
    linkedNo: string;
    noMessages: string;
    replyPlaceholder: string;
    suggest: string;
    suggesting: string;
    send: string;
    sending: string;
    suggestError: string;
    sendError: string;
    notLinked: string;
  };
  maintenance: {
    title: string;
    empty: string;
    photoAlt: string;
    status: { open: string; in_progress: string; resolved: string };
  };
  rent: {
    title: string;
    scheduleSummary: (amount: string, day: number, date: string) => string;
    newSchedule: string;
    amount: string;
    dueDay: string;
    startDate: string;
    createBtn: string;
    noInvoices: string;
    markPaid: string;
    unmarkPaid: string;
    createError: string;
    status: { pending: string; paid: string; overdue: string };
  };
}

// ─── English dictionary ──────────────────────────────────────────────────────
const en: Dict = {
  app: {
    title: "Tenant Manager",
    description: "Manage tenant communication, maintenance, and rent",
  },
  nav: {
    logout: "Logout",
    back: "← Back",
    backLabel: "Back to tenant list",
  },
  login: {
    title: "Landlord Login",
    subtitle: "Enter your password to access the dashboard",
    passwordLabel: "Password",
    submit: "Login",
    submitting: "Logging in…",
    error: "Login failed. Please try again.",
  },
  dashboard: {
    title: "Tenant Manager",
    tenantsCount: (n) => `${n} tenant${n !== 1 ? "s" : ""}`,
    noMessages: "No messages yet",
    maintenanceBadge: (n) => `${n} maintenance`,
    linked: "Linked ✓",
    unlinked: "Not linked",
    inviteLabel: "Telegram invite link:",
  },
  thread: {
    linkedYes: "Linked ✓",
    linkedNo: "Not linked",
    noMessages: "No messages yet",
    replyPlaceholder: "Write a reply…",
    suggest: "Suggest reply (AI)",
    suggesting: "Thinking…",
    send: "Send",
    sending: "Sending…",
    suggestError: "Suggestion failed. Please try again.",
    sendError: "Failed to send. Please try again.",
    notLinked: "Tenant hasn't linked Telegram yet — messaging is unavailable.",
  },
  maintenance: {
    title: "Maintenance Requests",
    empty: "No maintenance requests",
    photoAlt: "Maintenance photo",
    status: { open: "Open", in_progress: "In progress", resolved: "Resolved" },
  },
  rent: {
    title: "Rent",
    scheduleSummary: (amount, day, date) =>
      `${amount} · Day ${day} of month · From ${date}`,
    newSchedule: "New payment schedule",
    amount: "Amount (₪)",
    dueDay: "Day of month (1–28)",
    startDate: "Start date",
    createBtn: "Create schedule + 12 invoices",
    noInvoices: "No invoices yet",
    markPaid: "Mark as paid",
    unmarkPaid: "Undo payment",
    createError: "Failed to create schedule",
    status: { pending: "Pending", paid: "Paid", overdue: "Overdue" },
  },
};

// ─── Hebrew dictionary ───────────────────────────────────────────────────────
const he: Dict = {
  app: {
    title: "ניהול שוכרים",
    description: "כלי לניהול תקשורת, תחזוקה ושכר דירה מול שוכרים",
  },
  nav: {
    logout: "יציאה",
    back: "← חזרה",
    backLabel: "חזרה לרשימת השוכרים",
  },
  login: {
    title: "כניסת בעל הבית",
    subtitle: "Landlord login",
    passwordLabel: "סיסמה",
    submit: "כניסה",
    submitting: "מתחבר…",
    error: "התחברות נכשלה, נסה שוב",
  },
  dashboard: {
    title: "ניהול שוכרים",
    tenantsCount: (n) => `${n} שוכרים`,
    noMessages: "אין הודעות עדיין",
    maintenanceBadge: (n) => `${n} תחזוקה`,
    linked: "מקושר ✓",
    unlinked: "לא מקושר",
    inviteLabel: "קישור הזמנה לטלגרם:",
  },
  thread: {
    linkedYes: "מקושר ✓",
    linkedNo: "לא מקושר",
    noMessages: "אין הודעות עדיין",
    replyPlaceholder: "כתוב תשובה…",
    suggest: "הצעת תשובה (AI)",
    suggesting: "חושב…",
    send: "שליחה",
    sending: "שולח…",
    suggestError: "הצעה נכשלה, נסה שוב",
    sendError: "שליחה נכשלה, נסה שוב",
    notLinked: "השוכר עדיין לא קושר לטלגרם — אי אפשר לשלוח הודעה.",
  },
  maintenance: {
    title: "בקשות תחזוקה",
    empty: "אין בקשות תחזוקה",
    photoAlt: "תמונת תחזוקה",
    status: { open: "פתוח", in_progress: "בטיפול", resolved: "טופל" },
  },
  rent: {
    title: "שכר דירה",
    scheduleSummary: (amount, day, date) =>
      `${amount} · כל ${day} בחודש · החל מ-${date}`,
    newSchedule: "לוח תשלומים חדש",
    amount: "סכום (₪)",
    dueDay: "יום בחודש (1–28)",
    startDate: "תאריך התחלה",
    createBtn: "צור לוח + 12 חשבוניות",
    noInvoices: "אין חשבוניות עדיין",
    markPaid: "סמן כשולם",
    unmarkPaid: "בטל תשלום",
    createError: "יצירת לוח נכשלה",
    status: { pending: "ממתין", paid: "שולם", overdue: "באיחור" },
  },
};

// ─── Helpers (pure, no server deps) ──────────────────────────────────────────
const dictionaries: Record<Locale, Dict> = { en, he };

export function getDict(locale: Locale): Dict {
  return dictionaries[locale];
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return locale === "he" ? "rtl" : "ltr";
}
