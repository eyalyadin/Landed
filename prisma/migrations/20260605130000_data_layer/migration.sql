-- ============================================================
-- Migration: 20260605130000_data_layer
-- Full schema rebuild: drop old tables + create new schema.
-- IMPORTANT: take a pg_dump backup of Railway production BEFORE
-- applying this migration — all existing rows will be deleted.
-- ============================================================

-- ─── Drop old schema ─────────────────────────────────────────

DROP TABLE IF EXISTS "RentInvoice"      CASCADE;
DROP TABLE IF EXISTS "RentSchedule"     CASCADE;
DROP TABLE IF EXISTS "MaintenancePhoto" CASCADE;
DROP TABLE IF EXISTS "MaintenanceRequest" CASCADE;
DROP TABLE IF EXISTS "Message"          CASCADE;
DROP TABLE IF EXISTS "Tenant"           CASCADE;
DROP TABLE IF EXISTS "Landlord"         CASCADE;

DROP TYPE IF EXISTS "InvoiceStatus"     CASCADE;
DROP TYPE IF EXISTS "MaintenanceStatus" CASCADE;
DROP TYPE IF EXISTS "MessageDirection"  CASCADE;

-- ─── New enums ───────────────────────────────────────────────

CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');
CREATE TYPE "ThreadStatus"     AS ENUM ('open', 'resolved');
CREATE TYPE "ThreadUrgency"    AS ENUM ('normal', 'urgent');
CREATE TYPE "JobStatus"        AS ENUM ('new', 'in_progress', 'waiting_on_tenant', 'waiting_on_vendor', 'completed');
CREATE TYPE "JobPriority"      AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE "JobCategory"      AS ENUM ('repair', 'payment_followup', 'contract_renewal', 'tenant_issue', 'inspection', 'maintenance');
CREATE TYPE "PaymentStatus"    AS ENUM ('pending', 'paid', 'overdue', 'partial');
CREATE TYPE "PaymentType"      AS ENUM ('rent', 'deposit', 'fee');
CREATE TYPE "DocumentType"     AS ENUM ('rental_contract', 'inventory', 'deposit_document', 'keys_record', 'other');
CREATE TYPE "VendorCategory"   AS ENUM ('ac_hvac', 'electrician', 'plumbing', 'painting', 'locksmith', 'handyman', 'cleaning', 'appliance_repair', 'pest_control');
CREATE TYPE "PropertyType"     AS ENUM ('apartment', 'house', 'condo', 'townhouse', 'commercial');
CREATE TYPE "OccupancyStatus"  AS ENUM ('occupied', 'vacant');
CREATE TYPE "CalendarEventType" AS ENUM ('rent_due', 'lease_start', 'lease_end', 'renewal_reminder', 'scheduled_repair', 'move_in', 'move_out', 'inspection');

-- ─── New tables ──────────────────────────────────────────────

CREATE TABLE "Landlord" (
    "id"   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name" TEXT NOT NULL
);

CREATE TABLE "Property" (
    "id"              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "landlordId"      INTEGER NOT NULL,
    "address"         TEXT NOT NULL,
    "city"            TEXT NOT NULL,
    "propertyType"    "PropertyType"    NOT NULL DEFAULT 'apartment',
    "unitLabel"       TEXT,
    "occupancyStatus" "OccupancyStatus" NOT NULL DEFAULT 'vacant',
    "monthlyRent"     DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rentCurrency"    TEXT NOT NULL DEFAULT 'ILS',
    "leaseStartDate"  DATE,
    "leaseEndDate"    DATE,
    "managerName"     TEXT,
    "notes"           TEXT
);

