import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const t = await prisma.tournament.findUnique({
      where: { id: 'cm-fr_b_ts2-auto' }, 
      include: { matches: true, participants: true }
  });
  console.log('BTS2 DB Matches:', t?.matches.length, 'Participants:', t?.participants.length);
}
check().finally(() => { prisma.$disconnect(); pool.end(); });
