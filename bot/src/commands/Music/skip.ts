import type { CommandInteraction } from 'discord.js';
import { useQueue } from 'discord-player';
import { Discord, Slash } from 'discordx';

@Discord()
export class SkipCommand {
  @Slash({ name: 'passer', description: 'Passe à la musique suivante' })
  async skip(interaction: CommandInteraction) {
    if (!interaction.guildId) return;
    const queue = useQueue(interaction.guildId);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: '❌ Aucune musique en cours.',
        ephemeral: true,
      });
    }

    queue.node.skip();

    return interaction.reply('⏭️ **Musique passée.**');
  }
}
