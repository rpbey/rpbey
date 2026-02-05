
import { Client, GatewayIntentBits } from 'discord.js';
import { prisma } from '../src/lib/prisma';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function syncAllUserPhotos() {
  console.log('🔄 Starting Global User Photo Sync...');

  if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN is missing');
    process.exit(1);
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  });

  try {
    await client.login(process.env.DISCORD_TOKEN);
    const guild = client.guilds.cache.first();
    
    if (!guild) {
        console.error('❌ No guild found');
        return;
    }

    console.log(`🎯 Targeting Guild: ${guild.name}`);

    // Fetch ALL users from DB that have a discordId
    const dbUsers = await prisma.user.findMany({
        where: { discordId: { not: null } },
        select: { id: true, discordId: true, image: true, name: true }
    });

    console.log(`👥 Found ${dbUsers.length} users with Discord ID in database.`);

    // Fetch all members from Discord to avoid individual API calls
    console.log('📥 Fetching all guild members from Discord...');
    const members = await guild.members.fetch();
    console.log(`📡 Discord returned ${members.size} members.`);

    let updatedCount = 0;
    let notInServerCount = 0;

    for (const dbUser of dbUsers) {
        const member = members.get(dbUser.discordId!);
        
        if (member) {
            const currentAvatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
            
            // Only update if the image has changed
            if (dbUser.image !== currentAvatarUrl) {
                console.log(`🔄 Updating avatar for ${dbUser.name || dbUser.discordId}`);
                await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { image: currentAvatarUrl }
                });
                updatedCount++;
            }
        } else {
            notInServerCount++;
        }
    }

    console.log('-----------------------------------');
    console.log(`✅ Photo Sync Complete.`);
    console.log(`🔄 Updated: ${updatedCount}`);
    console.log(`❓ Not in server: ${notInServerCount}`);

  } catch (error) {
    console.error('❌ Error during sync:', error);
  } finally {
    await client.destroy();
    await prisma.$disconnect();
    process.exit(0);
  }
}

syncAllUserPhotos();
