import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { singleton } from 'tsyringe';

const { Pool } = pg;

@singleton()
export class PrismaService extends PrismaClient {
  constructor() {
    let connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Auto-fallback for production internal networking
    if (
      process.env.NODE_ENV === 'production' &&
      (connectionString.includes('localhost') ||
        connectionString.includes('127.0.0.1'))
    ) {
      connectionString = connectionString.replace(
        /localhost|127\.0\.0\.1/,
        'rb-db',
      );
      console.log('[Prisma] Production fallback: using rb-db host');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({ adapter });
  }
}

// Function to create a compatible prisma instance
function createPrismaClient() {
  let connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return new PrismaClient();
  }

  // Auto-fallback for production internal networking
  if (
    process.env.NODE_ENV === 'production' &&
    (connectionString.includes('localhost') ||
      connectionString.includes('127.0.0.1'))
  ) {
    connectionString = connectionString.replace(
      /localhost|127\.0\.0\.1/,
      'rb-db',
    );
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Keep backward compatibility
export const prisma = createPrismaClient();
export default prisma;
