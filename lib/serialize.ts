import type { Decimal } from "@/app/generated/prisma/client/runtime/library";

/** Convert a Prisma Decimal to a plain JS number. */
export function dec(value: Decimal | string | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value);
}

/** Convert a JS Date to an ISO string; returns null for null/undefined. */
export function dateIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

/** Convert a Date to a dd/MM/yyyy string (Israeli display format). */
export function dateDDMMYYYY(value: Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
