'use server';

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

// Season config: which UB numbers belong to each season
const SEASON_CONFIG: Record<number, number[]> = {
  1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
};

// Manual name overrides for known aliases/staff accounts
const NAME_OVERRIDES: Record<string, string> = {
  'staff wb azure': 'Azure',
  'wb fulguris': 'Fulguris',
};

interface TournamentMatch {
  id: number;
  identifier: number;
  round: number;
  player1Id: number;
  player2Id: number;
  winnerId: number;
  loserId: number;
  scores: string;
  state: string;
}

interface TournamentParticipant {
  id: number;
  name: string;
  seed: number;
  finalRank: number;
}

interface TournamentData {
  metadata: {
    id: number;
    name: string;
    url: string;
    state: string;
    type: string;
    participantsCount: number;
  };
  participants: TournamentParticipant[];
  matches: TournamentMatch[];
}

export interface WbTournamentMeta {
  slug: string;
  ubNumber: number;
  participantsCount: number;
  matchesCount: number;
  format: string;
}

interface PlayerStats {
  wins: number;
  losses: number;
  points: number;
  participations: number;
  tournaments: string[];
  displayName: string;
}

/**
 * Normalize a player name:
 * - Split on "/" and take the first part (removes deck info)
 * - Trim whitespace
 * - Apply manual overrides for staff/alias accounts
 * - Preserve original casing for display
 */
function normalizeName(rawName: string): string {
  const [beforeSlash] = rawName.split('/');
  let name = (beforeSlash ?? rawName).trim();
  const overrideKey = name.toLowerCase();
  const override = NAME_OVERRIDES[overrideKey];
  if (override) name = override;
  return name;
}

/**
 * Parse loser score from a score string.
 * Handles formats: "4-2", "0-5", "5-2,0-0" (multi-set: take first set)
 * Returns the loser's game wins (the minimum of the two scores).
 */
function getLoserScore(scores: string): number | null {
  if (!scores || scores === '0-0') return null;

  // Handle multi-set scores like "5-2,0-0" — take the first set
  const [firstSet] = scores.split(',');
  if (!firstSet) return null;

  const parts = firstSet.trim().split('-').map(Number);
  if (parts.length !== 2) return null;
  const a = parts[0];
  const b = parts[1];
  if (a === undefined || b === undefined || Number.isNaN(a) || Number.isNaN(b))
    return null;
  if (a === 0 && b === 0) return null;
  return Math.min(a, b);
}

/**
 * Load all tournament data for a given season from local JSON files.
 */
async function loadTournamentData(season: number) {
  const historyDir = join(process.cwd(), 'data', 'wb_history');
  let files: string[];
  try {
    files = await readdir(historyDir);
  } catch {
    return { tournaments: [], metas: [] };
  }
  const ubNumbers = SEASON_CONFIG[season] || [];

  const tournaments: TournamentData[] = [];
  const metas: WbTournamentMeta[] = [];

  for (const file of files.sort()) {
    const match = file.match(/wb_ub(\d+)\.json/);
    if (!match?.[1]) continue;
    const ubNum = parseInt(match[1], 10);
    if (ubNumbers.length > 0 && !ubNumbers.includes(ubNum)) continue;

    const content = await readFile(join(historyDir, file), 'utf-8');
    const data: TournamentData = JSON.parse(content);
    tournaments.push(data);
    metas.push({
      slug: `wb_ub${ubNum}`,
      ubNumber: ubNum,
      participantsCount: data.metadata.participantsCount,
      matchesCount: data.matches?.length || 0,
      format: data.metadata.type || 'double elimination',
    });
  }

  return { tournaments, metas };
}

/**
 * Build a normalized name lookup for a tournament.
 * Maps participant Challonge IDs to their normalized, deduplicated names.
 * Uses case-insensitive merging: the first occurrence's casing wins.
 */
function buildNameMap(
  participants: TournamentParticipant[],
  canonicalNames: Map<string, string>,
): Map<number, string> {
  const idToName = new Map<number, string>();
  for (const p of participants) {
    const normalized = normalizeName(p.name);
    const key = normalized.toLowerCase();

    // Register canonical display name (first occurrence wins)
    if (!canonicalNames.has(key)) {
      canonicalNames.set(key, normalized);
    }

    idToName.set(p.id, canonicalNames.get(key)!);
  }
  return idToName;
}

