# Fixing Stuck Migration: 20260606193000_clerk_app_users

## Problem
The migration `20260606193000_clerk_app_users` is marked as failed in the `_prisma_migrations` table, blocking all future migrations with Prisma error P3009.

## Solution

### Step 1: Connect to Your Database
Use your Postgres connection details from Railway:
- Host: `postgres.railway.internal` (or your public URL)
- Port: `5432`
- Database: (from your DATABASE_URL)
- User: (from your DATABASE_URL)
- Password: (from your DATABASE_URL)

### Step 2: Run This SQL
```sql
DELETE FROM "_prisma_migrations" 
WHERE migration = '20260606193000_clerk_app_users';
```

### Step 3: Verify
```sql
SELECT migration, finished_at, rolled_back_at 
FROM "_prisma_migrations" 
ORDER BY started_at DESC 
LIMIT 5;
```

The stuck migration should no longer appear.

### Step 4: Redeploy
Push a new commit to trigger a deployment. The pre-deploy command will now run successfully.

## Tools to Connect
- **psql** (command line): `psql postgresql://user:password@host:port/database`
- **DBeaver** (GUI): Free database client
- **Railway Dashboard**: Some database services have a built-in query tool

