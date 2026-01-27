import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Setup Environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function listAdmins() {
  console.log('🔍 Listing Admins...');

  try {
    const admins = await prisma.staffMember.findMany({
        where: { 
            role: 'ADMIN', // Checking by Role Enum/String in DB
            isActive: true 
        }
    });

    console.log(`Found ${admins.length} active admins:`);
    admins.forEach(a => {
        console.log(`- ${a.name} (ID: ${a.id}, Discord: ${a.discordId}, DisplayIndex: ${a.displayIndex})`);
    });

    // Also check raw DB for any potential mismatch if role string differs
    const allStaff = await prisma.staffMember.findMany({ where: { isActive: true } });
    console.log(`
Total Active Staff: ${allStaff.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAdmins();
