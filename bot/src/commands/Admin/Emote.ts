import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

@ApplyOptions<Command.Options>({
  description: 'Gérer les emotes du serveur',
  preconditions: ['GuildOnly'],
})
export class EmoteCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('emote-admin')
        .setDescription("Commandes d'administration des emotes")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
        .addSubcommand((command) =>
          command
            .setName('ajoute-aphrody')
            .setDescription("Ajouter l'emote animée Aphrody au serveur"),
        )
        .addSubcommand((command) =>
          command
            .setName('ajoute')
            .setDescription('Ajouter une emote via une URL')
            .addStringOption((option) =>
              option.setName('nom').setDescription("Nom de l'emote").setRequired(true),
            )
            .addStringOption((option) =>
              option.setName('url').setDescription("URL de l'image (PNG, JPG, GIF)").setRequired(true),
            ),
        ),
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'ajoute-aphrody') {
      return this.addAphrody(interaction);
    }

    if (subcommand === 'ajoute') {
      return this.addCustom(interaction);
    }
  }

  private async addAphrody(interaction: Command.ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      // Path to the GIF in the public directory of the monorepo
      // Assuming bot is running from /root/rpb-dashboard/bot
      const gifPath = join(process.cwd(), '..', 'public', 'aphrody.gif');

      if (!existsSync(gifPath)) {
        return interaction.editReply("❌ Le fichier `aphrody.gif` est introuvable sur le serveur.");
      }

      const guild = interaction.guild!;
      const emoji = await guild.emojis.create({
        attachment: gifPath,
        name: 'aphrody_master',
      });

      return interaction.editReply(`✅ Emote animée créée avec succès : ${emoji}`);
    } catch (error) {
      this.container.logger.error(error);
      return interaction.editReply("❌ Une erreur est survenue lors de la création de l'emote. Vérifiez que le bot a les permissions nécessaires et qu'il reste de la place pour les emotes animées.");
    }
  }

  private async addCustom(interaction: Command.ChatInputCommandInteraction) {
    await interaction.deferReply();

    const name = interaction.options.getString('nom', true);
    const url = interaction.options.getString('url', true);

    try {
      const guild = interaction.guild!;
      const emoji = await guild.emojis.create({
        attachment: url,
        name: name,
      });

      return interaction.editReply(`✅ Emote créée avec succès : ${emoji}`);
    } catch (error) {
      this.container.logger.error(error);
      return interaction.editReply("❌ Une erreur est survenue. Vérifiez l'URL et assurez-vous que le bot a les permissions `Gérer les emojis et les autocollants`.");
    }
  }
}