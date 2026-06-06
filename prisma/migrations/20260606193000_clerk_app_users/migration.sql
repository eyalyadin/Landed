-- Add Clerk-backed application users and owner scoping.
-- Existing rows are preserved and assigned to a temporary demo owner.
-- IF NOT EXISTS / DO $$ guards make this safe to re-run on a partially-applied DB.

CREATE TABLE IF NOT EXISTS "AppUser" (
    "id"        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "clerkId"   TEXT NOT NULL UNIQUE,
    "email"     TEXT NOT NULL,
    "name"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AppUser_email_idx" ON "AppUser"("email");

INSERT INTO "AppUser" ("clerkId", "email", "name")
VALUES ('demo-owner', 'demo@landed.local', 'Demo Owner')
ON CONFLICT ("clerkId") DO NOTHING;

-- Property owner scoping
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "ownerId" INTEGER;
UPDATE "Property"
SET "ownerId" = (SELECT "id" FROM "AppUser" WHERE "clerkId" = 'demo-owner')
WHERE "ownerId" IS NULL;
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Property' AND column_name = 'ownerId' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE "Property" ALTER COLUMN "ownerId" SET NOT NULL;
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS "Property_ownerId_idx" ON "Property"("ownerId");
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Property_ownerId_fkey') THEN
        ALTER TABLE "Property"
            ADD CONSTRAINT "Property_ownerId_fkey"
            FOREIGN KEY ("ownerId") REFERENCES "AppUser"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Vendor owner scoping
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "ownerId" INTEGER;
UPDATE "Vendor"
SET "ownerId" = (SELECT "id" FROM "AppUser" WHERE "clerkId" = 'demo-owner')
WHERE "ownerId" IS NULL;
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Vendor' AND column_name = 'ownerId' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE "Vendor" ALTER COLUMN "ownerId" SET NOT NULL;
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS "Vendor_ownerId_idx" ON "Vendor"("ownerId");
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Vendor_ownerId_fkey') THEN
        ALTER TABLE "Vendor"
            ADD CONSTRAINT "Vendor_ownerId_fkey"
            FOREIGN KEY ("ownerId") REFERENCES "AppUser"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- CalendarEvent owner scoping
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "ownerId" INTEGER;
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
CREATE INDEX IF NOT EXISTS "CalendarEvent_ownerId_idx" ON "CalendarEvent"("ownerId");
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CalendarEvent_ownerId_fkey') THEN
        ALTER TABLE "CalendarEvent"
            ADD CONSTRAINT "CalendarEvent_ownerId_fkey"
            FOREIGN KEY ("ownerId") REFERENCES "AppUser"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

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
