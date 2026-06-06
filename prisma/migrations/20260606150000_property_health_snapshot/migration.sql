-- CreateTable: PropertyHealthSnapshot
-- Stores one row per property per scoring event (daily or on significant change).
-- Used by PropertyHealthCard to derive trend direction over time.
CREATE TABLE "PropertyHealthSnapshot" (
    "id"         SERIAL        NOT NULL,
    "propertyId" INTEGER       NOT NULL,
    "score"      INTEGER       NOT NULL,
    "riskLevel"  TEXT          NOT NULL,
    "reasons"    JSONB         NOT NULL DEFAULT '[]',
    "metrics"    JSONB         NOT NULL DEFAULT '{}',
    "createdAt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyHealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (primary lookup: newest snapshot per property)
CREATE INDEX "PropertyHealthSnapshot_propertyId_createdAt_idx"
    ON "PropertyHealthSnapshot"("propertyId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "PropertyHealthSnapshot"
    ADD CONSTRAINT "PropertyHealthSnapshot_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