/**
 * Compute WB ranking using the Ichigo algorithm with name normalization.
 */
function computeRanking(tournaments: TournamentData[]) {
  const playerStats = new Map<string, PlayerStats>();
  const canonicalNames = new Map<string, string>();

  for (const tournament of tournaments) {
    const idToName = buildNameMap(tournament.participants, canonicalNames);

    for (const match of tournament.matches || []) {
      if (match.state !== 'complete' || !match.winnerId || !match.loserId)
        continue;

      const winnerName = idToName.get(match.winnerId);
      const loserName = idToName.get(match.loserId);
      if (!winnerName || !loserName) continue;

      // Use lowercase key for stat merging
      const wKey = winnerName.toLowerCase();
      const lKey = loserName.toLowerCase();

      if (!playerStats.has(wKey)) {
        playerStats.set(wKey, {
          wins: 0,
          losses: 0,
          points: 0,
          participations: 0,
          tournaments: [],
          displayName: winnerName,
        });
      }
      const winner = playerStats.get(wKey)!;
      winner.wins += 1;
      winner.points += 4;

      if (!playerStats.has(lKey)) {
        playerStats.set(lKey, {
          wins: 0,
          losses: 0,
          points: 0,
          participations: 0,
          tournaments: [],
          displayName: loserName,
        });
      }
      const loser = playerStats.get(lKey)!;
      loser.losses += 1;
      const loserScore = getLoserScore(match.scores);
      if (loserScore !== null) loser.points += loserScore;
    }

    const slug = tournament.metadata.url.split('/').pop() || '';
    for (const p of tournament.participants) {
      const normalized = normalizeName(p.name);
      const key = normalized.toLowerCase();
      const stats = playerStats.get(key);
      if (stats && !stats.tournaments.includes(slug)) {
        stats.tournaments.push(slug);
        stats.participations += 1;
      }
    }
  }

  const nbTournois = tournaments.length;
  const rankings: Array<{
    rank: number;
    playerName: string;
    score: number;
    wins: number;
    losses: number;
    participation: number;
    winRate: string;
    pointsAverage: string;
  }> = [];

  for (const [, stats] of playerStats) {
    const totalMatches = stats.wins + stats.losses;
    if (totalMatches === 0) continue;

    const pointAvg = stats.points / totalMatches;
    const winrate = stats.wins / totalMatches;
    const winscore = winrate + pointAvg / 100;

    let punish = 1;
    if (stats.participations > 0 && pointAvg > 0) {
      punish =
        1 /
        (1 +
          (Math.floor(nbTournois / 1.25) + 2) *
            (1 / (stats.participations * pointAvg)));
    } else {
      punish = 0;
    }

    const score = Math.round(punish * winscore * 100000);

    rankings.push({
      rank: 0,
      playerName: stats.displayName,
      score,
      wins: stats.wins,
      losses: stats.losses,
      participation: stats.participations,
      winRate: `${(winrate * 100).toFixed(1)}%`,
      pointsAverage: pointAvg.toFixed(2),
    });
  }

  rankings.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const avgDiff = parseFloat(b.pointsAverage) - parseFloat(a.pointsAverage);
    if (avgDiff !== 0) return avgDiff;
    return b.participation - a.participation;
  });

  for (let i = 0; i < rankings.length; i++) {
    const entry = rankings[i];
    if (entry) entry.rank = i + 1;
  }

  return rankings;
}

/**
 * Sync WB ranking by computing it from local tournament JSON data.
 */
