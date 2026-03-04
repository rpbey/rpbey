/**
 * RPB - User Stats Service
 * Computes and caches user statistics from tournament data
 */

import { prisma } from '@/lib/prisma';

export interface UserStats {
  userId: string;
  bladerName: string;
  challongeUsername: string | null;
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
  points: number; // Added points field
}

export interface LeaderboardEntry {
  userId: string;
  bladerName: string;
  elo: number;
  points: number; // Added points field
  wins: number;
  losses: number;
  winRate: number;
  rank: number;
  tournamentsPlayed: number;
  tournamentWins: number;
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
          items: {
            include: {
              bey: true, // Only if you fetch this explicitly
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

  // Use Official Stats from Profile
  const tournamentWins = user.profile?.tournamentWins || 0;
  const points = user.profile?.rankingPoints || 0;

  // Calculate ELO based on match history
  // totalWins/Losses here are dynamic from the complete matches in DB
  const eloChange = wins * 15 - losses * 15;
  const elo = STARTING_ELO + eloChange;

  // Get rank based on POINTS (Efficient Count Query)
  const rank =
    (await prisma.profile.count({
      where: { rankingPoints: { gt: points } },
    })) + 1;

  // Analyze most used parts from active decks
  const bladeUsage: Record<string, { name: string; count: number }> = {};
  const ratchetUsage: Record<string, { name: string; count: number }> = {};
  const bitUsage: Record<string, { name: string; count: number }> = {};

  for (const deck of user.decks) {
    for (const item of deck.items) {
      // Check for direct parts (custom build)
      if (item.bladeId && item.blade) {
        if (!bladeUsage[item.bladeId])
          bladeUsage[item.bladeId] = { name: item.blade.name, count: 0 };
        const entry = bladeUsage[item.bladeId];
        if (entry) entry.count++;
      }
      if (item.ratchetId && item.ratchet) {
        if (!ratchetUsage[item.ratchetId])
          ratchetUsage[item.ratchetId] = { name: item.ratchet.name, count: 0 };
        const entry = ratchetUsage[item.ratchetId];
        if (entry) entry.count++;
      }
      if (item.bitId && item.bit) {
        if (!bitUsage[item.bitId])
          bitUsage[item.bitId] = { name: item.bit.name, count: 0 };
        const entry = bitUsage[item.bitId];
        if (entry) entry.count++;
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
    challongeUsername: user.profile?.challongeUsername ?? null,
    totalMatches: wins + losses,
    wins: wins,
    losses: losses,
    winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
    tournamentsPlayed: participations.length,
    tournamentsWon: tournamentWins,
    currentStreak,
    bestStreak,
    recentForm,
    rank,
    elo,
    points, // Return points
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
  const profiles = await prisma.profile.findMany({
    orderBy: [{ rankingPoints: 'desc' }, { wins: 'desc' }],
    take: limit,
    include: {
      user: {
        include: {
          _count: {
            select: { tournaments: true },
          },
        },
      },
    },
    where: {
      rankingPoints: { gt: 0 },
    },
  });

  return profiles.map((profile, index) => ({
    userId: profile.userId,
    bladerName: profile.bladerName ?? profile.user.name ?? 'Unknown',
    elo: 1000 + (profile.wins * 15 - profile.losses * 15), // Approximate ELO if not stored
    points: profile.rankingPoints,
    wins: profile.wins,
    losses: profile.losses,
    winRate:
      profile.wins + profile.losses > 0
        ? (profile.wins / (profile.wins + profile.losses)) * 100
        : 0,
    rank: index + 1,
    tournamentsPlayed: profile.user._count.tournaments,
    tournamentWins: profile.tournamentWins,
  }));
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

export { STARTING_ELO, calculateEloChange };
