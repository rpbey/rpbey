import { Subcommand } from '@sapphire/plugin-subcommands';
import { EmbedBuilder } from 'discord.js';
import { Colors, RPB } from '../../lib/constants.js';
import prisma from '../../lib/prisma.js';

export class ChallongeCommand extends Subcommand {
  public constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
    super(context, {
      ...options,
      description: 'Gérer la liaison avec Challonge',
      subcommands: [
        {
          name: 'lier',
          chatInputRun: 'chatInputLink',
        },
        {
          name: 'info',
          chatInputRun: 'chatInputInfo',
        }
      ],
    });
  }

  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('challonge')
        .setDescription('Gérer ton compte Challonge')
        .addSubcommand((command) =>
          command
            .setName('lier')
            .setDescription('Lier ton pseudo Challonge à ton compte Discord')
            .addStringOption((option) =>
              option
                .setName('pseudo')
                .setDescription('Ton pseudo exact sur Challonge')
                .setRequired(true)
            )
        )
        .addSubcommand((command) =>
          command
            .setName('info')
            .setDescription('Voir les informations de ton compte lié')
        )
    );
  }

  public async chatInputLink(interaction: Subcommand.ChatInputCommandInteraction) {
    const challongeUsername = interaction.options.getString('pseudo', true);
    await interaction.deferReply({ ephemeral: true });

    try {
      // Find or create user and profile
      const user = await prisma.user.upsert({
        where: { discordId: interaction.user.id },
        create: {
          discordId: interaction.user.id,
          discordTag: interaction.user.tag,
          name: interaction.user.displayName,
          email: `${interaction.user.id}@discord.rpbey.fr`,
          profile: {
            create: {
              challongeUsername,
              bladerName: interaction.user.displayName, // Default blader name if new
            },
          },
        },
        update: {
          discordTag: interaction.user.tag,
          profile: {
            upsert: {
              create: {
                challongeUsername,
                bladerName: interaction.user.displayName,
              },
              update: {
                challongeUsername,
              },
            },
          },
        },
        include: { profile: true },
      });

      const embed = new EmbedBuilder()
        .setTitle('✅ Compte Challonge lié !')
        .setDescription(
          `Ton compte Discord est maintenant lié au pseudo Challonge : **${challongeUsername}**.\n\n` +
          `Cela permettra de suivre automatiquement tes résultats de tournoi.`
        )
        .setColor(Colors.Success)
        .setFooter({ text: RPB.FullName })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      this.container.logger.error('Challonge link error:', error);
      return interaction.editReply({
        content: '❌ Une erreur est survenue lors de la liaison du compte.',
      });
    }
  }

  public async chatInputInfo(interaction: Subcommand.ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const user = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
        include: { profile: true },
      });

      if (!user?.profile?.challongeUsername) {
        return interaction.editReply({
          content: "❌ Tu n'as pas encore lié de compte Challonge. Utilise `/challonge lier` pour le faire.",
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('👤 Informations Challonge')
        .setColor(Colors.Primary)
        .addFields({
          name: 'Pseudo Lié',
          value: user.profile.challongeUsername,
          inline: true
        })
        .setDescription(`Lien profil : [Voir sur Challonge](https://challonge.com/users/${user.profile.challongeUsername})`)
        .setFooter({ text: RPB.FullName });

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      this.container.logger.error('Challonge info error:', error);
      return interaction.editReply('❌ Erreur lors de la récupération des infos.');
    }
  }
}
