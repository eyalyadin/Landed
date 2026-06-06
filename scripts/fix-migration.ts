#!/usr/bin/env node
/**
 * Fix stuck Prisma migration
 * 
 * This script removes the failed migration record from the _prisma_migrations table,
 * allowing Prisma to retry the migration on the next deploy.
 * 
 * Usage: npx ts-node scripts/fix-migration.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMigration() {
  try {
    console.log('🔧 Fixing stuck migration: 20260606193000_clerk_app_users\n');
    
    // Check current state
    const before = await prisma.$queryRawUnsafe<any[]>(
      `SELECT migration, finished_at, rolled_back_at FROM "_prisma_migrations" WHERE migration = '20260606193000_clerk_app_users'`
    );
    
    if (before.length === 0) {
      console.log('✅ Migration record not found - already fixed or never existed.');
      process.exit(0);
    }
    
    console.log('Current state:');
    console.log(before[0]);
    console.log();
    
    // Delete the failed migration record
    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM "_prisma_migrations" WHERE migration = '20260606193000_clerk_app_users'`
    );
    
    console.log(`✅ Deleted ${result} failed migration record(s)\n`);
    
    // Verify it's gone
    const after = await prisma.$queryRawUnsafe<any[]>(
      `SELECT migration, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY started_at DESC LIMIT 5`
    );
    
    console.log('Remaining migrations (last 5):');
    after.forEach((m: any) => {
      console.log(`  - ${m.migration}`);
    });
    
    console.log('\n✅ Migration record fixed! You can now redeploy.');
    console.log('   Run: git push to trigger a new deployment');
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigration();

