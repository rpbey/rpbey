
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function findProfiles() {
  console.log('Searching Profiles...');
  const profiles = await prisma.profile.findMany({
    where: {
      bladerName: { contains: 'loteux', mode: 'insensitive' }
    },
    include: { user: true }
  });
  console.log('Found profiles:', profiles.map(p => ({ 
      id: p.id, 
      bladerName: p.bladerName, 
      userName: p.user.name,
      username: p.user.username 
  })));
}

findProfiles().catch(console.error).finally(() => prisma.$disconnect());
