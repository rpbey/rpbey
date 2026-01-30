import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

@ApplyOptions<Command.Options>({
  description: 'Affiche la musique en cours de lecture',
  preconditions: ['GuildOnly'],
})
export class NowPlayingCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('en-cours').setDescription(this.description),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    // biome-ignore lint/style/noNonNullAssertion: Guarded by GuildOnly
    const queue = useQueue(interaction.guildId!);

    if (!queue || !queue.currentTrack) {
      return interaction.reply({
        content: '❌ Aucune musique en cours.',
        ephemeral: true,
      });
    }

    const track = queue.currentTrack;
    const timestamp = queue.node.getTimestamp();

    const embed = new EmbedBuilder()
      .setTitle('📻 Lecture en cours')
      .setDescription(`**[${track.title}](${track.url})**`)
      .setThumbnail(track.thumbnail)
      .addFields(
        { name: 'Auteur', value: track.author, inline: true },
        { name: 'Durée', value: track.duration, inline: true },
        {
          name: 'Progression',
          value: timestamp ? `${timestamp.progress}%` : 'N/A',
          inline: true,
        },
      )
      .setColor(0x00ff00);

    return interaction.reply({ embeds: [embed] });
  }
}
