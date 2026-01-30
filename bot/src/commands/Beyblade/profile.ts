import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { generateProfileCard } from '../../lib/canvas-utils.js';
import { Colors, RPB } from '../../lib/constants.js';
import prisma from '../../lib/prisma.js';

export class ProfileCommand extends Command {
  constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: "Voir ton profil Beyblade ou celui d'un autre joueur",
    });
  }

  override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('profil')
        .setDescription("Voir le profil d'un blader")
        .addUserOption((opt) =>
          opt
            .setName('joueur')
            .setDescription('Le blader à voir')
            .setRequired(false),
        ),
    );
  }

  override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const targetUser =
      interaction.options.getUser('joueur') ?? interaction.user;

    await interaction.deferReply();

    try {
      // Find user in database
      const user = await prisma.user.findFirst({
        where: { discordId: targetUser.id },
        include: {
          profile: true,
          tournaments: {
            include: { tournament: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!user || !user.profile) {
        const embed = new EmbedBuilder()
          .setTitle(`👤 ${targetUser.displayName}`)
          .setDescription(
            targetUser.id === interaction.user.id
              ? "Tu n'as pas encore de profil Beyblade. Utilise `/inscription rejoindre` pour en créer un !"
              : "Cet utilisateur n'a pas encore de profil Beyblade sur RPB.",
          )
          .setColor(Colors.Warning)
          .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
          .setFooter({ text: RPB.FullName })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      const profile = user.profile;

      // Generate visual profile card
      const cardBuffer = await generateProfileCard({
        bladerName: profile.bladerName || targetUser.displayName,
        avatarUrl: targetUser.displayAvatarURL({ extension: 'png', size: 512 }),
        experience: profile.experience,
        favoriteType: profile.favoriteType || 'Inconnu',
        wins: profile.wins,
        losses: profile.losses,
        tournamentWins: profile.tournamentWins,
        rankingPoints: profile.rankingPoints,
        joinedAt: user.createdAt.toLocaleDateString('fr-FR'),
      });

      const attachment = new AttachmentBuilder(cardBuffer, {
        name: `profile-${targetUser.id}.png`,
      });

      const embed = new EmbedBuilder()
        .setColor(Colors.Primary)
        .setImage(`attachment://profile-${targetUser.id}.png`);

      // Add recent tournaments to the embed description or fields if needed
      if (user.tournaments.length > 0) {
        const recentTournaments = user.tournaments
          .map(
            (tp) =>
              `• **${tp.tournament.name}** : ${tp.finalPlacement ? `Rang #${tp.finalPlacement}` : 'Inscrit'}${tp.checkedIn ? ' ✅' : ''}`,
          )
          .slice(0, 3)
          .join('\n');

        embed.addFields({
          name: '🎯 Derniers Tournois',
          value: recentTournaments || 'Aucun tournoi récent.',
        });
      }

      if (profile.bio) {
        embed.setDescription(profile.bio);
      }

      const components: ActionRowBuilder<ButtonBuilder>[] = [];
      const row = new ActionRowBuilder<ButtonBuilder>();

      if (targetUser.id !== interaction.user.id) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`battle-challenge-${targetUser.id}`)
            .setLabel('Défier')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⚔️'),
        );
      }

      row.addComponents(
        new ButtonBuilder()
          .setLabel('Voir sur le site')
          .setURL(`https://rpbey.fr/profile/${user.id}`)
          .setStyle(ButtonStyle.Link),
      );

      components.push(row);

      return interaction.editReply({
        embeds: [embed],
        files: [attachment],
        components,
      });
    } catch (error) {
      this.container.logger.error('Profile command error:', error);
      return interaction.editReply({
        content: '❌ Erreur lors de la récupération du profil.',
      });
    }
  }
}
