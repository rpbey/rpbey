import {
  type CommandInteraction,
  EmbedBuilder,
  TimestampStyles,
  time,
} from 'discord.js';
import { Discord, Slash } from 'discordx';

import { Colors, RPB } from '../../lib/constants.js';

@Discord()
export class PingCommand {
  @Slash({
    description: 'Vérifie la latence du bot et le temps de réponse',
    name: 'ping',
  })
  async ping(interaction: CommandInteraction) {
    const sent = await interaction.reply({
      content: '🏓 Ping en cours...',
      withResponse: true,
    });

    const roundtrip =
      (sent.resource?.message?.createdTimestamp ?? Date.now()) -
      interaction.createdTimestamp;

    const wsLatency = Math.round(interaction.client.ws.ping);

    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setColor(
        wsLatency < 100
          ? Colors.Success
          : wsLatency < 200
            ? Colors.Warning
            : Colors.Error,
      )
      .addFields(
        { name: '⏱️ Aller-retour', value: `${roundtrip}ms`, inline: true },
        { name: '💓 WebSocket', value: `${wsLatency}ms`, inline: true },
        {
          name: '🕐 En ligne depuis',
          value: time(
            new Date(Date.now() - (interaction.client.uptime ?? 0)),
            TimestampStyles.RelativeTime,
          ),
          inline: true,
        },
      )
      .setFooter({ text: RPB.FullName })
      .setTimestamp();

    return interaction.editReply({ content: null, embeds: [embed] });
  }
}
