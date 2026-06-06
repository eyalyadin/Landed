-- Add photoFileId to Message so photo maintenance requests appear in chat threads.
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "photoFileId" TEXT;
