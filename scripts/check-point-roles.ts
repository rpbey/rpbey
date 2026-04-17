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

  const pointRoles = [
    { name: "40 000 Points Beyblade", id: "1332498533504520224" },
    { name: "30 000 Points Beyblade", id: "1332498472817131530" },
    { name: "20 000 Points Beyblade", id: "1332498407457161236" },
    { name: "15 000 Points Beyblade", id: "1332498580665143306" },
    { name: "10 000 Points Beyblade", id: "1332498339744321536" },
    { name: "1 000 Points Beyblade", id: "1332498240712736851" }
  ];

  console.log('--- Point Role Assignments ---');
  const users = await prisma.user.findMany();
  
  const roleStats: Record<string, string[]> = {};
  for (const r of pointRoles) roleStats[r.name] = [];

  for (const u of users) {
    const userRoles = u.roles as any[];
    if (!Array.isArray(userRoles)) continue;
    
    for (const r of pointRoles) {
      if (userRoles.some(ur => ur.id === r.id)) {
        roleStats[r.name].push(u.discordTag || u.name || u.id);
      }
    }
  }

  for (const [role, members] of Object.entries(roleStats)) {
    console.log(`- ${role}: ${members.length} members ${members.length > 0 ? '(' + members.join(', ') + ')' : ''}`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
