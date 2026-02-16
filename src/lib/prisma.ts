import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;

// Correct host for production Docker internal network
const finalConnectionString =
  process.env.NODE_ENV === 'production' &&
  (connectionString?.includes('localhost') ||
    connectionString?.includes('127.0.0.1'))
    ? connectionString.replace(/localhost|127\.0\.0\.1/, 'db')
    : connectionString;

const pool = new pg.Pool({ connectionString: finalConnectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
    adapter,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
