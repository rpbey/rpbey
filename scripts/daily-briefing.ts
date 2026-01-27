import 'dotenv/config';
import pg from 'pg';
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const { Client: PgClient } = pg;

// Channel ID for General Chat or Announcements
const TARGET_CHANNEL_ID = '1319715782820892768'; 

async function main() {
  const db = new PgClient({ connectionString: process.env.DATABASE_URL });
  const discord = new Client({ intents: [GatewayIntentBits.Guilds] });

  try {
    await db.connect();
    await discord.login(process.env.DISCORD_TOKEN);

    // 1. Fetch Stats
    const users = await db.query('SELECT COUNT(*) FROM users');
    const matches = await db.query('SELECT COUNT(*) FROM tournament_matches');
    const tournaments = await db.query(`
        SELECT name, date, "challongeUrl" 
        FROM tournaments 
        WHERE status IN ('UPCOMING', 'REGISTRATION_OPEN') 
        ORDER BY date ASC LIMIT 3
    `);

    const totalUsers = users.rows[0].count;
    const totalMatches = matches.rows[0].count;

    // 2. Build Message
    let message = `## 🐉 Le Rapport de l'Empereur\n\n`;
    message += `*Le soleil se lève sur la République, et mon regard embrasse tout.*\n\n`;
    
    message += `**📊 État des Forces :**\n`;
    message += `- **Bladers Enrôlés :** 
${totalUsers}
`;
    message += `- **Combats Enregistrés :** 
${totalMatches}
\n`;

    if (tournaments.rows.length > 0) {
        message += `**🏆 Prochains Champs de Bataille :**\n`;
        tournaments.rows.forEach(t => {
            const date = new Date(t.date).toLocaleDateString('fr-FR');
            message += `- **${t.name}** (${date}) [S'inscrire](${t.challongeUrl})\n`;
        });
        message += `\n`;
    } else {
        message += `*Aucun tournoi à l'horizon. Entraînez-vous dans l'ombre.*\n\n`;
    }

    message += `> *Ceux qui dorment seront écrasés par ceux qui forgent leur destin.* 🐉🔥`;

    // 3. Post to Discord
    const channel = await discord.channels.fetch(TARGET_CHANNEL_ID) as TextChannel;
    if (channel) {
        await channel.send(message);
        console.log('✅ Briefing quotidien posté avec succès.');
    } else {
        console.error('❌ Canal introuvable.');
    }

  } catch (err) {
    console.error('❌ Erreur lors du briefing :', err);
  } finally {
    await db.end();
    discord.destroy();
  }
}

main();