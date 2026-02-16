import {
  ApplicationCommandOptionType,
  type CommandInteraction,
} from 'discord.js';
import { useQueue } from 'discord-player';
import { Discord, Slash, SlashOption } from 'discordx';

@Discord()
export class VolumeCommand {
  @Slash({ name: 'volume', description: 'Ajuste le volume de la musique' })
  async volume(
    @SlashOption({
      name: 'niveau',
      description: 'Volume entre 0 et 100',
      required: true,
      type: ApplicationCommandOptionType.Integer,
      minValue: 0,
      maxValue: 100,
    })
    volume: number,
    interaction: CommandInteraction,
  ) {
    if (!interaction.guildId) return;
    const queue = useQueue(interaction.guildId);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: '❌ Aucune musique en cours.',
        ephemeral: true,
      });
    }

    queue.node.setVolume(volume);

    return interaction.reply(`🔊 **Volume réglé à ${volume}%**`);
  }
}
