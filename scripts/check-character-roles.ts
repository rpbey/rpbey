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

  const characterRoles = [
    { name: "L'Empereur Dragon", id: "1332454358914306088" },
    { name: "Le Garçon aux Ailes de Pégase", id: "1332454015878824079" },
    { name: "Le Soleil", id: "1428418147987230830" },
    { name: "Le King", id: "1332454574493274173" },
    { name: "Le Gardien du Temple", id: "1332454124234608711" },
    { name: "L’héritier des 4000 ans", id: "1424482196483346522" },
    { name: "Le Roi des Animaux", id: "1332454453143535617" },
    { name: "Le Fils du Soleil Noir", id: "1332455331497771100" },
    { name: "L'astronome de Mercure", id: "1332454238042984483" },
    { name: "Le Gardien des Enfers", id: "1332454639383216180" },
    { name: "L'Aigle Schizophrène", id: "1332456622173327452" },
    { name: "L’Oiseau Immortel", id: "1421088721754787922" },
    { name: "Le petit prodige", id: "1332456943419392031" }
  ];

  console.log('--- Character Role Assignments ---');
  const users = await prisma.user.findMany();
  
  const roleStats: Record<string, string[]> = {};
  for (const r of characterRoles) roleStats[r.name] = [];

  for (const u of users) {
    const userRoles = u.roles as any[];
    if (!Array.isArray(userRoles)) continue;
    
    for (const r of characterRoles) {
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
