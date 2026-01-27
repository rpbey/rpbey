import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { PermissionFlagsBits } from 'discord.js';
import prisma from '../../lib/prisma.js';

@ApplyOptions<Subcommand.Options>({
  description: 'Gérer le système de classement RPB',
  preconditions: ['GuildOnly'],
  subcommands: [
    {
      name: 'reset',
      chatInputRun: 'chatInputReset',
    },
    {
      name: 'setup',
      chatInputRun: 'chatInputSetup',
    },
  ],
})
export class RankingCommand extends Subcommand {
  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('ranking')
        .setDescription("Commandes d'administration du classement")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((command) =>
          command
            .setName('reset')
            .setDescription(
              'RAZ complet des points de classement de tous les membres',
            ),
        )
        .addSubcommand((command) =>
          command
            .setName('setup')
            .setDescription('Configurer les points du système de classement')
            .addIntegerOption((option) =>
              option
                .setName('victoire_match')
                .setDescription('Points par victoire de match (ex: 200)')
                .setRequired(true),
            )
            .addIntegerOption((option) =>
              option
                .setName('participation')
                .setDescription('Points de participation (ex: 500)')
                .setRequired(true),
            )
            .addIntegerOption((option) =>
              option
                .setName('top8')
                .setDescription('Points pour Top 8 (ex: 500)')
                .setRequired(true),
            )
            .addIntegerOption((option) =>
              option
                .setName('troisieme')
                .setDescription('Points pour 3ème place (ex: 1000)')
                .setRequired(true),
            )
            .addIntegerOption((option) =>
              option
                .setName('deuxieme')
                .setDescription('Points pour 2ème place (ex: 1500)')
                .setRequired(true),
            )
            .addIntegerOption((option) =>
              option
                .setName('premier')
                .setDescription('Points pour 1ère place (ex: 2000)')
                .setRequired(true),
            ),
        ),
    );
  }

  public async chatInputReset(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Reset all profiles
      const result = await prisma.profile.updateMany({
        data: {
          rankingPoints: 0,
        },
      });

      return interaction.editReply(
        `✅ Classement réinitialisé avec succès.\nPoints remis à 0 pour ${result.count} profils.`,
      );
    } catch (error) {
      this.container.logger.error(error);
      return interaction.editReply(
        '❌ Une erreur est survenue lors de la réinitialisation.',
      );
    }
  }

  public async chatInputSetup(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });

    const matchWin = interaction.options.getInteger('victoire_match', true);
    const participation = interaction.options.getInteger('participation', true);
    const top8 = interaction.options.getInteger('top8', true);
    const thirdPlace = interaction.options.getInteger('troisieme', true);
    const secondPlace = interaction.options.getInteger('deuxieme', true);
    const firstPlace = interaction.options.getInteger('premier', true);

    try {
      // Find existing config or create new one
      const existingConfig = await prisma.rankingSystem.findFirst();

      if (existingConfig) {
        await prisma.rankingSystem.update({
          where: { id: existingConfig.id },
          data: {
            matchWin,
            participation,
            top8,
            thirdPlace,
            secondPlace,
            firstPlace,
          },
        });
      } else {
        await prisma.rankingSystem.create({
          data: {
            matchWin,
            participation,
            top8,
            thirdPlace,
            secondPlace,
            firstPlace,
          },
        });
      }

      return interaction.editReply(
        `✅ **Configuration du Classement mise à jour !**\n\n` +
          `🔹 Victoire Match : ${matchWin}\n` +
          `🔹 Participation : ${participation}\n` +
          `🔹 Top 8 : ${top8}\n` +
          `🥉 3ème Place : ${thirdPlace}\n` +
          `🥈 2ème Place : ${secondPlace}\n` +
          `🥇 1ère Place : ${firstPlace}`,
      );
    } catch (error) {
      this.container.logger.error(error);
      return interaction.editReply(
        '❌ Une erreur est survenue lors de la configuration.',
      );
    }
  }
}
