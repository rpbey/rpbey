import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load env from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const userId = process.argv[2];

if (!userId) {
  console.error('❌ Erreur: Aucun ID fourni.');
  console.error('Usage: tsx scripts/check-user.ts <USER_ID>');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds], // Minimal intents to fetch user
});

async function checkUser() {
  try {
    console.log('🔌 Connexion à Discord...');
    if (!process.env.DISCORD_TOKEN) {
        throw new Error("DISCORD_TOKEN manquant dans .env");
    }
    
    await client.login(process.env.DISCORD_TOKEN);
    
    console.log(`🔍 Recherche de l'utilisateur ${userId}...`);
    const user = await client.users.fetch(userId, { force: true });
    
    console.log('\n--- 🚨 RAPPORT DE RENSEIGNEMENT UTILISATEUR 🚨 ---');
    console.log(`🆔 ID:            ${user.id}`);
    console.log(`🏷️  Tag:           ${user.tag}`);
    console.log(`👤 Nom Global:    ${user.globalName || 'Aucun'}`);
    console.log(`🤖 Robot:         ${user.bot ? 'OUI' : 'Non'}`);
    console.log(`⚙️  Système:       ${user.system ? 'OUI' : 'Non'}`);
    
    const createdAt = user.createdAt;
    const now = new Date();
    const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`📅 Création:      ${createdAt.toLocaleString('fr-FR')}`);
    console.log(`⏳ Ancienneté:    ${ageInDays} jours`);
    
    if (ageInDays < 7) {
        console.log(`⚠️  ALERTE: COMPTE RÉCENT (< 7 jours)`);
    }
    if (ageInDays < 30) {
        console.log(`⚠️  ALERTE: COMPTE JEUNE (< 30 jours)`);
    }

    if (user.flags) {
        const flags = user.flags.toArray();
        console.log(`🚩 Flags:         ${flags.length > 0 ? flags.join(', ') : 'Aucun'}`);
    }
    
    console.log(`🖼️  Avatar:        ${user.displayAvatarURL({ size: 1024 })}`);
    const decoration = user.avatarDecorationURL();
    if (decoration) {
        console.log(`🎭 Décoration:    ${decoration}`);
    }
    
    if (user.banner) {
        console.log(`🎨 Bannière:      ${user.bannerURL({ size: 1024 })}`);
    }
    if (user.hexAccentColor) {
        console.log(`🎨 Couleur:       ${user.hexAccentColor}`);
    }

    console.log('---------------------------------------------------\n');

    client.destroy();
  } catch (error: unknown) {
    const err = error as Error & { code?: number };
    console.error('❌ Erreur:', err.message);
    if (err.code === 10013) {
        console.error('   -> Utilisateur introuvable (ID invalide ou inconnu)');
    }
    client.destroy();
    process.exit(1);
  }
}

checkUser();