CREATE TABLE "Tenant" (
    "id"                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "landlordId"        INTEGER NOT NULL,
    "propertyId"        INTEGER,
    "name"              TEXT NOT NULL,
    "email"             TEXT,
    "phone"             TEXT,
    "telegramChatId"    TEXT UNIQUE,
    "linkToken"         TEXT NOT NULL UNIQUE,
    "preferredLanguage" TEXT,
    "moveInDate"        DATE,
    "leaseEndDate"      DATE,
    "paymentMethod"     TEXT,
    "contractStatus"    TEXT,
    "keysAccessNotes"   TEXT,
    "notes"             TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "MessageThread" (
    "id"                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "tenantId"            INTEGER NOT NULL UNIQUE,
    "unreadCount"         INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt"       TIMESTAMP(3),
    "status"              "ThreadStatus"  NOT NULL DEFAULT 'open',
    "urgency"             "ThreadUrgency" NOT NULL DEFAULT 'normal',
    "summary"             TEXT,
    "suggestedNextAction" TEXT
);

CREATE TABLE "Message" (
    "id"                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "threadId"          INTEGER NOT NULL,
    "tenantId"          INTEGER NOT NULL,
    "direction"         "MessageDirection" NOT NULL,
    "body"              TEXT NOT NULL,
    "detectedLanguage"  TEXT,
    "telegramMessageId" TEXT,
    "isInternalNote"    BOOLEAN NOT NULL DEFAULT false,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Job" (
    "id"             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "propertyId"     INTEGER NOT NULL,
    "tenantId"       INTEGER,
    "sourceThreadId" INTEGER,
    "title"          TEXT NOT NULL,
    "description"    TEXT,
    "category"       "JobCategory" NOT NULL DEFAULT 'repair',
    "priority"       "JobPriority" NOT NULL DEFAULT 'medium',
    "status"         "JobStatus"   NOT NULL DEFAULT 'new',
    "dueDate"        DATE,
    "contractorName" TEXT,
    "notes"          TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "JobAttachment" (
    "id"             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "jobId"          INTEGER NOT NULL,
    "telegramFileId" TEXT NOT NULL,
    "caption"        TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Vendor" (
    "id"            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "name"          TEXT NOT NULL,
    "phone"         TEXT NOT NULL,
    "email"         TEXT,
    "category"      "VendorCategory" NOT NULL,
    "serviceArea"   TEXT NOT NULL,
    "notes"         TEXT,
    "isPreferred"   BOOLEAN NOT NULL DEFAULT false,
    "contactPerson" TEXT,
    "rating"        DECIMAL(3,1),
    "activeJobs"    INTEGER NOT NULL DEFAULT 0,
    "completedJobs" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "Document" (
    "id"           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "propertyId"   INTEGER NOT NULL,
    "documentName" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'rental_contract',
    "fileUrl"      TEXT,
    "uploadedAt"   DATE NOT NULL
);

CREATE TABLE "RentSchedule" (
    "id"            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "tenantId"      INTEGER NOT NULL,
    "amount"        DECIMAL(10,2) NOT NULL,
    "dueDayOfMonth" INTEGER NOT NULL,
    "startDate"     DATE NOT NULL,
    "endDate"       DATE,
    "active"        BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "Payment" (
    "id"             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "propertyId"     INTEGER NOT NULL,
    "tenantId"       INTEGER NOT NULL,
    "rentScheduleId" INTEGER,
    "amount"         DECIMAL(10,2) NOT NULL,
    "currency"       TEXT NOT NULL DEFAULT 'ILS',
    "type"           "PaymentType"   NOT NULL DEFAULT 'rent',
    "status"         "PaymentStatus" NOT NULL DEFAULT 'pending',
    "dueDate"        DATE NOT NULL,
    "paidDate"       DATE,
    "source"         TEXT,
    "reference"      TEXT,
    "notes"          TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CalendarEvent" (
    "id"         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "title"      TEXT NOT NULL,
    "eventType"  "CalendarEventType" NOT NULL,
    "propertyId" INTEGER,
    "tenantId"   INTEGER,
    "jobId"      INTEGER,
    "start"      DATE NOT NULL,
    "end"        DATE,
    "status"     TEXT,
    "notes"      TEXT
);

-- ─── Indexes ─────────────────────────────────────────────────

CREATE INDEX "Property_landlordId_idx"       ON "Property"("landlordId");
CREATE INDEX "Tenant_landlordId_idx"          ON "Tenant"("landlordId");
CREATE INDEX "Tenant_propertyId_idx"          ON "Tenant"("propertyId");
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");
CREATE INDEX "Message_tenantId_createdAt_idx" ON "Message"("tenantId", "createdAt");
CREATE INDEX "Job_propertyId_idx"             ON "Job"("propertyId");
CREATE INDEX "Job_tenantId_idx"               ON "Job"("tenantId");
CREATE INDEX "Job_status_idx"                 ON "Job"("status");
CREATE INDEX "JobAttachment_jobId_idx"        ON "JobAttachment"("jobId");
CREATE INDEX "Document_propertyId_idx"        ON "Document"("propertyId");
CREATE INDEX "RentSchedule_tenantId_idx"      ON "RentSchedule"("tenantId");
CREATE INDEX "Payment_tenantId_idx"           ON "Payment"("tenantId");
CREATE INDEX "Payment_propertyId_idx"         ON "Payment"("propertyId");
CREATE INDEX "Payment_rentScheduleId_idx"     ON "Payment"("rentScheduleId");
CREATE INDEX "Payment_status_dueDate_idx"     ON "Payment"("status", "dueDate");
CREATE INDEX "CalendarEvent_propertyId_idx"   ON "CalendarEvent"("propertyId");
CREATE INDEX "CalendarEvent_tenantId_idx"     ON "CalendarEvent"("tenantId");
CREATE INDEX "CalendarEvent_start_idx"        ON "CalendarEvent"("start");

-- ─── Foreign keys ────────────────────────────────────────────

ALTER TABLE "Property"      ADD CONSTRAINT "Property_landlordId_fkey"         FOREIGN KEY ("landlordId")      REFERENCES "Landlord"("id")      ON DELETE CASCADE;
ALTER TABLE "Tenant"        ADD CONSTRAINT "Tenant_landlordId_fkey"           FOREIGN KEY ("landlordId")      REFERENCES "Landlord"("id")      ON DELETE CASCADE;
ALTER TABLE "Tenant"        ADD CONSTRAINT "Tenant_propertyId_fkey"           FOREIGN KEY ("propertyId")      REFERENCES "Property"("id")      ON DELETE SET NULL;
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_tenantId_fkey"      FOREIGN KEY ("tenantId")        REFERENCES "Tenant"("id")        ON DELETE CASCADE;
ALTER TABLE "Message"       ADD CONSTRAINT "Message_threadId_fkey"            FOREIGN KEY ("threadId")        REFERENCES "MessageThread"("id") ON DELETE CASCADE;
ALTER TABLE "Message"       ADD CONSTRAINT "Message_tenantId_fkey"            FOREIGN KEY ("tenantId")        REFERENCES "Tenant"("id")        ON DELETE CASCADE;
ALTER TABLE "Job"           ADD CONSTRAINT "Job_propertyId_fkey"              FOREIGN KEY ("propertyId")      REFERENCES "Property"("id")      ON DELETE CASCADE;
ALTER TABLE "Job"           ADD CONSTRAINT "Job_tenantId_fkey"                FOREIGN KEY ("tenantId")        REFERENCES "Tenant"("id")        ON DELETE SET NULL;
ALTER TABLE "JobAttachment" ADD CONSTRAINT "JobAttachment_jobId_fkey"         FOREIGN KEY ("jobId")           REFERENCES "Job"("id")           ON DELETE CASCADE;
ALTER TABLE "Document"      ADD CONSTRAINT "Document_propertyId_fkey"         FOREIGN KEY ("propertyId")      REFERENCES "Property"("id")      ON DELETE CASCADE;
ALTER TABLE "RentSchedule"  ADD CONSTRAINT "RentSchedule_tenantId_fkey"       FOREIGN KEY ("tenantId")        REFERENCES "Tenant"("id")        ON DELETE CASCADE;
ALTER TABLE "Payment"       ADD CONSTRAINT "Payment_propertyId_fkey"          FOREIGN KEY ("propertyId")      REFERENCES "Property"("id")      ON DELETE CASCADE;
ALTER TABLE "Payment"       ADD CONSTRAINT "Payment_tenantId_fkey"            FOREIGN KEY ("tenantId")        REFERENCES "Tenant"("id")        ON DELETE CASCADE;
ALTER TABLE "Payment"       ADD CONSTRAINT "Payment_rentScheduleId_fkey"      FOREIGN KEY ("rentScheduleId")  REFERENCES "RentSchedule"("id")  ON DELETE SET NULL;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_propertyId_fkey"    FOREIGN KEY ("propertyId")      REFERENCES "Property"("id")      ON DELETE SET NULL;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_tenantId_fkey"      FOREIGN KEY ("tenantId")        REFERENCES "Tenant"("id")        ON DELETE SET NULL;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_jobId_fkey"         FOREIGN KEY ("jobId")           REFERENCES "Job"("id")           ON DELETE SET NULL;

-- ─── Trigger: auto-create MessageThread on Tenant insert ─────

CREATE OR REPLACE FUNCTION fn_create_tenant_thread()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO "MessageThread" ("tenantId") VALUES (NEW."id");
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_create_tenant_thread
    AFTER INSERT ON "Tenant"
    FOR EACH ROW EXECUTE FUNCTION fn_create_tenant_thread();

-- ─── SQL Views ───────────────────────────────────────────────

-- 1. Property summary (occupancy + open jobs + payment status)
CREATE OR REPLACE VIEW vw_property_summary AS
SELECT
    p.id,
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
    COUNT(DISTINCT t.id)                                    AS tenant_count,
    COUNT(DISTINCT j.id) FILTER (WHERE j.status != 'completed') AS open_job_count,
    COUNT(DISTINCT py.id) FILTER (WHERE py.status = 'overdue')  AS overdue_payment_count
FROM "Property" p
LEFT JOIN "Tenant"  t  ON t."propertyId" = p.id
LEFT JOIN "Job"     j  ON j."propertyId" = p.id
LEFT JOIN "Payment" py ON py."propertyId" = p.id
GROUP BY p.id;

-- 2. Tenant summary (with property address + payment status)
CREATE OR REPLACE VIEW vw_tenant_summary AS
SELECT
    t.id,
    t."landlordId",
    t."propertyId",
    t.name,
    t.email,
    t.phone,
    t."telegramChatId",
    t."linkToken",
    t."preferredLanguage",
    t."moveInDate",
    t."leaseEndDate",
    t."paymentMethod",
    t."contractStatus",
    t."keysAccessNotes",
    t.notes,
    t."createdAt",
    p.address      AS property_address,
    p.city         AS property_city,
    p."unitLabel"  AS property_unit_label,
    p."monthlyRent" AS property_monthly_rent,
    p."rentCurrency" AS property_rent_currency,
    mt.id          AS thread_id,
    mt."unreadCount",
    mt."lastMessageAt",
    mt.status      AS thread_status,
    mt.urgency     AS thread_urgency
FROM "Tenant" t
LEFT JOIN "Property"     p  ON p.id = t."propertyId"
LEFT JOIN "MessageThread" mt ON mt."tenantId" = t.id;

-- 3. Payment status (for cron overdue detection)
CREATE OR REPLACE VIEW vw_payment_status AS
SELECT
    py.*,
    t.name             AS tenant_name,
    t."telegramChatId" AS tenant_telegram_chat_id,
    t."preferredLanguage" AS tenant_preferred_language,
    p.address          AS property_address
FROM "Payment" py
JOIN "Tenant"   t ON t.id = py."tenantId"
JOIN "Property" p ON p.id = py."propertyId";

-- 4. Thread summary (last message preview + unread)
CREATE OR REPLACE VIEW vw_thread_summary AS
SELECT
    mt.*,
    t.name             AS tenant_name,
    t."propertyId"     AS property_id,
    p.address          AS property_address,
    p."unitLabel"      AS property_unit_label,
    (
        SELECT body FROM "Message" m
        WHERE m."threadId" = mt.id
        ORDER BY m."createdAt" DESC
        LIMIT 1
    )                  AS last_message_preview
FROM "MessageThread" mt
JOIN "Tenant"   t ON t.id = mt."tenantId"
LEFT JOIN "Property" p ON p.id = t."propertyId";

-- 5. Job summary (with tenant + property context)
CREATE OR REPLACE VIEW vw_job_summary AS
SELECT
    j.*,
    p.address      AS property_address,
    p."unitLabel"  AS property_unit_label,
    p.city         AS property_city,
    t.name         AS tenant_name
FROM "Job" j
JOIN "Property" p ON p.id = j."propertyId"
LEFT JOIN "Tenant" t ON t.id = j."tenantId";
