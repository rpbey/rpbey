import { Command } from '@sapphire/framework';

export class CustomCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'profil-beyblade',
      description: 'Voir le profil Beyblade d',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const response = `[Complex Command]`;

    // Check if response is JSON (simple check)
    if (response.trim().startsWith('{')) {
      try {
        const json = JSON.parse(response);
        return interaction.reply(json);
      } catch {
        // Fallback to text
      }
    }
    return interaction.reply({ content: response });
  }
}
