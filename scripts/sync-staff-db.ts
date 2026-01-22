
import { Client, GatewayIntentBits } from 'discord.js';
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

// Role Mapping from src/lib/role-colors.ts
const DiscordRoleMapping: Record<string, string> = {
  '1319720685714804809': 'ADMIN',
  '1446871643753418793': 'RH',
  '1448458421702754474': 'MODO',
  '1331256093434712095': 'STAFF',
  '1460095694151876869': 'ARBITRE',
};

const VALID_ROLE_IDS = Object.keys(DiscordRoleMapping);

async function syncStaff() {
  console.log('🔄 Starting Staff Sync...');

  if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN is missing');
    process.exit(1);
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  });

  try {
    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Connected to Discord');

    // Get the guild (Server)
    // We'll iterate over all guilds the bot is in, but typically it's just RPB
    // Or we can try to find the guild that contains these roles.
    const guilds = await client.guilds.fetch();
    console.log(`Found ${guilds.size} guilds.`);

    // Assuming the main guild is the one we want. 
    // We can loop or find one by ID if we had it. 
    // Let's iterate all cached guilds to be safe, or just pick the first one.
    // Better: Find the guild that actually has these roles.
    
    let targetGuild = null;
    
    // Check first guild (usually correct in single-server bots)
    for (const [id, g] of client.guilds.cache) {
        targetGuild = g; 
        break; // Just take the first one for now
    }

    if (!targetGuild) {
        console.error('❌ No guilds found');
        return;
    }
    
    console.log(`🎯 Targeting Guild: ${targetGuild.name} (${targetGuild.id})`);

    // Fetch all DB Staff
    const dbStaff = await prisma.staffMember.findMany({
        where: { isActive: true }
    });
    console.log(`📚 Found ${dbStaff.length} active staff in DB`);

    let removedCount = 0;
    let keptCount = 0;

    for (const staff of dbStaff) {
        if (!staff.discordId) {
            console.warn(`⚠️ Staff ${staff.name} has no Discord ID. Skipping.`);
            continue;
        }

        try {
            // Fetch member from Discord
            const member = await targetGuild.members.fetch(staff.discordId).catch(() => null);

            if (!member) {
                console.log(`❌ User ${staff.name} (${staff.discordId}) not found in guild. Removing...`);
                await prisma.staffMember.update({
                    where: { id: staff.id },
                    data: { isActive: false }
                });
                removedCount++;
                continue;
            }

            // Check roles
            const hasStaffRole = member.roles.cache.some(r => VALID_ROLE_IDS.includes(r.id));

            if (!hasStaffRole) {
                console.log(`🔻 User ${staff.name} (${staff.discordId}) has no staff roles. Removing...`);
                await prisma.staffMember.update({
                    where: { id: staff.id },
                    data: { isActive: false }
                });
                removedCount++;
            } else {
                // Optional: Update role type if changed?
                // For now, just keep them active.
                // console.log(`✅ User ${staff.name} is verified.`);
                keptCount++;
            }

        } catch (err) {
            console.error(`❌ Error checking ${staff.name}:`, err);
        }
    }

    console.log('-----------------------------------');
    console.log(`✅ Sync Complete.`);
    console.log(`❌ Removed (set inactive): ${removedCount}`);
    console.log(`✅ Kept: ${keptCount}`);

  } catch (error) {
    console.error('❌ Critical Error:', error);
  } finally {
    await client.destroy();
    await prisma.$disconnect();
  }
}

syncStaff();
