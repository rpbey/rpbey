import { RankCardBuilder } from 'canvacord';
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  type CommandInteraction,
  EmbedBuilder,
  type User,
} from 'discord.js';
import { Discord, Slash, SlashChoice, SlashGroup, SlashOption } from 'discordx';
import { injectable } from 'tsyringe';

import {
  generateLeaderboardCard,
  generateProfileCard,
} from '../../lib/canvas-utils.js';
import { Colors } from '../../lib/constants.js';
import { logger } from '../../lib/logger.js';
import type { PrismaService } from '../../lib/prisma.js';

@Discord()
@SlashGroup({
  name: 'classement',
  description: 'Commandes de classement et profils',
})
@SlashGroup('classement')
@injectable()
export class RankingGroup {
  constructor(private prisma: PrismaService) {}

  @Slash({ name: 'profil', description: "Voir le profil d'un blader" })
  async profile(
    @SlashOption({
      name: 'joueur',
      description: 'Le blader à voir',
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    targetUser: User | undefined,
    interaction: CommandInteraction,
  ) {
    const target = targetUser ?? interaction.user;
    await interaction.deferReply();

    try {
      const user = await this.prisma.user.findFirst({
        where: { discordId: target.id },
        include: {
          profile: true,
          decks: {
            where: { isActive: true },
            include: {
              items: {
                include: { blade: true, ratchet: true, bit: true },
                orderBy: { position: 'asc' },
              },
            },
            take: 1,
          },
          tournaments: {
            include: { tournament: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          _count: {
            select: { tournaments: true },
          },
        },
      });

      if (!user || !user.profile) {
        return interaction.editReply({
          content:
            target.id === interaction.user.id
              ? "Tu n'as pas encore de profil Beyblade. Utilise `/inscription rejoindre` pour en créer un !"
              : "Cet utilisateur n'a pas encore de profil Beyblade sur RPB.",
        });
      }

      const profile = user.profile;
      const matches = await this.prisma.tournamentMatch.findMany({
        where: {
          OR: [{ player1Id: user.id }, { player2Id: user.id }],
          state: 'complete',
        },
        orderBy: { createdAt: 'asc' },
      });

      let bestStreak = 0;
      let tempStreak = 0;
      for (const match of matches) {
        if (match.winnerId === user.id) {
          tempStreak++;
          if (tempStreak > bestStreak) bestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }

      const rank =
        (await this.prisma.profile.count({
          where: { rankingPoints: { gt: profile.rankingPoints } },
        })) + 1;

      const elo = 1000 + (profile.wins * 15 - profile.losses * 15);
      let rankTitle = 'Débutant';
      if (elo >= 1500) rankTitle = 'Champion';
      else if (elo >= 1300) rankTitle = 'Expert';
      else if (elo >= 1150) rankTitle = 'Confirmé';
      else if (elo >= 1000) rankTitle = 'Intermédiaire';

      const totalMatches = profile.wins + profile.losses;
      const winRate =
        totalMatches > 0
          ? `${Math.round((profile.wins / totalMatches) * 100)}%`
          : '0%';

      const activeDeck = user.decks[0];
      const deckData = activeDeck
        ? {
            name: activeDeck.name,
            blades: activeDeck.items
              .map((item: any) => ({
                name: item.blade?.name || '?',
                imageUrl: item.blade?.imageUrl || null,
              }))
              .filter((b: any) => b.name !== '?'),
          }
        : null;

      const cardBuffer = await generateProfileCard({
        bladerName: profile.bladerName || target.displayName,
        avatarUrl: target.displayAvatarURL({ extension: 'png', size: 512 }),
        wins: profile.wins,
        losses: profile.losses,
        tournamentWins: profile.tournamentWins,
        tournamentsPlayed: user._count.tournaments,
        rankingPoints: profile.rankingPoints,
        joinedAt: user.createdAt.toLocaleDateString('fr-FR'),
        rank,
        rankTitle,
        currentStreak: tempStreak,
        bestStreak,
        winRate,
        activeDeck: deckData,
      });

      const attachment = new AttachmentBuilder(cardBuffer, {
        name: `profile-${target.id}.png`,
      });
      const embed = new EmbedBuilder()
        .setColor(Colors.Primary)
        .setImage(`attachment://profile-${target.id}.png`);

      if (profile.bio) embed.setDescription(profile.bio);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Voir sur le site')
          .setURL(`https://rpbey.fr/profile/${user.id}`)
          .setStyle(ButtonStyle.Link),
      );

      return interaction.editReply({
        embeds: [embed],
        files: [attachment],
        components: [row],
      });
    } catch (error) {
      logger.error(error);
      return interaction.editReply(
        '❌ Erreur lors de la récupération du profil.',
      );
    }
  }

  @Slash({
    name: 'card',
    description: 'Génère une carte de rang alternative (Canvacord)',
  })
  async rankCard(
    @SlashOption({
      name: 'joueur',
      description: 'Le joueur à afficher',
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    targetUser: User | undefined,
    interaction: CommandInteraction,
  ) {
    const target = targetUser ?? interaction.user;
    await interaction.deferReply();

    try {
      const user = await this.prisma.user.findFirst({
        where: { discordId: target.id },
        include: { profile: true },
      });

      const rankingPoints = user?.profile?.rankingPoints ?? 0;
      const rankPosition =
        (await this.prisma.profile.count({
          where: { rankingPoints: { gt: rankingPoints } },
        })) + 1;

      const level = Math.floor(Math.sqrt(rankingPoints / 10));
      const currentLevelExp = rankingPoints % (level * 100 || 100);
      const requiredExp = (level + 1) * 100;

      const card = new RankCardBuilder()
        .setAvatar(target.displayAvatarURL({ extension: 'png', size: 256 }))
        .setCurrentXP(currentLevelExp)
        .setRequiredXP(requiredExp)
        .setLevel(level)
        .setRank(rankPosition)
        .setDisplayName(target.displayName)
        .setUsername(target.username)
        .setStatus('online');

      const buffer = await card.build();
      const attachment = new AttachmentBuilder(buffer, {
        name: 'rank-card.png',
      });

      return interaction.editReply({ files: [attachment] });
    } catch (error) {
      logger.error(error);
      return interaction.editReply(
        '❌ Erreur lors de la génération de la carte.',
      );
    }
  }

  @Slash({ name: 'top', description: 'Afficher le top des bladers RPB' })
  async leaderboard(
    @SlashChoice({ name: 'Image (Top 10)', value: 'image' })
    @SlashChoice({ name: 'Texte Complet (.txt)', value: 'text' })
    @SlashOption({
      name: 'format',
      description: "Format de l'affichage",
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    format: string = 'image',
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    try {
      const profiles = await this.prisma.profile.findMany({
        where: {
          rankingPoints: { gt: 0 },
        },
        orderBy: [
          { rankingPoints: 'desc' },
          { tournamentWins: 'desc' },
          { wins: 'desc' },
        ],
        take: format === 'image' ? 10 : undefined,
        include: { user: true },
      });

      if (profiles.length === 0)
        return interaction.editReply('Aucun blader classé.');

      if (format === 'image') {
        const entries = profiles.map((p, i) => ({
          rank: i + 1,
          name: p.bladerName || p.user.name || 'Blader',
          points: p.rankingPoints,
          winRate:
            p.wins + p.losses > 0
              ? ((p.wins / (p.wins + p.losses)) * 100).toFixed(1)
              : '0',
          avatarUrl:
            p.user.image ||
            p.user.serverAvatar ||
            'https://cdn.discordapp.com/embed/avatars/0.png',
        }));

        const buffer = await generateLeaderboardCard(entries);
        const attachment = new AttachmentBuilder(buffer, {
          name: 'leaderboard.png',
        });

        return interaction.editReply({
          content: `🏆 **Classement complet :** https://rpbey.fr/rankings`,
          files: [attachment],
        });
      }

      const textOutput = profiles
        .map(
          (p, i) =>
            `#${i + 1} | ${p.bladerName || p.user.name} | ${p.rankingPoints} pts`,
        )
        .join('\n');
      const attachment = new AttachmentBuilder(Buffer.from(textOutput), {
        name: 'classement.txt',
      });
      return interaction.editReply({
        content: '📄 Classement complet :',
        files: [attachment],
      });
    } catch (error) {
      logger.error(error);
      return interaction.editReply('❌ Erreur.');
    }
  }
}
