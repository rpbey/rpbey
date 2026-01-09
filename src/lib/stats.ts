/**
 * RPB - User Stats Service
 * Computes and caches user statistics from tournament data
 */

import { prisma } from '@/lib/prisma';

export interface UserStats {
  userId: string;
  bladerName: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
  currentStreak: number;
  bestStreak: number;
  recentForm: ('W' | 'L')[];
  rank: number;
  elo: number;
  mostUsedBlades: { partId: string; name: string; count: number }[];
  mostUsedRatchets: { partId: string; name: string; count: number }[];
  mostUsedBits: { partId: string; name: string; count: number }[];
  rivalries: {
    opponentId: string;
    opponentName: string;
    wins: number;
    losses: number;
  }[];
}

export interface LeaderboardEntry {
  userId: string;
  bladerName: string;
  elo: number;
  wins: number;
  losses: number;
  winRate: number;
  rank: number;
}

const K_FACTOR = 32; // ELO K-factor for rating changes
const STARTING_ELO = 1000;

/**
 * Calculate new ELO ratings after a match
 */
function calculateEloChange(
  winnerElo: number,
  loserElo: number,
): { winnerNew: number; loserNew: number } {
  const expectedWinner = 1 / (1 + 10 ** ((loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + 10 ** ((winnerElo - loserElo) / 400));

  const winnerNew = Math.round(winnerElo + K_FACTOR * (1 - expectedWinner));
  const loserNew = Math.round(loserElo + K_FACTOR * (0 - expectedLoser));

  return { winnerNew, loserNew: Math.max(loserNew, 100) };
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      decks: {
        include: {
          beys: {
            include: {
              blade: true,
              ratchet: true,
              bit: true,
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  // Get all matches involving this user
  const matches = await prisma.tournamentMatch.findMany({
    where: {
      OR: [{ player1Id: userId }, { player2Id: userId }],
      state: 'complete',
    },
    include: {
      tournament: true,
      player1: { include: { profile: true } },
      player2: { include: { profile: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Get tournament participations
  const participations = await prisma.tournamentParticipant.findMany({
    where: { userId },
    include: {
      tournament: {
        include: {
          participants: {
            orderBy: { finalPlacement: 'asc' },
          },
        },
      },
    },
  });

  // Calculate basic stats
  const wins = matches.filter((m) => m.winnerId === userId).length;
  const losses = matches.length - wins;
  const winRate = matches.length > 0 ? (wins / matches.length) * 100 : 0;

  // Calculate current streak
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  const recentForm: ('W' | 'L')[] = [];

  for (const match of matches.slice(-10).reverse()) {
    const won = match.winnerId === userId;
    recentForm.push(won ? 'W' : 'L');
  }

  for (const match of [...matches].reverse()) {
    const won = match.winnerId === userId;
    if (won) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      if (currentStreak === 0) currentStreak = tempStreak;
      tempStreak = 0;
    }
  }
  if (currentStreak === 0) currentStreak = tempStreak;

  // Count tournament wins
  const tournamentsWon = participations.filter(
    (p) => p.finalPlacement === 1,
  ).length;

  // Calculate ELO (simplified - would need full history)
  const eloChange = wins * 15 - losses * 15;
  const elo = STARTING_ELO + eloChange;

  // Get rank based on ELO
  const allUsers = await prisma.user.findMany({
    select: { id: true },
  });

  const allStats = await Promise.all(
    allUsers.map(async (u) => {
      const userMatches = await prisma.tournamentMatch.count({
        where: {
          winnerId: u.id,
          state: 'complete',
        },
      });
      const userLosses = await prisma.tournamentMatch.count({
        where: {
          OR: [{ player1Id: u.id }, { player2Id: u.id }],
          NOT: { winnerId: u.id },
          state: 'complete',
        },
      });
      return {
        id: u.id,
        elo: STARTING_ELO + userMatches * 15 - userLosses * 15,
      };
    }),
  );

  const sortedByElo = allStats.sort((a, b) => b.elo - a.elo);
  const rank = sortedByElo.findIndex((s) => s.id === userId) + 1;

  // Analyze most used parts from active decks
  const bladeUsage: Record<string, { name: string; count: number }> = {};
  const ratchetUsage: Record<string, { name: string; count: number }> = {};
  const bitUsage: Record<string, { name: string; count: number }> = {};

  for (const deck of user.decks) {
    for (const bey of deck.beys) {
      if (bey.blade) {
        if (!bladeUsage[bey.bladeId])
          bladeUsage[bey.bladeId] = { name: bey.blade.name, count: 0 };
        bladeUsage[bey.bladeId]!.count++;
      }
      if (bey.ratchet) {
        if (!ratchetUsage[bey.ratchetId])
          ratchetUsage[bey.ratchetId] = { name: bey.ratchet.name, count: 0 };
        ratchetUsage[bey.ratchetId]!.count++;
      }
      if (bey.bit) {
        if (!bitUsage[bey.bitId])
          bitUsage[bey.bitId] = { name: bey.bit.name, count: 0 };
        bitUsage[bey.bitId]!.count++;
      }
    }
  }

  const mostUsedBlades = Object.entries(bladeUsage)
    .map(([partId, { name, count }]) => ({ partId, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const mostUsedRatchets = Object.entries(ratchetUsage)
    .map(([partId, { name, count }]) => ({ partId, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const mostUsedBits = Object.entries(bitUsage)
    .map(([partId, { name, count }]) => ({ partId, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Calculate rivalries
  const opponentStats: Record<
    string,
    { name: string; wins: number; losses: number }
  > = {};

  for (const match of matches) {
    const opponentId =
      match.player1Id === userId ? match.player2Id : match.player1Id;
    if (!opponentId) continue;

    const opponent = match.player1Id === userId ? match.player2 : match.player1;
    const opponentName =
      opponent?.profile?.bladerName ?? opponent?.name ?? 'Unknown';

    if (!opponentStats[opponentId]) {
      opponentStats[opponentId] = { name: opponentName, wins: 0, losses: 0 };
    }

    if (match.winnerId === userId) {
      opponentStats[opponentId].wins++;
    } else {
      opponentStats[opponentId].losses++;
    }
  }

  const rivalries = Object.entries(opponentStats)
    .map(([opponentId, { name, wins, losses }]) => ({
      opponentId,
      opponentName: name,
      wins,
      losses,
    }))
    .sort((a, b) => b.wins + b.losses - (a.wins + a.losses))
    .slice(0, 5);

  return {
    userId,
    bladerName: user.profile?.bladerName ?? user.name ?? 'Unknown',
    totalMatches: matches.length,
    wins,
    losses,
    winRate,
    tournamentsPlayed: participations.length,
    tournamentsWon,
    currentStreak,
    bestStreak,
    recentForm,
    rank,
    elo,
    mostUsedBlades,
    mostUsedRatchets,
    mostUsedBits,
    rivalries,
  };
}

/**
 * Get global leaderboard
 */
export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    include: {
      profile: true,
      player1Matches: {
        where: { state: 'complete' },
      },
      player2Matches: {
        where: { state: 'complete' },
      },
    },
  });

  const leaderboard: LeaderboardEntry[] = users
    .map((user) => {
      const allMatches = [...user.player1Matches, ...user.player2Matches];
      const wins = allMatches.filter((m) => m.winnerId === user.id).length;
      const losses = allMatches.length - wins;
      const winRate =
        allMatches.length > 0 ? (wins / allMatches.length) * 100 : 0;
      const elo = STARTING_ELO + wins * 15 - losses * 15;

      return {
        userId: user.id,
        bladerName: user.profile?.bladerName ?? user.name ?? 'Unknown',
        elo,
        wins,
        losses,
        winRate,
        rank: 0,
      };
    })
    .filter((entry) => entry.wins + entry.losses > 0)
    .sort((a, b) => b.elo - a.elo)
    .slice(0, limit);

  // Assign ranks
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard;
}

/**
 * Get head-to-head stats between two users
 */
export async function getHeadToHead(
  userId1: string,
  userId2: string,
): Promise<{
  user1Wins: number;
  user2Wins: number;
  matches: Awaited<ReturnType<typeof prisma.tournamentMatch.findMany>>;
}> {
  const matches = await prisma.tournamentMatch.findMany({
    where: {
      OR: [
        { player1Id: userId1, player2Id: userId2 },
        { player1Id: userId2, player2Id: userId1 },
      ],
      state: 'complete',
    },
    include: {
      tournament: true,
      player1: { include: { profile: true } },
      player2: { include: { profile: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const user1Wins = matches.filter((m) => m.winnerId === userId1).length;
  const user2Wins = matches.filter((m) => m.winnerId === userId2).length;

  return { user1Wins, user2Wins, matches };
}

export { calculateEloChange, STARTING_ELO };
