// Date helpers for rent logic. All calendar dates are stored as @db.Date, which
// Prisma reads/writes as a UTC-midnight Date — so we always build dates at UTC
// midnight to avoid any timezone day-shift.

const TZ = "Asia/Jerusalem";

export function dateAtUTCMidnight(year: number, monthZeroBased: number, day: number): Date {
  return new Date(Date.UTC(year, monthZeroBased, day));
}

// Parse a "YYYY-MM-DD" form value into a UTC-midnight Date.
export function parseISODateUTC(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = dateAtUTCMidnight(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

// Today's calendar date in Asia/Jerusalem, as a UTC-midnight Date.
export function jerusalemTodayUTCDate(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return dateAtUTCMidnight(get("year"), get("month") - 1, get("day"));
}

// The 12 monthly due dates for a schedule: first dueDayOfMonth on/after startDate.
export function generateDueDates(
  startDate: Date,
  dueDayOfMonth: number,
  count = 12,
): Date[] {
  const year = startDate.getUTCFullYear();
  let month = startDate.getUTCMonth();
  // If the due day this month already passed at start, begin next month.
  if (startDate.getUTCDate() > dueDayOfMonth) month += 1;

  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    const m = month + i;
    dates.push(dateAtUTCMidnight(year + Math.floor(m / 12), m % 12, dueDayOfMonth));
  }
  return dates;
}
