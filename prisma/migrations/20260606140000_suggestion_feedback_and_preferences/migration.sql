-- CreateTable: SuggestionFeedback
-- Stores one row per AI suggestion. action starts as "dismissed" and is updated
-- to "accepted" or "edited" when the landlord sends (or edits then sends) the reply.
CREATE TABLE "SuggestionFeedback" (
    "id"            SERIAL        NOT NULL,
    "landlordId"    INTEGER       NOT NULL,
    "tenantId"      INTEGER       NOT NULL,
    "propertyId"    INTEGER,
    "promptContext" JSONB         NOT NULL DEFAULT '[]',
    "suggestedText" TEXT          NOT NULL,
    "action"        TEXT          NOT NULL DEFAULT 'dismissed',
    "finalText"     TEXT,
    "surface"       TEXT          NOT NULL DEFAULT 'message_reply',
    "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuggestionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LandlordPreferences
-- Aggregated from SuggestionFeedback by the nightly cron.
-- Injected into the Gemini system prompt to personalise future suggestions.
CREATE TABLE "LandlordPreferences" (
    "id"                SERIAL        NOT NULL,
    "landlordId"        INTEGER       NOT NULL,
    "preferredTone"     TEXT          NOT NULL DEFAULT 'neutral',
    "preferredLanguage" TEXT          NOT NULL DEFAULT 'auto',
    "avgReplyLength"    INTEGER       NOT NULL DEFAULT 30,
    "editPatterns"      JSONB         NOT NULL DEFAULT '[]',
    "updatedAt"         TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandlordPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SuggestionFeedback_landlordId_createdAt_idx"
    ON "SuggestionFeedback"("landlordId", "createdAt");

CREATE INDEX "SuggestionFeedback_tenantId_idx"
    ON "SuggestionFeedback"("tenantId");

CREATE INDEX "SuggestionFeedback_action_createdAt_idx"
    ON "SuggestionFeedback"("action", "createdAt");

CREATE UNIQUE INDEX "LandlordPreferences_landlordId_key"
    ON "LandlordPreferences"("landlordId");

-- AddForeignKey
ALTER TABLE "SuggestionFeedback"
    ADD CONSTRAINT "SuggestionFeedback_landlordId_fkey"
    FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SuggestionFeedback"
    ADD CONSTRAINT "SuggestionFeedback_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LandlordPreferences"
    ADD CONSTRAINT "LandlordPreferences_landlordId_fkey"
    FOREIGN KEY ("landlordId") REFERENCES "Landlord"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
