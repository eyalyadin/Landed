-- Add Clerk-backed application users and owner scoping.
-- Existing rows are preserved and assigned to a temporary demo owner.

CREATE TABLE "AppUser" (
    "id"        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "clerkId"   TEXT NOT NULL UNIQUE,
    "email"     TEXT NOT NULL,
    "name"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AppUser_email_idx" ON "AppUser"("email");

INSERT INTO "AppUser" ("clerkId", "email", "name")
VALUES ('demo-owner', 'demo@landed.local', 'Demo Owner')
ON CONFLICT ("clerkId") DO NOTHING;

ALTER TABLE "Property" ADD COLUMN "ownerId" INTEGER;
UPDATE "Property"
SET "ownerId" = (SELECT "id" FROM "AppUser" WHERE "clerkId" = 'demo-owner')
WHERE "ownerId" IS NULL;
ALTER TABLE "Property" ALTER COLUMN "ownerId" SET NOT NULL;
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");
ALTER TABLE "Property"
    ADD CONSTRAINT "Property_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "AppUser"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Vendor" ADD COLUMN "ownerId" INTEGER;
UPDATE "Vendor"
SET "ownerId" = (SELECT "id" FROM "AppUser" WHERE "clerkId" = 'demo-owner')
WHERE "ownerId" IS NULL;
ALTER TABLE "Vendor" ALTER COLUMN "ownerId" SET NOT NULL;
CREATE INDEX "Vendor_ownerId_idx" ON "Vendor"("ownerId");
ALTER TABLE "Vendor"
    ADD CONSTRAINT "Vendor_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "AppUser"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalendarEvent" ADD COLUMN "ownerId" INTEGER;
UPDATE "CalendarEvent" ce
SET "ownerId" = p."ownerId"
FROM "Property" p
WHERE ce."propertyId" = p."id" AND ce."ownerId" IS NULL;
UPDATE "CalendarEvent" ce
SET "ownerId" = p."ownerId"
FROM "Tenant" t
JOIN "Property" p ON p."id" = t."propertyId"
WHERE ce."tenantId" = t."id" AND ce."ownerId" IS NULL;
UPDATE "CalendarEvent" ce
SET "ownerId" = p."ownerId"
FROM "Job" j
JOIN "Property" p ON p."id" = j."propertyId"
WHERE ce."jobId" = j."id" AND ce."ownerId" IS NULL;
UPDATE "CalendarEvent"
SET "ownerId" = (SELECT "id" FROM "AppUser" WHERE "clerkId" = 'demo-owner')
WHERE "ownerId" IS NULL;
CREATE INDEX "CalendarEvent_ownerId_idx" ON "CalendarEvent"("ownerId");
ALTER TABLE "CalendarEvent"
    ADD CONSTRAINT "CalendarEvent_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "AppUser"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

DROP VIEW IF EXISTS vw_job_summary;
DROP VIEW IF EXISTS vw_property_summary;

CREATE VIEW vw_property_summary AS
SELECT
    p.id,
    p."ownerId",
    p.address,
    p.city,
    p."propertyType",
    p."unitLabel",
    p."occupancyStatus",
    p."monthlyRent",
    p."rentCurrency",
    p."leaseStartDate",
    p."leaseEndDate",
    p."managerName",
    p.notes,
    COUNT(DISTINCT t.id) FILTER (WHERE t."propertyId" = p.id) AS tenant_count,
    COUNT(DISTINCT j.id) FILTER (WHERE j.status != 'completed') AS open_job_count,
    COUNT(DISTINCT py.id) FILTER (WHERE py.status = 'overdue') AS overdue_payment_count
FROM "Property" p
LEFT JOIN "Tenant"  t  ON t."propertyId" = p.id
LEFT JOIN "Job"     j  ON j."propertyId" = p.id
LEFT JOIN "Payment" py ON py."propertyId" = p.id
GROUP BY p.id;

CREATE VIEW vw_job_summary AS
SELECT
    j.*,
    p."ownerId",
    p.address      AS property_address,
    p."unitLabel"  AS property_unit_label,
    p.city         AS property_city,
    t.name         AS tenant_name
FROM "Job" j
JOIN "Property" p ON p.id = j."propertyId"
LEFT JOIN "Tenant" t ON t.id = j."tenantId";