export async function syncWbRanking(season = 1) {
  try {
    const { tournaments } = await loadTournamentData(season);
    if (tournaments.length === 0) {
      return { success: false, error: 'No tournament data found' };
    }

    const rankings = computeRanking(tournaments);

    await prisma.$transaction([
      prisma.wbRanking.deleteMany(),
      prisma.wbRanking.createMany({ data: rankings }),
    ]);

    revalidatePath('/tournaments/wb');
    return { success: true, count: rankings.length };
  } catch (error) {
    console.error('WB Sync Error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get season stats: tournament count, unique participants, tournament metadata.
 * Uses normalized names for accurate unique participant count.
 */
export async function getWbSeasonStats(season = 1) {
  try {
    const { tournaments, metas } = await loadTournamentData(season);
    const uniqueNames = new Set<string>();
    for (const t of tournaments) {
      for (const p of t.participants) {
        uniqueNames.add(normalizeName(p.name).toLowerCase());
      }
    }

    return {
      success: true,
      data: {
        tournamentCount: tournaments.length,
        uniqueParticipants: uniqueNames.size,
        metas,
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get match details for a specific player in a specific tournament.
 * Uses normalized name matching to find the player across name variants.
 */
export async function getWbPlayerTournamentMatches(
  tournamentSlug: string,
  playerName: string,
) {
  try {
    const path = join(
      process.cwd(),
      'data',
      'wb_history',
      `${tournamentSlug.toLowerCase()}.json`,
    );
    const content = await readFile(path, 'utf-8');
    const data: TournamentData = JSON.parse(content);

    const canonicalNames = new Map<string, string>();
    const idToName = buildNameMap(data.participants, canonicalNames);

    // Find player by normalized name match
    const searchKey = normalizeName(playerName).toLowerCase();
    const playerId = data.participants.find((p) => {
      const normalized = normalizeName(p.name).toLowerCase();
      return normalized === searchKey;
    })?.id;

    if (!playerId) return { success: true, data: [] };

    const matches = (data.matches || [])
      .filter(
        (m) =>
          m.state === 'complete' &&
          (m.player1Id === playerId || m.player2Id === playerId),
      )
      .map((m) => {
        const opponentId = m.player1Id === playerId ? m.player2Id : m.player1Id;
        return {
          opponent: idToName.get(opponentId) || 'Unknown',
          scores: m.scores,
          won: m.winnerId === playerId,
          round: m.round,
        };
      })
      .sort((a, b) => {
        if (a.round > 0 && b.round > 0) return a.round - b.round;
        if (a.round < 0 && b.round < 0)
          return Math.abs(b.round) - Math.abs(a.round);
        return a.round > 0 ? -1 : 1;
      });

    return { success: true, data: matches };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function linkWbBladers() {
  try {
    const bladers = await prisma.wbBlader.findMany();
    const users = await prisma.user.findMany({
      select: { id: true, name: true, discordTag: true },
    });

    let linkedCount = 0;
    for (const blader of bladers) {
      const match = users.find(
        (u) =>
          (u.name && u.name.toLowerCase() === blader.name.toLowerCase()) ||
          (u.discordTag &&
            u.discordTag.toLowerCase() === blader.name.toLowerCase()),
      );

      if (match && blader.linkedUserId !== match.id) {
        await prisma.wbBlader.update({
          where: { id: blader.id },
          data: { linkedUserId: match.id },
        });
        linkedCount++;
      }
    }

    revalidatePath('/tournaments/wb');
    return { success: true, linkedCount };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getWbTournamentTop10(slug: string) {
  try {
    const path = join(
      process.cwd(),
      'data',
      'wb_history',
      `${slug.toLowerCase()}.json`,
    );
    const content = await readFile(path, 'utf-8');
    const data = JSON.parse(content);

    const top10 = (data.participants as TournamentParticipant[])
      .filter((p) => p.finalRank && p.finalRank <= 10)
      .sort((a, b) => a.finalRank - b.finalRank)
      .slice(0, 10)
      .map((p) => ({
        rank: p.finalRank,
        name: normalizeName(p.name),
      }));

    return { success: true, data: top10 };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getWbTournamentMeta(slug: string) {
  try {
    const path = join(
      process.cwd(),
      'data',
      'wb_history',
      `${slug.toLowerCase()}.json`,
    );
    const content = await readFile(path, 'utf-8');
    const data: TournamentData = JSON.parse(content);

    return {
      success: true,
      data: {
        participantsCount: data.metadata.participantsCount,
        matchesCount: data.matches?.length || 0,
        format: data.metadata.type || 'double elimination',
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getWbBladerByName(name: string) {
  try {
    const blader = await prisma.wbBlader.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
      },
    });
    return { success: true, data: blader };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
