import { RankCardBuilder } from 'canvacord';
import {
  ApplicationCommandOptionType,
  AttachmentBuilder,
  type CommandInteraction,
  EmbedBuilder,
  type User,
} from 'discord.js';
import { Discord, Slash, SlashChoice, SlashGroup, SlashOption } from 'discordx';
import { inject, injectable } from 'tsyringe';

import {
  generateLeaderboardCard,
  generateProfileCard,
} from '../../lib/canvas-utils.js';
import { Colors } from '../../lib/constants.js';
import { PrismaService } from '../../lib/prisma.js';

@Discord()
@SlashGroup({
  description: 'Commandes de classement et profils',
  name: 'classement',
})
@SlashGroup('classement')
@injectable()
export class RankingGroup {
  constructor(@inject(PrismaService) private prisma: PrismaService) {}

  @Slash({ description: "Voir le profil d'un blader", name: 'profil' })
  @SlashGroup('classement')
  async profile(
    @SlashOption({
      name: 'joueur',
      required: false,
      type: ApplicationCommandOptionType.User,
      description: 'Le joueur à voir',
    })
    targetUser: User | undefined,
    @SlashChoice({ name: 'Style RPB', value: 'rpb' })
    @SlashChoice({ name: 'Style Classique', value: 'classic' })
    @SlashOption({
      name: 'style',
      required: false,
      type: ApplicationCommandOptionType.String,
      description: 'Style de carte',
    })
    style: 'rpb' | 'classic' = 'rpb',
    interaction: CommandInteraction,
  ) {
    const target = targetUser ?? interaction.user;
    await interaction.deferReply();
    try {
      const user = await this.prisma.user.findFirst({
        include: { _count: { select: { tournaments: true } }, profile: true },
        where: { discordId: target.id },
      });
      if (!user || !user.profile)
        return interaction.editReply({ content: '❌ Profil introuvable.' });

      const rankingPoints = user.profile.rankingPoints;
      const rank =
        (await this.prisma.globalRanking.count({
          where: { points: { gt: rankingPoints } },
        })) + 1;

      if (style === 'classic') {
        const level = Math.floor(Math.sqrt(rankingPoints / 10));
        const card = new RankCardBuilder()
          .setAvatar(target.displayAvatarURL({ extension: 'png' }))
          .setDisplayName(target.displayName)
          .setLevel(level)
          .setRank(rank)
          .setCurrentXP(rankingPoints % 100)
          .setRequiredXP(100)
          .setUsername(target.username);
        return interaction.editReply({
          files: [
            new AttachmentBuilder(await card.build(), { name: 'rank.png' }),
          ],
        });
      }

      const cardBuffer = await generateProfileCard({
        activeDeck: null,
        avatarUrl: target.displayAvatarURL({ extension: 'png' }),
        bestStreak: 0,
        bladerName: user.profile.bladerName || target.displayName,
        currentStreak: 0,
        joinedAt: user.createdAt.toLocaleDateString(),
        losses: user.profile.losses,
        rank,
        rankingPoints,
        rankTitle: 'Blader',
        tournamentWins: user.profile.tournamentWins,
        tournamentsPlayed: user._count.tournaments,
        winRate: '0%',
        wins: user.profile.wins,
      });
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Primary)
            .setImage(`attachment://profile.png`),
        ],
        files: [new AttachmentBuilder(cardBuffer, { name: 'profile.png' })],
      });
    } catch (_error) {
      return interaction.editReply('❌ Erreur profil.');
    }
  }

  @Slash({ description: 'Afficher le top des bladers', name: 'top' })
  @SlashGroup('classement')
  async leaderboard(
    @SlashChoice({ name: 'Global', value: 'global' })
    @SlashChoice({ name: 'SATR', value: 'satr' })
    @SlashOption({
      name: 'type',
      required: false,
      type: ApplicationCommandOptionType.String,
      description: 'Type de top',
    })
    _type: string = 'global',
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    const rankings = await this.prisma.globalRanking.findMany({
      take: 10,
      orderBy: { points: 'desc' },
      include: { user: true },
    });
    const entries = rankings.map((p, i) => ({
      avatarUrl: p.user?.image || '',
      name: p.playerName,
      points: p.points,
      rank: i + 1,
      winRate: '0',
    }));
    const buffer = await generateLeaderboardCard(entries);
    return interaction.editReply({
      files: [new AttachmentBuilder(buffer, { name: 'top10.png' })],
    });
  }
}
