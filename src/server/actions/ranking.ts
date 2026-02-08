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
    throw new Error('Invalid config: ' + result.error.message);
  }

  const config = await getRankingConfig();

  await prisma.rankingSystem.update({
    where: { id: config.id },
    data: result.data,
  });

  // revalidateTag('ranking-config'); // Temporarily removed
  revalidatePath('/admin/rankings');
}

export async function recalculateRankings() {
  // This operation is heavy and shouldn't be cached, but its result affects everything
  const config = await getRankingConfig(); // Cached read is fine here
  console.log('⚙️ Ranking Config:', config);

  // Get current season
  const currentSeason = await prisma.rankingSeason.findFirst({
    where: { isActive: true },
  });

  const startDate = currentSeason?.startDate || new Date(0);

  // 1. Fetch data
  console.log(`🔍 Season: ${currentSeason?.name}, Start: ${startDate}`);
  
  const tournaments = await prisma.tournament.findMany({
    where: {
      status: { in: ['COMPLETE', 'ARCHIVED', 'UNDERWAY'] },
      date: { gte: startDate },
    },
    include: {
      category: true,
      participants: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
  });

  console.log(`📊 Found ${tournaments.length} tournaments to process.`);

  const playerPoints = new Map<string, number>();
  const playerStats = new Map<
    string,
    { wins: number; losses: number; tournamentWins: number }
  >();

  // 2. Calculate points
  for (const tournament of tournaments) {
    console.log(`  > Processing "${tournament.name}" (${tournament.participants.length} participants)`);
    const multiplier =
      tournament.category?.multiplier ?? tournament.weight ?? 1.0;

    for (const participant of tournament.participants) {
      if (!participant.user.profile) {
        // console.log(`    ⚠️ Skipping ${participant.userId}: No profile`);
        continue;
      }

      const isFinished =
        tournament.status === 'COMPLETE' || tournament.status === 'ARCHIVED';
      if (!participant.checkedIn && !isFinished) continue;

      const userId = participant.userId;
      let points = 0;

      // Stats Aggregation (Only for finished tournaments)
      if (isFinished) {
        const stats = playerStats.get(userId) || {
          wins: 0,
          losses: 0,
          tournamentWins: 0,
        };
        stats.wins += participant.wins || 0;
        stats.losses += participant.losses || 0;
        if (participant.finalPlacement === 1) {
          stats.tournamentWins += 1;
        }
        playerStats.set(userId, stats);
      }

      // Points de participation (Base)
      points += config.participation;

      // Points de placement bonus
      if (participant.finalPlacement === 1) points += config.firstPlace;
      else if (participant.finalPlacement === 2) points += config.secondPlace;
      else if (participant.finalPlacement === 3) points += config.thirdPlace;
      else if (participant.finalPlacement && participant.finalPlacement <= 8)
        points += config.top8;

      // Points de victoire (Matches)
      // Note: matchWinWinner is applied to all wins for now.
      // If we have distinct winner/loser bracket wins in the future, we can refine this.
      points += (participant.wins || 0) * config.matchWinWinner;

      const weightedPoints = Math.round(points * multiplier);
      const currentPoints = playerPoints.get(userId) || 0;
      playerPoints.set(userId, currentPoints + weightedPoints);
      
      console.log(`    -> ${participant.user.username}: ${weightedPoints} pts`);
    }
  }

  // 3. Add manual adjustments
  const adjustments = await prisma.pointAdjustment.findMany();
  for (const adj of adjustments) {
    const currentPoints = playerPoints.get(adj.userId) || 0;
    playerPoints.set(adj.userId, currentPoints + adj.points);
  }

  console.log(`💾 Saving points for ${playerPoints.size} players...`);
  console.log('Sample points:', Array.from(playerPoints.entries()).slice(0, 3));

  // 4. Batch update
  await prisma.$transaction(
    async (tx) => {
      // Reset stats first
      await tx.profile.updateMany({
        data: { rankingPoints: 0, wins: 0, losses: 0, tournamentWins: 0 },
      });

      for (const [userId, points] of playerPoints.entries()) {
        const stats = playerStats.get(userId) || {
          wins: 0,
          losses: 0,
          tournamentWins: 0,
        };

        await tx.profile.upsert({
          where: { userId },
          update: {
            rankingPoints: points,
            wins: stats.wins,
            losses: stats.losses,
            tournamentWins: stats.tournamentWins,
          },
          create: {
            userId,
            rankingPoints: points,
            wins: stats.wins,
            losses: stats.losses,
            tournamentWins: stats.tournamentWins,
          },
        });
      }
    },
    { timeout: 20000 },
  );

  try {
    revalidatePath('/rankings');
    revalidatePath('/admin/rankings');
  } catch {
    // Ignore error if revalidatePath is called outside of Next.js context
  }
  // revalidateTag('rankings-live');

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
