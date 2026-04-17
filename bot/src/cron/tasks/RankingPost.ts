import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type TextChannel,
} from 'discord.js';

import { bot } from '../../lib/bot.js';
import {
  generateLeaderboardCard,
  type LeaderboardEntry,
} from '../../lib/canvas-utils.js';
import { Colors, RPB } from '../../lib/constants.js';
import { logger } from '../../lib/logger.js';
import prisma from '../../lib/prisma.js';

const CLASSEMENT_CHANNEL_ID = '1489804785430302851';

function computeWinRate(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return '0%';
  return `${Math.round((wins / total) * 100)}%`;
}

/**
 * Post all rankings (RPB, BBT, UB) to the #classement channel.
 * Edits existing messages if they exist, otherwise sends new ones.
 */
export async function rankingPostTask() {
  logger.info('[Cron] Posting rankings to #classement...');

  try {
    const channel = await bot.channels.fetch(CLASSEMENT_CHANNEL_ID);
    if (!channel?.isTextBased()) {
      logger.warn('[Cron] Classement channel not found');
      return;
    }
    const textChannel = channel as TextChannel;

    // Clean previous bot messages (keep channel fresh)
    try {
      const messages = await textChannel.messages.fetch({ limit: 20 });
      const botMessages = messages.filter((m) => m.author.id === bot.user?.id);
      if (botMessages.size > 0) {
        await textChannel.bulkDelete(botMessages, true).catch(() => {
          // Fallback: delete one by one (messages older than 14 days)
          botMessages.forEach((m) => {
            m.delete().catch(() => {});
          });
        });
      }
    } catch {
      // Ignore cleanup errors
    }

    const now = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // ── 1. RPB Global Ranking ──
    const globalRankings = await prisma.globalRanking.findMany({
      take: 10,
      orderBy: { points: 'desc' },
      include: { user: { include: { profile: true } } },
    });

    if (globalRankings.length > 0) {
      const rpbEntries: LeaderboardEntry[] = globalRankings.map((p, i) => ({
        avatarUrl: p.user?.image || '',
        name: p.playerName,
        points: p.points,
        rank: i + 1,
        winRate: computeWinRate(
          p.user?.profile?.wins ?? 0,
          p.user?.profile?.losses ?? 0,
        ),
      }));
      const rpbBuffer = await generateLeaderboardCard(rpbEntries);

      const rpbEmbed = new EmbedBuilder()
        .setColor(Colors.Primary)
        .setTitle('🏆 Classement RPB')
        .setDescription('Top 10 du classement global de la RPB')
        .setImage('attachment://classement-rpb.png')
        .setFooter({ text: `Mis à jour le ${now} · ${RPB.FullName}` });

      const rpbRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Voir le classement complet')
          .setURL('https://rpbey.fr/rankings')
          .setStyle(ButtonStyle.Link),
      );

      await textChannel.send({
        embeds: [rpbEmbed],
        files: [
          new AttachmentBuilder(rpbBuffer, { name: 'classement-rpb.png' }),
        ],
        components: [rpbRow],
      });
    }

    // ── 2. BBT (SATR) Ranking ──
    const satrEntries = await prisma.seasonEntry.findMany({
      take: 10,
      orderBy: { points: 'desc' },
      where: {
        season: { name: { contains: 'SATR', mode: 'insensitive' } },
      },
      include: { user: true },
    });

    if (satrEntries.length > 0) {
      const bbtEntries: LeaderboardEntry[] = satrEntries.map((e, i) => ({
        avatarUrl: e.user?.image || '',
        name: e.playerName || e.user?.name || 'Blader',
        points: e.points,
        rank: i + 1,
        winRate: computeWinRate(e.wins, e.losses),
      }));
      const bbtBuffer = await generateLeaderboardCard(bbtEntries);

      const bbtEmbed = new EmbedBuilder()
        .setColor(Colors.Secondary)
        .setTitle('🏆 Classement BBT')
        .setDescription('Top 10 du classement Beyblade Battle Tournament')
        .setImage('attachment://classement-bbt.png')
        .setFooter({ text: `Mis à jour le ${now} · ${RPB.FullName}` });

      const bbtRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Voir le classement complet')
          .setURL('https://rpbey.fr/tournaments/satr')
          .setStyle(ButtonStyle.Link),
      );

      await textChannel.send({
        embeds: [bbtEmbed],
        files: [
          new AttachmentBuilder(bbtBuffer, { name: 'classement-bbt.png' }),
        ],
        components: [bbtRow],
      });
    }

    // ── 3. UB (Ultime Bataille) Ranking ──
    const ubRankings = await prisma.wbRanking.findMany({
      take: 10,
      orderBy: { rank: 'asc' },
    });

    if (ubRankings.length > 0) {
      const ubEntries: LeaderboardEntry[] = ubRankings.map((r) => ({
        avatarUrl: '',
        name: r.playerName,
        points: r.score,
        rank: r.rank,
        winRate: r.winRate,
      }));
      const ubBuffer = await generateLeaderboardCard(ubEntries);

      const ubEmbed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle('🏆 Classement UB')
        .setDescription(
          'Top 10 du classement Ultime Bataille (Wild Breakers) — Algorithme Ichigo v2',
        )
        .setImage('attachment://classement-ub.png')
        .setFooter({ text: `Mis à jour le ${now} · ${RPB.FullName}` });

      const ubRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Voir le classement complet')
          .setURL('https://rpbey.fr/tournaments/wb')
          .setStyle(ButtonStyle.Link),
      );

      await textChannel.send({
        embeds: [ubEmbed],
        files: [new AttachmentBuilder(ubBuffer, { name: 'classement-ub.png' })],
        components: [ubRow],
      });
    }

    logger.info('[Cron] Rankings posted to #classement');
  } catch (error) {
    logger.error('[Cron] Ranking post error:', error);
  }
}
