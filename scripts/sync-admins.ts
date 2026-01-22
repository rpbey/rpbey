
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

const ADMIN_ROLE_ID = '1319720685714804809';

async function syncAdmins() {
  console.log('👑 Syncing Admins...');

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

    // Get the first guild
    const guild = client.guilds.cache.first();
    if (!guild) {
        console.error('❌ No guilds found');
        return;
    }
    console.log(`🎯 Guild: ${guild.name}`);

    // Fetch the specific role to get its members
    const role = await guild.roles.fetch(ADMIN_ROLE_ID);
    if (!role) {
        console.error(`❌ Admin Role (${ADMIN_ROLE_ID}) not found in this guild.`);
        return;
    }

    console.log(`👥 Found Admin Role: ${role.name} with ${role.members.size} cached members.`);
    
    // Force fetch all members of the guild to ensure role members are up to date
    await guild.members.fetch();
    
    // Re-check role members after fetch
    const adminMembers = role.members;
    console.log(`👥 Actual Admin Members: ${adminMembers.size}`);

    for (const [id, member] of adminMembers) {
        console.log(`   - Found Admin: ${member.user.username} (${member.displayName})`);

        // Check if exists
        const existing = await prisma.staffMember.findFirst({
            where: { discordId: id }
        });

        if (existing) {
            await prisma.staffMember.update({
                where: { id: existing.id },
                data: {
                    name: member.user.username,
                    role: 'ADMIN',
                    teamId: 'admin',
                    isActive: true,
                    imageUrl: member.displayAvatarURL({ extension: 'png' }),
                    nickname: member.nickname,
                    globalName: member.user.globalName,
                }
            });
            console.log(`     ✅ Updated existing admin`);
        } else {
            await prisma.staffMember.create({
                data: {
                    name: member.user.username,
                    role: 'ADMIN',
                    teamId: 'admin',
                    isActive: true,
                    discordId: id,
                    imageUrl: member.displayAvatarURL({ extension: 'png' }),
                    displayIndex: 0,
                    nickname: member.nickname,
                    globalName: member.user.globalName,
                }
            });
            console.log(`     ✅ Created new admin`);
        }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.destroy();
    await prisma.$disconnect();
  }
}

syncAdmins();
