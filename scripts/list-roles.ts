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

  console.log('--- All Discord Roles ---');
  const roles = await prisma.discordRole.findMany({
    orderBy: { position: 'desc' }
  });

  for (const r of roles) {
    console.log(`- ${r.name} (ID: ${r.id}) [Pos: ${r.position}]`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
