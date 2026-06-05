import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Fixed IDs + link tokens keep the seed idempotent (safe to re-run).
const LANDLORD_ID = "landlord_seed_1";

const TENANTS = [
  {
    id: "tenant_seed_1",
    name: "דנה לוי",
    unitLabel: "דירה 1",
    phone: "+972501112233",
    linkToken: "seed-token-dana",
    preferredLanguage: "he",
  },
  {
    id: "tenant_seed_2",
    name: "יוסי כהן",
    unitLabel: "דירה 2",
    phone: "+972502223344",
    linkToken: "seed-token-yossi",
    preferredLanguage: "he",
  },
  {
    id: "tenant_seed_3",
    name: "Sarah Johnson",
    unitLabel: "דירה 3",
    phone: "+972503334455",
    linkToken: "seed-token-sarah",
    preferredLanguage: "en",
  },
];

async function main() {
  const landlord = await prisma.landlord.upsert({
    where: { id: LANDLORD_ID },
    update: { name: "בעל הבית" },
    create: { id: LANDLORD_ID, name: "בעל הבית" },
  });
  console.log(`Landlord ready: ${landlord.name} (${landlord.id})`);

  for (const t of TENANTS) {
    const tenant = await prisma.tenant.upsert({
      where: { id: t.id },
      update: {
        name: t.name,
        unitLabel: t.unitLabel,
        phone: t.phone,
        preferredLanguage: t.preferredLanguage,
        linkToken: t.linkToken,
        landlordId: landlord.id,
      },
      create: {
        id: t.id,
        name: t.name,
        unitLabel: t.unitLabel,
        phone: t.phone,
        preferredLanguage: t.preferredLanguage,
        linkToken: t.linkToken,
        landlordId: landlord.id,
      },
    });
    console.log(`  Tenant ready: ${tenant.name} — ${tenant.unitLabel} (${tenant.id})`);
  }

  console.log("Seed complete: 1 landlord + 3 tenants.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
