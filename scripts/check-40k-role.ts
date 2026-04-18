import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  let connectionString = process.env.DATABASE_URL;
  if (connectionString?.includes('b0o4000oo8g80cws8gsoogk4')) {
    connectionString = connectionString.replace('b0o4000oo8g80cws8gsoogk4', '10.0.1.8');
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const ROLE_ID_40K = '1332498533504520224';

  console.log('--- Users with 40,000 Points Role ---');
  const users = await prisma.user.findMany({
    where: {
      roles: {
        path: ['$'],
        array_contains: [{ id: ROLE_ID_40K }]
      }
    }
  });

  if (users.length === 0) {
    console.log('No one has the 40,000 points role yet.');
  } else {
    for (const u of users) {
      console.log(`- ${u.name || u.discordTag} (${u.discordId})`);
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
