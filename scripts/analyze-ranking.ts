import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

async function main() {
  let connectionString = process.env.DATABASE_URL;
  
  // Force correct IP if hostname is wrong
  if (connectionString?.includes('b0o4000oo8g80cws8gsoogk4')) {
    connectionString = connectionString.replace('b0o4000oo8g80cws8gsoogk4', '10.0.1.8');
  }

  console.log('Connecting to:', connectionString?.split('@')[1]);

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('--- Top Bladers by Points ---');
  const profiles = await prisma.profile.findMany({
    take: 30,
    orderBy: { rankingPoints: 'desc' },
    include: {
      user: true
    }
  });

  for (const p of profiles) {
    const roles = p.user.roles as any[];
    const roleNames = Array.isArray(roles) ? roles.map(r => r.name).join(', ') : 'None';
    console.log(`- ${p.bladerName || p.user.name || 'Unknown'}: ${p.rankingPoints} pts | Roles: ${roleNames}`);
  }

  console.log('\n--- Analyzing Roles with "Points" or "Niveau" in Name ---');
  const roles = await prisma.discordRole.findMany({
    orderBy: { position: 'desc' }
  });
  
  const pointRoles = roles.filter(r => 
    r.name.toLowerCase().includes('point') || 
    r.name.toLowerCase().includes('niveau') ||
    r.name.match(/\d{2,}/) // At least 2 digits
  );
  
  for (const r of pointRoles) {
    console.log(`- Role: ${r.name} (ID: ${r.id})`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
