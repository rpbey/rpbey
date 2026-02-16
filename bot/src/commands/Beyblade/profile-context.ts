import {
  ActionRowBuilder,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type User,
  type UserContextMenuCommandInteraction,
} from 'discord.js';
import { ContextMenu, Discord } from 'discordx';

import { Colors, RPB } from '../../lib/constants.js';
import { logger } from '../../lib/logger.js';
import prisma from '../../lib/prisma.js';

@Discord()
export class ProfileContextMenuCommand {
  @ContextMenu({ name: 'Profil Beyblade', type: ApplicationCommandType.User })
  async userHandler(interaction: UserContextMenuCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const targetUser: User = interaction.targetUser;

    try {
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
            "Cet utilisateur n'a pas encore de profil Beyblade sur RPB.",
          )
          .setColor(Colors.Warning)
          .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
          .setFooter({ text: RPB.FullName })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      const profile = user.profile;
      const winRate =
        profile.wins + profile.losses > 0
          ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100)
          : 0;

      const embed = new EmbedBuilder()
        .setTitle(`🌀 ${profile.bladerName ?? targetUser.displayName}`)
        .setDescription(profile.bio ?? 'Pas de bio')
        .setColor(Colors.Primary)
        .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
        .addFields(
          {
            name: '🎮 Type favori',
            value: profile.favoriteType ?? 'Non défini',
            inline: true,
          },
          {
            name: '⭐ Niveau',
            value: profile.experience ?? 'Non défini',
            inline: true,
          },
          {
            name: '📊 Statistiques',
            value:
              `✅ Victoires: ${profile.wins}\n` +
              `❌ Défaites: ${profile.losses}\n` +
              `📈 Win Rate: ${winRate}%`,
            inline: true,
          },
          {
            name: '🏆 Tournois gagnés',
            value: profile.tournamentWins.toString(),
            inline: true,
          },
        );

      if (user.tournaments.length > 0) {
        const recentTournaments = user.tournaments
          .map(
            (tp) =>
              `• ${tp.tournament.name} ${tp.checkedIn ? '✅' : '⏳'} ${tp.finalPlacement ? `#${tp.finalPlacement}` : ''}`,
          )
          .join('\n');

        embed.addFields({
          name: '🎯 Tournois récents',
          value: recentTournaments,
          inline: false,
        });
      }

      const socials: string[] = [];
      if (profile.twitterHandle) socials.push(`🐦 @${profile.twitterHandle}`);
      if (profile.tiktokHandle) socials.push(`🎵 @${profile.tiktokHandle}`);
      if (socials.length > 0) {
        embed.addFields({
          name: '📱 Réseaux sociaux',
          value: socials.join(' | '),
          inline: false,
        });
      }

      embed
        .setFooter({
          text: `${RPB.FullName} | Membre depuis ${user.createdAt.toLocaleDateString('fr-FR')}`,
        })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`battle-challenge-${targetUser.id}`)
          .setLabel('Défier en combat')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⚔️'),
      );

      return interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      logger.error('Profile context menu error:', error);
      return interaction.editReply({
        content: '❌ Erreur lors de la récupération du profil.',
      });
    }
  }
}
