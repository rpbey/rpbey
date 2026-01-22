import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const guildId = process.argv[2];

if (!guildId) {
  console.error('❌ Erreur: Aucun ID de serveur fourni.');
  console.error('Usage: tsx scripts/check-server.ts <GUILD_ID>');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  tasks: {} as any,
});

async function checkServer() {
  try {
    console.log('🔌 Connexion à Discord...');
    await client.login(process.env.DISCORD_TOKEN);
    
    console.log(`🔍 Tentative de récupération des infos publiques pour le serveur: ${guildId}`);
    
    let infoFound = false;

    const targetUserId = process.argv[3];

    // 1. Try Widget (requires widget to be enabled in server settings)
    try {
        console.log('   -> Test du Widget public...');
        const widget = await client.fetchGuildWidget(guildId);
        console.log('\n✅ WIDGET PUBLIC TROUVÉ !');
        console.log(`🏷️  Nom:           ${widget.name}`);
        console.log(`👥 Présence:      ${widget.presenceCount} en ligne`);
        console.log(`🔗 Invitation:    ${widget.instantInvite || 'Aucune'}`);
        
        if (widget.members.size > 0) {
            if (targetUserId) {
                console.log(`\n🔍 Recherche du membre ${targetUserId} dans le widget...`);
                const foundMember = widget.members.get(targetUserId);
                if (foundMember) {
                    console.log(`🚨 MEMBRE TROUVÉ !`);
                    console.log(`   - Pseudo: ${foundMember.username}`);
                    console.log(`   - Statut: ${foundMember.status}`);
                    console.log(`   - Avatar: ${foundMember.avatarURL || 'Aucun'}`);
                } else {
                    console.log(`❌ Membre non trouvé dans la liste des connectés (peut être hors ligne ou invisible).`);
                }
            } else {
                console.log(`\n📋 Membres connectés visibles (${widget.members.size}):`);
                widget.members.forEach(m => {
                    console.log(`   - ${m.username} (${m.status}) ${m.bot ? '[BOT]' : ''} ${m.avatarURL ? '[Avatar]' : ''}`);
                });
            }
        }
        infoFound = true;
    } catch {
        console.log('   ❌ Widget désactivé ou inaccessible.');
    }

    // 2. Try Guild Preview (only for Discoverable/Public guilds)
    try {
        console.log('   -> Test de la Prévisualisation (Serveurs Publics)...');
        const preview = await client.fetchGuildPreview(guildId);
        console.log('\n✅ PRÉVISUALISATION PUBLIQUE TROUVÉE !');
        console.log(`🏷️  Nom:           ${preview.name}`);
        console.log(`📝 Description:   ${preview.description || 'Aucune'}`);
        console.log(`👥 Membres:       ~${preview.approximateMemberCount}`);
        console.log(`🟢 En ligne:      ~${preview.approximatePresenceCount}`);
        console.log(`🖼️  Icone:         ${preview.iconURL({ size: 1024 })}`);
        if (preview.splash) {
            console.log(`🎨 Splash:        ${preview.splashURL({ size: 1024 })}`);
        }
        console.log(`🎭 Emojis:        ${preview.emojis.size}`);
        console.log(`✨ Fonctionnalités: ${preview.features.join(', ')}`);
        infoFound = true;
    } catch {
        console.log('   ❌ Serveur non "Découvrable" (Privé).');
    }

    if (!infoFound) {
        console.log('\n🔒 RÉSULTAT: Ce serveur est PRIVE et SÉCURISÉ.');
        console.log('   - Le Widget est désactivé.');
        console.log('   - Il n\'est pas dans la liste Découverte.');
        console.log('   -> Aucune information ne peut être extraite sans une invitation valide.');
    }

    client.destroy();
  } catch (error: unknown) {
    console.error('❌ Erreur critique:', (error as Error).message);
    client.destroy();
    process.exit(1);
  }
}

checkServer();
