import { prisma } from '../src/lib/prisma';
async function massiveSync() {
  const BOT_API = process.env.BOT_API_URL || 'http://127.0.0.1:3001';
  const API_KEY = process.env.BOT_API_KEY;
  const BLADER_ROLE_ID = '1323819786181804112';

  console.log('📡 Récupération des membres Discord (Rôle Blader)...');
  
  try {
    const response = await fetch(`${BOT_API}/api/members-by-role?roleId=${BLADER_ROLE_ID}`, {
      headers: { 'x-api-key': API_KEY || '' }
    });

    if (!response.ok) {
      throw new Error(`Erreur API Bot: ${response.statusText}`);
    }

    const { members } = await response.json();
    console.log(`✅ ${members.length} membres récupérés.`);

    let updatedCount = 0;
    let createdCount = 0;

    for (const member of members) {
      // 1. Chercher par discordId
      let user = await prisma.user.findUnique({
        where: { discordId: member.id },
        include: { profile: true }
      });

      if (user) {
        // Mise à jour
        await prisma.user.update({
          where: { id: user.id },
          data: {
            name: member.username || user.name,
            discordTag: member.username,
            image: member.avatar || user.image,
            globalName: member.globalName || user.globalName,
            nickname: member.nickname || user.nickname,
            serverAvatar: member.serverAvatar || user.serverAvatar,
            joinedAt: member.joinedAt ? new Date(member.joinedAt) : user.joinedAt,
            roles: member.roles
          }
        });
        updatedCount++;
      } else {
        // Création (Si on veut importer tout le monde)
        await prisma.user.create({
          data: {
            discordId: member.id,
            name: member.username,
            username: member.username,
            email: `${member.username}@discord.rpb`, // Placeholder email
            discordTag: member.username,
            image: member.avatar,
            globalName: member.globalName,
            nickname: member.nickname,
            serverAvatar: member.serverAvatar,
            joinedAt: member.joinedAt ? new Date(member.joinedAt) : null,
            roles: member.roles,
            profile: {
              create: {
                bladerName: member.username,
                rankingPoints: 0
              }
            }
          }
        });
        createdCount++;
      }

      if ((updatedCount + createdCount) % 50 === 0) {
        console.log(`⏳ Progression : ${updatedCount + createdCount} / ${members.length}...`);
      }
    }

    console.log(`
📊 Bilan de la synchronisation massive :
   - Utilisateurs mis à jour : ${updatedCount}
   - Nouveaux utilisateurs créés : ${createdCount}
   - Total Discord (Bladers) : ${members.length}
    `);

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation :', error);
  }
}

massiveSync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
