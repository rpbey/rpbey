
import 'dotenv/config';
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';

const TARGET_CHANNEL_ID = '1455336947903103027';

const THREAD_TWEETS = [
  `🚨 OFFICIEL 🚨
La RPB passe encore un cap avec le début de la collaboration LFBX !

La République Populaire du Beyblade vous propose un nouveau type de compétition avec 4 tournois qualificatifs.
Objectif : Devenir l'un des 5 élus de la capitale. 🏛️

#BeybladeX #RPB #LFBX`,

  `🏆 LE BEY-TAMASHII SERIES #2 🏆
Nous avons l'honneur d'annoncer le 1er tournoi qualificatif !

📅 Dimanche 8 février 2026
🕑 Inscriptions : 13h00 - 14h00
📍 Dernier Bar Avant la Fin du Monde, Paris 75001

#BeyTamashiiSeries`,

  `🛠️ Format : 3on3 classique (Double élimination)
🔗 Inscription (64 places) : https://challonge.com/fr/B_TS2

Venez écrire l'histoire ! 3, 2, 1... Hyper Vitesse ! ⚔️`,

  `Retrouvez tous nos réseaux:
- Discord : https://discord.gg/rpb
- TikTok : https://www.tiktok.com/@rpbeyblade1
- Insta : https://www.instagram.com/rp_bey/

Restez branché la suite arrive très soon.........👀`
];

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  try {
    console.log('🔌 Connecting to Discord...');
    await client.login(process.env.DISCORD_TOKEN);
    
    const channel = await client.channels.fetch(TARGET_CHANNEL_ID) as TextChannel;
    if (!channel) {
        throw new Error(`Channel ${TARGET_CHANNEL_ID} not found`);
    }

    console.log(`✅ Connected. Sending validation thread to #${channel.name}...`);

    await channel.send(`**🐉 Demande de Validation : Thread Twitter (Programmé pour demain 18h)**`);

    for (const [i, tweet] of THREAD_TWEETS.entries()) {
        await channel.send(`**[Tweet ${i + 1}/4]**\n${tweet}`);
        // Small delay to keep order
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('✅ Sent successfully.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.destroy();
  }
}

main();
