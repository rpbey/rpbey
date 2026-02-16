import type { CommandInteraction } from 'discord.js';
import { useQueue } from 'discord-player';
import { Discord, Slash } from 'discordx';

@Discord()
export class StopCommand {
  @Slash({
    name: 'arreter',
    description: "Arrête la musique et vide la file d'attente",
  })
  async stop(interaction: CommandInteraction) {
    if (!interaction.guildId) return;
    const queue = useQueue(interaction.guildId);

    if (!queue) {
      return interaction.reply({
        content: '❌ Aucune musique en cours.',
        ephemeral: true,
      });
    }

    queue.delete();

    return interaction.reply("⏹️ **Musique arrêtée et file d'attente vidée.**");
  }
}
