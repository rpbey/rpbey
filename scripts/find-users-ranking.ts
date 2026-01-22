
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env relative to this script location (scripts/)
dotenv.config({ path: path.join(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function findUsers() {
  console.log('Searching for users...');
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'yoyo', mode: 'insensitive' } },
        { username: { contains: 'yoyo', mode: 'insensitive' } },
        { name: { contains: 'loteux', mode: 'insensitive' } },
        { username: { contains: 'loteux', mode: 'insensitive' } }
      ]
    },
    select: { id: true, name: true, username: true }
  });
  console.log('Found users:', users);
}

findUsers().catch(console.error).finally(() => prisma.$disconnect());
