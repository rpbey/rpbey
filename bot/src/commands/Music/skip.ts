import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { useQueue } from 'discord-player';

@ApplyOptions<Command.Options>({
  description: 'Passe à la musique suivante',
  preconditions: ['GuildOnly'],
})
export class SkipCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('passer').setDescription(this.description),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    // biome-ignore lint/style/noNonNullAssertion: Guarded by GuildOnly
    const queue = useQueue(interaction.guildId!);

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
