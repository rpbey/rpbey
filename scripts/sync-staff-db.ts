
import { Client, GatewayIntentBits } from 'discord.js';
import { PrismaClient } from '@/generated/prisma/client';
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

// Role Mapping: Discord Role ID -> DB Role Enum/String
// Order matters: First match wins (Priority)
const DiscordRoleMapping: Record<string, string> = {
  '1319720685714804809': 'ADMIN',
  '1446871643753418793': 'RH',
  '1448458421702754474': 'MODO',
  '1331256093434712095': 'STAFF',
  '1460095694151876869': 'ARBITRE',
};

// Priority list to determine main role if user has multiple
const ROLE_PRIORITY = ['ADMIN', 'RH', 'MODO', 'ARBITRE', 'STAFF'];

const VALID_ROLE_IDS = Object.keys(DiscordRoleMapping);

async function syncStaff() {
  console.log('🔄 Starting Full Staff Sync...');

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

    // Assuming we use the first guild found, or specify ID if known
    // For RPB, likely the only guild.
    const guild = client.guilds.cache.first();
    if (!guild) {
        console.error('❌ No guild found');
        return;
    }
    
    console.log(`🎯 Targeting Guild: ${guild.name} (${guild.id})`);

    // Fetch ALL members
    console.log('📥 Fetching all members...');
    const members = await guild.members.fetch();
    console.log(`👥 Total Members: ${members.size}`);

    let addedCount = 0;
    let updatedCount = 0;
    let deactivatedCount = 0;
    const activeDiscordIds = new Set<string>();

    for (const [id, member] of members) {
        // Check if member has any staff role
        const memberRoleIds = member.roles.cache.map(r => r.id);
        const staffRoles = memberRoleIds.filter(rid => VALID_ROLE_IDS.includes(rid));

        if (staffRoles.length > 0) {
            // Determine primary role based on priority
            let primaryRole = 'STAFF';
            for (const roleType of ROLE_PRIORITY) {
                // Find the discord ID associated with this role type
                const roleId = Object.keys(DiscordRoleMapping).find(key => DiscordRoleMapping[key] === roleType);
                if (roleId && staffRoles.includes(roleId)) {
                    primaryRole = roleType;
                    break;
                }
            }

            const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
            const nickname = member.user.username; // Use username instead of displayName/nickname for consistency

            // Upsert into DB
            const existing = await prisma.staffMember.findFirst({
                where: { discordId: id }
            });

            if (existing) {
                if (existing.role !== primaryRole || existing.name !== nickname || existing.imageUrl !== avatarUrl || !existing.isActive) {
                    await prisma.staffMember.update({
                        where: { id: existing.id },
                        data: {
                            role: primaryRole,
                            name: nickname,
                            imageUrl: avatarUrl,
                            isActive: true, // Reactivate if was inactive
                            updatedAt: new Date()
                        }
                    });
                    updatedCount++;
                }
            } else {
                await prisma.staffMember.create({
                    data: {
                        name: nickname,
                        role: primaryRole,
                        discordId: id,
                        teamId: 'rpb-core', // Default team
                        imageUrl: avatarUrl,
                        isActive: true
                    }
                });
                addedCount++;
            }
            
            activeDiscordIds.add(id);
        }
    }

    // Deactivate staff not found in scan
    const dbStaff = await prisma.staffMember.findMany({ where: { isActive: true } });
    for (const staff of dbStaff) {
        if (staff.discordId && !activeDiscordIds.has(staff.discordId)) {
            console.log(`🔻 Deactivating ${staff.name} (Role lost or left server)`);
            await prisma.staffMember.update({
                where: { id: staff.id },
                data: { isActive: false }
            });
            deactivatedCount++;
        }
    }

    console.log('-----------------------------------');
    console.log(`✅ Sync Complete.`);
    console.log(`➕ Added: ${addedCount}`);
    console.log(`🔄 Updated: ${updatedCount}`);
    console.log(`❌ Deactivated: ${deactivatedCount}`);

  } catch (error) {
    console.error('❌ Critical Error:', error);
  } finally {
    await client.destroy();
    await prisma.$disconnect();
  }
}

syncStaff();
