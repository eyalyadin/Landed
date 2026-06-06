import { prisma } from "@/lib/prisma";

// ─── vw_property_summary ─────────────────────────────────────────────────────

export type PropertySummaryRow = {
  id: number;
  address: string;
  city: string;
  propertyType: string;
  unitLabel: string | null;
  occupancyStatus: string;
  monthlyRent: number;
  rentCurrency: string;
  leaseStartDate: Date | null;
  leaseEndDate: Date | null;
  managerName: string | null;
  notes: string | null;
  tenant_count: number;
  open_job_count: number;
  overdue_payment_count: number;
};

export async function getPropertySummaries(ownerId: number): Promise<PropertySummaryRow[]> {
  const rows = await prisma.$queryRaw<PropertySummaryRow[]>`
    SELECT * FROM vw_property_summary WHERE "ownerId" = ${ownerId} ORDER BY address
  `;
  return rows.map((r) => ({
    ...r,
    monthlyRent: Number(r.monthlyRent),
    tenant_count: Number(r.tenant_count),
    open_job_count: Number(r.open_job_count),
    overdue_payment_count: Number(r.overdue_payment_count),
  }));
}

// ─── vw_tenant_summary ───────────────────────────────────────────────────────

export type TenantSummaryRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  propertyId: number | null;
  property_address: string | null;
  property_unit_label: string | null;
  property_monthly_rent: number | null;
  property_rent_currency: string | null;
  telegramChatId: string | null;
  linkToken: string;
  preferredLanguage: string | null;
  moveInDate: Date | null;
  leaseEndDate: Date | null;
  contractStatus: string | null;
  thread_id: number | null;
  unreadCount: number;
  lastMessageAt: Date | null;
  thread_status: string | null;
  thread_urgency: string | null;
};

export async function getTenantSummaries(ownerId: number): Promise<TenantSummaryRow[]> {
  const rows = await prisma.$queryRaw<TenantSummaryRow[]>`
    SELECT *
    FROM vw_tenant_summary
    WHERE "propertyId" IN (SELECT id FROM "Property" WHERE "ownerId" = ${ownerId})
    ORDER BY name
  `;
  return rows.map((r) => ({
    ...r,
    property_monthly_rent: r.property_monthly_rent !== null ? Number(r.property_monthly_rent) : null,
    unreadCount: Number(r.unreadCount ?? 0),
  }));
}

// ─── vw_job_summary ──────────────────────────────────────────────────────────

export type JobSummaryRow = {
  id: number;
  propertyId: number;
  property_address: string;
  property_unit_label: string | null;
  property_city: string;
  tenantId: number | null;
  tenant_name: string | null;
  title: string;
  category: string;
  priority: string;
  status: string;
  dueDate: Date | null;
  contractorName: string | null;
  createdAt: Date;
};

export async function getJobSummaries(ownerId: number): Promise<JobSummaryRow[]> {
  const rows = await prisma.$queryRaw<JobSummaryRow[]>`
    SELECT * FROM vw_job_summary WHERE "ownerId" = ${ownerId} ORDER BY status, "createdAt" DESC
  `;
  return rows;
}
