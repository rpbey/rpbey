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
  description: 'Commandes de classement et profils',
  name: 'classement',
})
@SlashGroup('classement')
@injectable()
export class RankingGroup {
  constructor(private prisma: PrismaService) {
    logger.info('[Bot] RankingGroup initialized.');
  }

  @Slash({ description: "Voir le profil d'un blader", name: 'profil' })
  async profile(
    @SlashOption({
      description: 'Le blader à voir',
      name: 'joueur',
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
        include: {
          _count: {
            select: { tournaments: true },
          },
          profile: true,
          tournaments: {
            include: { tournament: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        where: { discordId: target.id },
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

      // Get matches for streak calculation
      const matches = await this.prisma.tournamentMatch.findMany({
        orderBy: { createdAt: 'asc' },
        where: {
          OR: [{ player1Id: user.id }, { player2Id: user.id }],
          state: 'complete',
        },
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
        (await this.prisma.globalRanking.count({
          where: { points: { gt: profile.rankingPoints } },
        })) + 1;

      // Dynamic Title based on points/wins
      let rankTitle = 'Débutant';
      if (profile.rankingPoints >= 15000) rankTitle = 'Légende';
      else if (profile.rankingPoints >= 10000) rankTitle = 'Champion';
      else if (profile.rankingPoints >= 5000) rankTitle = 'Expert';
      else if (profile.rankingPoints >= 2000) rankTitle = 'Confirmé';
      else if (profile.rankingPoints >= 1000) rankTitle = 'Intermédiaire';

      const totalMatches = profile.wins + profile.losses;
      const winRate =
        totalMatches > 0
          ? `${Math.round((profile.wins / totalMatches) * 100)}%`
          : '0%';

      // Get Active Deck
      const activeDeck = await this.prisma.deck.findFirst({
        include: {
          items: {
            include: { bit: true, blade: true, ratchet: true },
            orderBy: { position: 'asc' },
          },
        },
        where: { isActive: true, userId: user.id },
      });

      const deckData = activeDeck
        ? {
            blades: activeDeck.items
              .map((item) => ({
                imageUrl: item.blade?.imageUrl || null,
                name: item.blade?.name || '?',
              }))
              .filter((b) => b.name !== '?'),
            name: activeDeck.name,
          }
        : null;

      const displayBladerName =
        profile.bladerName || profile.challongeUsername || target.displayName;

      const cardBuffer = await generateProfileCard({
        activeDeck: deckData,
        avatarUrl: target.displayAvatarURL({ extension: 'png', size: 512 }),
        bestStreak,
        bladerName: displayBladerName,
        currentStreak: tempStreak,
        joinedAt: user.createdAt.toLocaleDateString('fr-FR'),
        losses: profile.losses,
        rank,
        rankingPoints: profile.rankingPoints,
        rankTitle,
        tournamentWins: profile.tournamentWins,
        tournamentsPlayed: user._count.tournaments,
        winRate,
        wins: profile.wins,
      });

      const attachment = new AttachmentBuilder(cardBuffer, {
        name: `profile-${target.id}.png`,
      });

      const embed = new EmbedBuilder()
        .setColor(Colors.Primary)
        .setImage(`attachment://profile-${target.id}.png`);

      if (profile.bio) embed.setDescription(profile.bio);

      // Footer with Challonge hint
      if (profile.challongeUsername) {
        embed.setFooter({
          text: `Compte Challonge : ${profile.challongeUsername} • rpbey.fr`,
        });
      } else {
        embed.setFooter({
          text: `rpbey.fr - Lie ton compte Challonge avec /challonge lier`,
        });
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Voir sur le site')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://rpbey.fr/profile/${user.id}`),
      );

      return interaction.editReply({
        components: [row],
        embeds: [embed],
        files: [attachment],
      });
    } catch (error) {
      logger.error('[RankingGroup.profile]', error);
      return interaction.editReply(
        '❌ Une erreur est survenue lors de la génération du profil.',
      );
    }
  }

  @Slash({
    description: 'Génère une carte de rang alternative (Canvacord)',
    name: 'card',
  })
  async rankCard(
    @SlashOption({
      description: 'Le joueur à afficher',
      name: 'joueur',
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
        include: { profile: true },
        where: { discordId: target.id },
      });

      const rankingPoints = user?.profile?.rankingPoints ?? 0;
      const rankPosition =
        (await this.prisma.globalRanking.count({
          where: { points: { gt: rankingPoints } },
        })) + 1;

      const level = Math.floor(Math.sqrt(rankingPoints / 10));
      const currentLevelExp = rankingPoints % (level * 100 || 100);
      const requiredExp = (level + 1) * 100;

      const card = new RankCardBuilder()
        .setAvatar(target.displayAvatarURL({ extension: 'png', size: 256 }))
        .setCurrentXP(currentLevelExp)
        .setDisplayName(target.displayName)
        .setLevel(level)
        .setRank(rankPosition)
        .setRequiredXP(requiredExp)
        .setStatus('online')
        .setUsername(target.username);

      const buffer = await card.build();
      const attachment = new AttachmentBuilder(buffer, {
        name: 'rank-card.png',
      });

      return interaction.editReply({ files: [attachment] });
    } catch (error) {
      logger.error('[RankingGroup.rankCard]', error);
      return interaction.editReply(
        '❌ Erreur lors de la génération de la carte.',
      );
    }
  }

  @Slash({ description: 'Afficher le top des bladers RPB', name: 'top' })
  async leaderboard(
    @SlashChoice({ name: 'Image (Top 10)', value: 'image' })
    @SlashChoice({ name: 'Texte Complet (.txt)', value: 'text' })
    @SlashOption({
      description: "Format de l'affichage",
      name: 'format',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    format: string = 'image',
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    try {
      const rankings = await this.prisma.globalRanking.findMany({
        include: { user: { include: { profile: true } } },
        orderBy: [
          { points: 'desc' },
          { tournamentWins: 'desc' },
          { wins: 'desc' },
        ],
        take: format === 'image' ? 10 : undefined,
        where: {
          points: { gt: 0 },
        },
      });

      if (rankings.length === 0) {
        return interaction.editReply('Aucun blader classé.');
      }

      if (format === 'image') {
        const entries = rankings.map((p, i) => ({
          avatarUrl:
            p.user?.image ||
            p.user?.serverAvatar ||
            'https://cdn.discordapp.com/embed/avatars/0.png',
          name: p.playerName,
          points: p.points,
          rank: i + 1,
          winRate:
            p.wins + p.losses > 0
              ? ((p.wins / (p.wins + p.losses)) * 100).toFixed(1)
              : '0',
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

      const textOutput = rankings
        .map(
          (p, i) =>
            `#${i + 1} | ${p.playerName || 'Anonyme'} | ${p.points} pts`,
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
      logger.error('[RankingGroup.leaderboard]', error);
      return interaction.editReply('❌ Une erreur est survenue.');
    }
  }

  @Slash({
    name: 'top100_backup',
    description: 'Afficher le Top 100 autonome Challonge (Données Backup)',
  })
  async top100Backup(interaction: CommandInteraction) {
    await interaction.deferReply();

    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const filePath = path.resolve(
        process.cwd(),
        '../data/exports/standalone_ranking.json',
      );

      if (!fs.existsSync(filePath)) {
        return interaction.editReply(
          "❌ Le fichier de backup n'a pas encore été généré.",
        );
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const top100 = data.slice(0, 100);

      const embed = new EmbedBuilder()
        .setTitle('🏆 Top 100 Autonome Challonge (Backup)')
        .setColor(Colors.Secondary)
        .setDescription(
          `Basé uniquement sur les handles Challonge des deux derniers tournois.\n\n` +
            top100
              .slice(0, 20)
              .map(
                (r: any, i: number) =>
                  `**#${i + 1}** | \`@${r.handle}\` | **${r.points}** pts`,
              )
              .join('\n'),
        )
        .setTimestamp()
        .setFooter({ text: 'Données brutes Challonge (sans lien Discord)' });

      if (data.length > 20) {
        // Generate full text for .txt attachment
        const fullText = data
          .map(
            (r: any, i: number) =>
              `#${i + 1} | @${r.handle} | ${r.points} pts | ${r.wins}W/${r.losses}L | ${r.tournaments} Tournois`,
          )
          .join('\n');
        const attachment = new AttachmentBuilder(Buffer.from(fullText), {
          name: 'top100_challonge_backup.txt',
        });

        return interaction.editReply({ embeds: [embed], files: [attachment] });
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error(error);
      return interaction.editReply('❌ Erreur lors de la lecture du backup.');
    }
  }
}
