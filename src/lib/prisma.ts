import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Runtime fix for floating IP change in Coolify/Docker
let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.includes('10.0.1.8')) {
  console.log('Patching DATABASE_URL: 10.0.1.8 -> 10.0.1.4');
  connectionString = connectionString.replace('10.0.1.8', '10.0.1.4');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'], // Reduced logging for production
    adapter,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
