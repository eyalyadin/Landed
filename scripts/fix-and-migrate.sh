#!/bin/bash
# Fix stuck migration and run Prisma migrations
# This script removes the failed migration record and retries the migration

set -e

echo "🔧 Checking for stuck migrations..."

# Use psql to check and fix the stuck migration
# This requires DATABASE_URL to be set in the environment
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set"
  exit 1
fi

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\([^@]*\)@.*/\1/p')
PGHOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\).*/\1/p')
PGPORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
PGUSER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\).*/\1/p')
PGDATABASE=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

export PGPASSWORD

# Check if the stuck migration exists
STUCK_MIGRATION=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c \
  "SELECT COUNT(*) FROM \"_prisma_migrations\" WHERE migration = '20260606193000_clerk_app_users' AND finished_at IS NULL;")

if [ "$STUCK_MIGRATION" -gt 0 ]; then
  echo "⚠️  Found stuck migration. Removing failed record..."
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c \
    "DELETE FROM \"_prisma_migrations\" WHERE migration = '20260606193000_clerk_app_users';"
  echo "✅ Stuck migration removed"
else
  echo "✅ No stuck migrations found"
fi

# Now run the migrations
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ All done!"

