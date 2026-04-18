/**
 * Send the full Mudae rules panel to the #mudae-règles channel.
 * Usage: pnpm tsx scripts/update-mudae-panel.ts
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  type TextChannel,
} from 'discord.js';

import { ROLE_PANELS } from '../bot/src/lib/role-panels.js';

const CHANNEL_ID = '1488045987112030298';
const PANEL_TITLE = '📜 Règles Mudae';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`Connecté en tant que ${client.user?.tag}`);

  try {
    const channel = (await client.channels.fetch(CHANNEL_ID)) as TextChannel;
    if (!channel) throw new Error(`Salon ${CHANNEL_ID} introuvable`);

    const panel = ROLE_PANELS.find((p) => p.title === PANEL_TITLE);
    if (!panel) throw new Error('Panel Mudae introuvable dans ROLE_PANELS');

    const embed = new EmbedBuilder()
      .setTitle(panel.title)
      .setDescription(panel.description)
      .setColor(panel.color);

    if (panel.image) embed.setImage(panel.image);

    const row = new ActionRowBuilder<ButtonBuilder>();
    for (const btn of panel.buttons) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(btn.customId)
          .setLabel(btn.label)
          .setEmoji(btn.emoji)
          .setStyle(btn.style),
      );
    }

    await channel.send({ embeds: [embed], components: [row] });
    console.log('✅ Panneau Mudae envoyé !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
