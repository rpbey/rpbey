import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { useQueue } from 'discord-player';

@ApplyOptions<Command.Options>({
  description: 'Ajuste le volume de la musique',
  preconditions: ['GuildOnly'],
})
export class VolumeCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('volume')
        .setDescription(this.description)
        .addIntegerOption((option) =>
          option
            .setName('niveau')
            .setDescription('Volume entre 0 et 100')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(100),
        ),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    // biome-ignore lint/style/noNonNullAssertion: Guarded by GuildOnly
    const queue = useQueue(interaction.guildId!);
    const volume = interaction.options.getInteger('niveau', true);

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
