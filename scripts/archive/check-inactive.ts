import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function listInactive() {
  const inactive = await prisma.staffMember.findMany({
    where: { isActive: false }
  });
  console.log('Inactive Staff:', inactive);
  
  // Also list all staff to find potential admins with wrong roles
  const all = await prisma.staffMember.findMany({});
  const admins = all.filter(s => s.role === 'ADMIN' || s.name.toLowerCase().includes('admin'));
  console.log('\nPotential Admins found in DB:', admins.map(a => `${a.name} (${a.role}) - Active: ${a.isActive}`));
}

listInactive();
