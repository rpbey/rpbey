import * as fs from 'node:fs';
import * as path from 'node:path';
import { Command } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';

export class TeachCommand extends Command {
  constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: "Ajoute une information à la base de connaissances de l'IA",
      preconditions: ['ModeratorOnly'],
    });
  }

  override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('enseigner')
        .setDescription("Enseigne un nouveau fait à l'IA")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption((opt) =>
          opt
            .setName('info')
            .setDescription(
              "L'information à ajouter (phrase claire et complète)",
            )
            .setRequired(true),
        ),
    );
  }

  override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const info = interaction.options.getString('info', true);
    const filePath = path.resolve(process.cwd(), 'data', 'knowledge_base.txt');

    try {
      // Ensure the line ends with a newline
      const formattedInfo = info.endsWith('.') ? info : `${info}.`;
      fs.appendFileSync(filePath, `\n${formattedInfo}`);

      return interaction.reply({
        content: `✅ J'ai appris une nouvelle chose : *"${formattedInfo}"*\nElle sera utilisée pour répondre aux prochaines questions !`,
        ephemeral: true,
      });
    } catch (error) {
      this.container.logger.error('[AI] Teach command error:', error);
      return interaction.reply({
        content: '❌ Impossible de mettre à jour la base de connaissances.',
        ephemeral: true,
      });
    }
  }
}
