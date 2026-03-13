'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Zod Schemas
const RankingConfigSchema = z.object({
  participation: z.number().int().min(0),
  firstPlace: z.number().int().min(0),
  secondPlace: z.number().int().min(0),
  thirdPlace: z.number().int().min(0),
  top8: z.number().int().min(0),
  matchWinWinner: z.number().int().min(0),
  matchWinLoser: z.number().int().min(0),
});

const CategorySchema = z.object({
  name: z.string().min(2),
  multiplier: z.number().min(0.1),
  color: z.string().optional(),
});

// Cached Data Fetching
export async function getRankingConfig() {
  let config = await prisma.rankingSystem.findFirst();

  if (!config) {
    config = await prisma.rankingSystem.create({
      data: {
        participation: 500,
        firstPlace: 10000,
        secondPlace: 7000,
        thirdPlace: 5000,
        top8: 500,
        matchWin: 300,
        matchWinWinner: 1000,
        matchWinLoser: 500,
      },
    });
  }

  return config;
}

export async function getTournamentCategories() {
  return await prisma.tournamentCategory.findMany({
    orderBy: { multiplier: 'desc' },
  });
}

// Mutations
export async function updateRankingConfig(data: {
  participation: number;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  top8: number;
  matchWinWinner: number;
  matchWinLoser: number;
}) {
  const result = RankingConfigSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid config: ${result.error.message}`);
  }

  const config = await getRankingConfig();

  await prisma.rankingSystem.update({
    where: { id: config.id },
    data: result.data,
  });

  revalidatePath('/admin/rankings');
}

export async function recalculateRankings() {
  const config = await getRankingConfig();

  const currentSeason = await prisma.rankingSeason.findFirst({
    where: { isActive: true },
  });

  const playerPoints = new Map<string, number>();
  const playerStats = new Map<
    string,
    {
      wins: number;
      losses: number;
      tournamentWins: number;
      tournamentsCount: number;
      playerName: string;
      userId: string | null;
      challongeUsername: string | null;
      avatarUrl: string | null;
    }
  >();

  // 1. Load Mapper & JSON Data
  let mapper: Record<
    string,
    { primaryName: string; challongeUsername: string; aliases: string[] }
  > = {};
  let bts2: Record<string, unknown> | null = null;
  let bts3: Record<string, unknown> | null = null;
  try {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const exportsDir = join(process.cwd(), 'data/exports');
    mapper = JSON.parse(
      readFileSync(join(exportsDir, 'participants_map.json'), 'utf-8'),
    );
    bts2 = JSON.parse(readFileSync(join(exportsDir, 'B_TS2.json'), 'utf-8'));
    bts3 = JSON.parse(readFileSync(join(exportsDir, 'B_TS3.json'), 'utf-8'));
  } catch (_e) {
    // JSON data files not available, skip BTS ranking data
  }

  // Inverse mapping: Map alias to normalized key
  const aliasToKey = new Map<string, string>();
  for (const [key, data] of Object.entries(mapper)) {
    for (const alias of data.aliases) {
      aliasToKey.set(alias, key);
    }
  }

  // 2. Process JSON Tournaments
  interface JsonParticipant {
    name: string;
    rank?: number;
    avatarUrl?: string;
    challongeUsername?: string;
    matchHistory?: string[];
    exactWins?: number;
    exactLosses?: number;
  }
  const processJsonTournament = (
    tournament: { participants?: JsonParticipant[] } | null,
  ) => {
    if (!tournament || !tournament.participants) return;

    // In JSON, we don't have weight/category yet, assume multiplier = 1.0
    const multiplier = 1.0;

    for (const p of tournament.participants) {
      if (
        !p.name ||
        p.name === 'Inscription' ||
        p.name === 'Player' ||
        p.name === 'Participant'
      )
        continue;

      const playerKey =
        aliasToKey.get(p.name) ||
        p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const mapData = mapper[playerKey] || {
        primaryName: p.name,
        challongeUsername: p.challongeUsername ?? null,
      };

      let points = 0;

      // Stats
      const stats = playerStats.get(playerKey) || {
        wins: 0,
        losses: 0,
        tournamentWins: 0,
        tournamentsCount: 0,
        playerName: mapData.primaryName,
        userId: null,
        challongeUsername:
          mapData.challongeUsername !== 'new'
            ? mapData.challongeUsername
            : null,
        avatarUrl: null,
      };

      stats.tournamentsCount += 1;
      if (p.rank === 1) stats.tournamentWins += 1;
      if (p.avatarUrl && !stats.avatarUrl) stats.avatarUrl = p.avatarUrl;

      // Points de participation
      points += config.participation;

      // Points de placement
      if (p.rank === 1) points += config.firstPlace;
      else if (p.rank === 2) points += config.secondPlace;
      else if (p.rank === 3) points += config.thirdPlace;
      else if (p.rank && p.rank <= 8) points += config.top8;

      // Points de victoire (Matches)
      let winPts = 0;

      if (p.matchHistory && p.matchHistory.length > 0) {
        // Use exact sequence (B_TS3)
        let inLB = false;
        let wCount = 0;
        let lCount = 0;
        for (const res of p.matchHistory) {
          if (res === 'L') {
            inLB = true;
            lCount++;
          } else if (res === 'W') {
            winPts += inLB ? config.matchWinLoser : config.matchWinWinner;
            wCount++;
          }
        }
        stats.wins += wCount;
        stats.losses += lCount;
      } else {
        // Fallback deduction (B_TS2)
        const exactW = p.exactWins || 0;
        const exactL = p.exactLosses || (p.rank === 1 ? 0 : 2);

        stats.wins += exactW;
        stats.losses += exactL;

        if (exactW > 0) {
          if (p.rank === 1) {
            // 1st place: if 0 losses, all WB. If 1 loss (reset), 1 win in LB.
            if (exactL === 0) {
              winPts += exactW * config.matchWinWinner;
            } else {
              winPts +=
                (exactW - 1) * config.matchWinWinner + 1 * config.matchWinLoser;
            }
          } else if (p.rank === 2) {
            // 2nd place: usually lost WB final, won LB final, lost GF. So 1 win in LB, rest in WB.
            winPts +=
              Math.max(0, exactW - 1) * config.matchWinWinner +
              1 * config.matchWinLoser;
          } else if (p.rank === 3) {
            // 3rd place: usually lost WB semi, won LB semi & quarter, lost LB final. 2 wins in LB.
            const lbWins = Math.min(exactW, 2);
            winPts +=
              (exactW - lbWins) * config.matchWinWinner +
              lbWins * config.matchWinLoser;
          } else if (p.rank === 4) {
            const lbWins = Math.min(exactW, 2);
            winPts +=
              (exactW - lbWins) * config.matchWinWinner +
              lbWins * config.matchWinLoser;
          } else {
            // General case for lower ranks: assume 1 or 2 wins were in LB if they had wins.
            const wbWins = Math.min(exactW, 1);
            const lbWins = exactW - wbWins;
            winPts +=
              wbWins * config.matchWinWinner + lbWins * config.matchWinLoser;
          }
        }
      }

      points += winPts;
      playerStats.set(playerKey, stats);

      const weightedPoints = Math.round(points * multiplier);
      const currentPoints = playerPoints.get(playerKey) || 0;
      playerPoints.set(playerKey, currentPoints + weightedPoints);
    }
  };

  processJsonTournament(bts2);
  processJsonTournament(bts3);

  // 3. Optional: Process DB tournaments if they exist in current season (excluding auto-imported ones to avoid dupes)
  const startDate = currentSeason?.startDate || new Date(0);
  const dbTournaments = await prisma.tournament.findMany({
    where: {
      status: { in: ['COMPLETE', 'ARCHIVED', 'UNDERWAY'] },
      date: { gte: startDate },
      // Exclude the ones we just processed manually if they were somehow in DB
      id: { notIn: ['bts2', 'bts3', 'cm-fr_b_ts2-auto', 'cm-fr_b_ts3-auto'] },
    },
    include: {
      category: true,
      matches: true,
      participants: { include: { user: { include: { profile: true } } } },
    },
  });

  for (const tournament of dbTournaments) {
    const multiplier =
      tournament.category?.multiplier ?? tournament.weight ?? 1.0;
    for (const participant of tournament.participants) {
      if (
        !participant.checkedIn &&
        tournament.status !== 'COMPLETE' &&
        tournament.status !== 'ARCHIVED'
      )
        continue;

      const baseKey = (
        participant.playerName ||
        participant.user?.profile?.bladerName ||
        'unknown'
      )
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const playerKey = aliasToKey.get(participant.playerName || '') || baseKey;
      const mapData = mapper[playerKey];

      let points = 0;
      const stats = playerStats.get(playerKey) || {
        wins: 0,
        losses: 0,
        tournamentWins: 0,
        tournamentsCount: 0,
        playerName:
          mapData?.primaryName ||
          participant.playerName ||
          participant.user?.profile?.bladerName ||
          'Unknown',
        userId: participant.userId,
        challongeUsername:
          mapData?.challongeUsername ||
          participant.user?.profile?.challongeUsername ||
          null,
        avatarUrl: participant.user?.image || null,
      };

      if (
        tournament.status === 'COMPLETE' ||
        tournament.status === 'ARCHIVED'
      ) {
        stats.tournamentsCount += 1;
        stats.wins += participant.wins || 0;
        stats.losses += participant.losses || 0;
        if (participant.finalPlacement === 1) stats.tournamentWins += 1;
      }

      points += config.participation;
      if (participant.finalPlacement === 1) points += config.firstPlace;
      else if (participant.finalPlacement === 2) points += config.secondPlace;
      else if (participant.finalPlacement === 3) points += config.thirdPlace;
      else if (participant.finalPlacement && participant.finalPlacement <= 8)
        points += config.top8;

      const matchWins = tournament.matches.filter(
        (m) =>
          (m.winnerId === participant.userId ||
            m.winnerName === participant.playerName) &&
          m.state === 'complete',
      );
      let winPts = 0;
      // RPB tournaments: all wins count equally (no WB/LB distinction)
      for (const _m of matchWins) {
        winPts += config.matchWinWinner;
      }
      points += winPts;

      if (!stats.userId && participant.userId)
        stats.userId = participant.userId;
      if (!stats.avatarUrl && participant.user?.image)
        stats.avatarUrl = participant.user.image;
      playerStats.set(playerKey, stats);

      const currentPoints = playerPoints.get(playerKey) || 0;
      playerPoints.set(
        playerKey,
        currentPoints + Math.round(points * multiplier),
      );
    }
  }

  // 4. Manual adjustments
  const adjustments = await prisma.pointAdjustment.findMany();
  for (const adj of adjustments) {
    const user = await prisma.user.findUnique({
      where: { id: adj.userId },
      include: { profile: true },
    });
    const baseKey = (user?.profile?.bladerName || 'unknown')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const playerKey =
      aliasToKey.get(user?.profile?.bladerName || '') || baseKey;
    const currentPoints = playerPoints.get(playerKey) || 0;
    playerPoints.set(playerKey, currentPoints + adj.points);
  }

  // 5. Batch update DB
  await prisma.$transaction(
    async (tx) => {
      await tx.globalRanking.deleteMany({}); // Complete reset of current rankings to rebuild fresh

      const newRankings = [];
      for (const [playerKey, points] of playerPoints.entries()) {
        const stats = playerStats.get(playerKey);
        if (!stats) continue;

        newRankings.push({
          playerName: stats.playerName,
          points: points,
          wins: stats.wins,
          losses: stats.losses,
          tournamentWins: stats.tournamentWins,
          tournamentsCount: stats.tournamentsCount,
          avatarUrl: stats.avatarUrl,
          userId: stats.userId,
          challongeUsername: stats.challongeUsername,
        });
      }

      if (newRankings.length > 0) {
        await tx.globalRanking.createMany({
          data: newRankings.map(
            ({ challongeUsername: _challongeUsername, ...rest }) => rest,
          ),
          skipDuplicates: true,
        });
      }

      // Sync Profiles for UI compatibility
      for (const ranking of newRankings) {
        if (ranking.userId) {
          await tx.profile
            .update({
              where: { userId: ranking.userId },
              data: {
                rankingPoints: ranking.points,
                wins: ranking.wins,
                losses: ranking.losses,
                tournamentWins: ranking.tournamentWins,
                challongeUsername: ranking.challongeUsername || undefined,
              },
            })
            .catch(() => {}); // Ignore if profile doesn't exist
        }
      }
    },
    { timeout: 30000 },
  );

  try {
    revalidatePath('/rankings');
    revalidatePath('/admin/rankings');
  } catch {
    // Ignore error if revalidatePath is called outside of Next.js context
  }

  return {
    success: true,
    message: `Classement recalculé pour ${playerPoints.size} joueurs.`,
  };
}

export async function createTournamentCategory(data: {
  name: string;
  multiplier: number;
  color?: string;
}) {
  const result = CategorySchema.safeParse(data);
  if (!result.success) throw new Error('Invalid category data');

  const category = await prisma.tournamentCategory.create({
    data: result.data,
  });

  // revalidateTag('tournament-categories');
  revalidatePath('/admin/rankings');
  return category;
}

export async function updateTournamentCategory(
  id: string,
  data: { name?: string; multiplier?: number; color?: string },
) {
  // Partial validation
  const category = await prisma.tournamentCategory.update({
    where: { id },
    data,
  });
  // revalidateTag('tournament-categories');
  revalidatePath('/admin/rankings');
  return category;
}

export async function deleteTournamentCategory(id: string) {
  const count = await prisma.tournament.count({ where: { categoryId: id } });
  if (count > 0) {
    throw new Error(
      `Impossible de supprimer cette catégorie car elle est utilisée par ${count} tournois.`,
    );
  }

  await prisma.tournamentCategory.delete({
    where: { id },
  });
  // revalidateTag('tournament-categories');
  revalidatePath('/admin/rankings');
  return { success: true };
}

// --- GESTION DES AJUSTEMENTS MANUELS ---

export async function getPointAdjustments(limit = 20) {
  return await prisma.pointAdjustment.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      admin: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function addPointAdjustment(
  userId: string,
  points: number,
  reason: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) throw new Error('Unauthorized');

  const adjustment = await prisma.pointAdjustment.create({
    data: {
      userId,
      points,
      reason,
      adminId: session.user.id,
    },
  });

  await prisma.profile.update({
    where: { userId },
    data: {
      rankingPoints: {
        increment: points,
      },
    },
  });

  revalidatePath('/admin/rankings');
  return adjustment;
}

export async function deletePointAdjustment(id: string) {
  const adjustment = await prisma.pointAdjustment.findUnique({ where: { id } });
  if (!adjustment) throw new Error('Ajustement introuvable');

  await prisma.pointAdjustment.delete({ where: { id } });

  await prisma.profile.update({
    where: { userId: adjustment.userId },
    data: {
      rankingPoints: {
        decrement: adjustment.points,
      },
    },
  });

  revalidatePath('/admin/rankings');
}

export async function searchUsers(query: string) {
  if (query.length < 2) return [];

  return await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { discordTag: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 5,
    select: {
      id: true,
      name: true,
      image: true,
      email: true,
    },
  });
}
