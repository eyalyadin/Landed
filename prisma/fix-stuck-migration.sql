-- Fix stuck Prisma migration: 20260606193000_clerk_app_users
-- 
-- This SQL script removes the failed migration record from the _prisma_migrations table.
-- The migration will be retried on the next "npx prisma migrate deploy" run.
--
-- To use this:
-- 1. Connect to your database
-- 2. Run this SQL script
-- 3. Redeploy your application

DELETE FROM "_prisma_migrations" 
WHERE migration = '20260606193000_clerk_app_users';

-- Verify the migration was removed
SELECT migration, finished_at, rolled_back_at 
FROM "_prisma_migrations" 
ORDER BY started_at DESC 
LIMIT 5;

