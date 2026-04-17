import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

async function main() {
  let connectionString = process.env.DATABASE_URL;
  if (connectionString?.includes('b0o4000oo8g80cws8gsoogk4')) {
    connectionString = connectionString.replace('b0o4000oo8g80cws8gsoogk4', '10.0.1.8');
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('--- Season Entries Top Points ---');
  const entries = await prisma.seasonEntry.findMany({
    take: 20,
    orderBy: { points: 'desc' },
    include: {
      user: true
    }
  });

  for (const e of entries) {
    console.log(`- ${e.user.name || e.user.discordTag}: ${e.points} pts`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
