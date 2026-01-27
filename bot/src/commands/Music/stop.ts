import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { useQueue } from 'discord-player';

@ApplyOptions<Command.Options>({
  description: "Arrête la musique et vide la file d'attente",
  preconditions: ['GuildOnly'],
})
export class StopCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('stop').setDescription(this.description),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const queue = useQueue(interaction.guildId!);

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
