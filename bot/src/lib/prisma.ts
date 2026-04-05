import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { singleton } from 'tsyringe';

const { Pool } = pg;

@singleton()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Removed auto-fallback for production internal networking since bot is on host.

    const pool = new Pool({
      connectionString,
      max: 10,
      min: 1,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    const adapter = new PrismaPg(pool);

    super({ adapter });
  }
}

// Function to create a compatible prisma instance
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return new PrismaClient();
  }

  // Removed auto-fallback for production internal networking since bot is on host.

  const pool = new Pool({
    connectionString,
    max: 10,
    min: 1,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Keep backward compatibility
export const prisma = createPrismaClient();
export default prisma;
