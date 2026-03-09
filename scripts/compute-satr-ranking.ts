/**
 * Compute SATR ranking natively from tournament JSON data.
 * Reproduces the Ichigo bot algorithm (events/.computeRanking.js).
 *
 * Usage: pnpm tsx scripts/compute-satr-ranking.ts [--season 1|2]
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Season config: which BBT numbers belong to each season
const SEASON_CONFIG: Record<number, number[]> = {
  1: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
  2: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
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

interface PlayerStats {
  wins: number;
  losses: number;
  points: number;
  participations: number;
  tournaments: string[];
}

export interface RankingEntry {
  rank: number;
  playerName: string;
  score: number;
  wins: number;
  losses: number;
  participation: number;
  winRate: string;
  pointsAverage: string;
}

export interface TournamentMeta {
  slug: string;
  bbtNumber: number;
  participantsCount: number;
  matchesCount: number;
  format: string;
}

/**
 * Parse a score string like "4-2" and return the loser's score.
 * For the Ichigo algorithm, the loser gets their score as points.
 */
function getLoserScore(scores: string): number {
  const parts = scores.split('-').map(Number);
  if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
    return 0;
  }
  return Math.min(parts[0], parts[1]);
}

/**
 * Load all tournament data for a given season.
 */
export async function loadTournamentData(
  season: number,
): Promise<{ tournaments: TournamentData[]; metas: TournamentMeta[] }> {
  const historyDir = join(process.cwd(), 'data', 'satr_history');
  const files = await readdir(historyDir);
  const bbtNumbers = SEASON_CONFIG[season] || [];

  const tournaments: TournamentData[] = [];
  const metas: TournamentMeta[] = [];

  for (const file of files.sort()) {
    const match = file.match(/satr_bbt(\d+)\.json/);
    if (!match) continue;
    const bbtNum = parseInt(match[1], 10);
    if (!bbtNumbers.includes(bbtNum)) continue;

    const content = await readFile(join(historyDir, file), 'utf-8');
    const data: TournamentData = JSON.parse(content);
    tournaments.push(data);
    metas.push({
      slug: `satr_bbt${bbtNum}`,
      bbtNumber: bbtNum,
      participantsCount: data.metadata.participantsCount,
      matchesCount: data.matches?.length || 0,
      format: data.metadata.type || 'double elimination',
    });
  }

  return { tournaments, metas };
}

/**
 * Compute SATR ranking using the Ichigo algorithm.
 *
 * For each player across season tournaments:
 *   points = 4 × W + Σ(loser score per loss)
 *   point_avg = points / (W + L)
 *   winrate = W / (W + L)
 *   winscore = winrate + (point_avg / 100)
 *   punish = 1 / (1 + (floor(nb_tournois / 1.25) + 2) × (1 / (participations × point_avg)))
 *   score = floor(punish × winscore × 100000)
 */
export function computeRanking(tournaments: TournamentData[]): RankingEntry[] {
  const playerStats = new Map<string, PlayerStats>();

  // Build a participant ID → name map per tournament
  for (const tournament of tournaments) {
    const idToName = new Map<number, string>();
    for (const p of tournament.participants) {
      idToName.set(p.id, p.name);
    }

    // Process matches
    for (const match of tournament.matches || []) {
      if (match.state !== 'complete' || !match.winnerId || !match.loserId)
        continue;

      const winnerName = idToName.get(match.winnerId);
      const loserName = idToName.get(match.loserId);
      if (!winnerName || !loserName) continue;

      const loserScore = getLoserScore(match.scores);

      // Winner stats
      if (!playerStats.has(winnerName)) {
        playerStats.set(winnerName, {
          wins: 0,
          losses: 0,
          points: 0,
          participations: 0,
          tournaments: [],
        });
      }
      const winner = playerStats.get(winnerName)!;
      winner.wins += 1;
      winner.points += 4; // 4 points per win

      // Loser stats
      if (!playerStats.has(loserName)) {
        playerStats.set(loserName, {
          wins: 0,
          losses: 0,
          points: 0,
          participations: 0,
          tournaments: [],
        });
      }
      const loser = playerStats.get(loserName)!;
      loser.losses += 1;
      loser.points += loserScore; // Loser gets their score as points
    }

    // Track tournament participation
    const slug = tournament.metadata.url.split('/').pop() || '';
    for (const p of tournament.participants) {
      const stats = playerStats.get(p.name);
      if (stats && !stats.tournaments.includes(slug)) {
        stats.tournaments.push(slug);
        stats.participations += 1;
      }
    }
  }

  // Compute final scores
  const rankings: RankingEntry[] = [];
  const nbTournois = tournaments.length;

  for (const [name, stats] of playerStats) {
    const totalMatches = stats.wins + stats.losses;
    if (totalMatches === 0) continue;

    const pointAvg = stats.points / totalMatches;
    const winrate = stats.wins / totalMatches;
    const winscore = winrate + pointAvg / 100;

    // Punish factor for low participation
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

    const score = Math.floor(punish * winscore * 100000);

    rankings.push({
      rank: 0, // will be set after sorting
      playerName: name,
      score,
      wins: stats.wins,
      losses: stats.losses,
      participation: stats.participations,
      winRate: `${(winrate * 100).toFixed(1)}%`,
      pointsAverage: pointAvg.toFixed(2),
    });
  }

  // Sort: score desc → pointsAverage desc → participations desc
  rankings.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const avgDiff = parseFloat(b.pointsAverage) - parseFloat(a.pointsAverage);
    if (avgDiff !== 0) return avgDiff;
    return b.participation - a.participation;
  });

  // Assign ranks
  for (let i = 0; i < rankings.length; i++) {
    rankings[i].rank = i + 1;
  }

  return rankings;
}

/**
 * Get unique participant count across all tournaments in a season.
 */
export function getUniqueParticipants(tournaments: TournamentData[]): number {
  const names = new Set<string>();
  for (const t of tournaments) {
    for (const p of t.participants) {
      names.add(p.name);
    }
  }
  return names.size;
}

// CLI execution
if (process.argv[1]?.includes('compute-satr-ranking')) {
  const seasonArg = process.argv.indexOf('--season');
  const season = seasonArg !== -1 ? parseInt(process.argv[seasonArg + 1], 10) : 2;

  console.log(`\n🏆 Computing SATR Season ${season} ranking...\n`);

  loadTournamentData(season).then(({ tournaments, metas }) => {
    console.log(`Loaded ${tournaments.length} tournaments:`);
    for (const m of metas) {
      console.log(
        `  - BBT #${m.bbtNumber}: ${m.participantsCount} participants, ${m.matchesCount} matches`,
      );
    }

    const rankings = computeRanking(tournaments);
    const uniqueParticipants = getUniqueParticipants(tournaments);

    console.log(`\nUnique participants: ${uniqueParticipants}`);
    console.log(`\nTop 10:`);
    console.log('─'.repeat(70));
    console.log(
      '#'.padStart(4),
      'Player'.padEnd(20),
      'Score'.padStart(8),
      'W-L'.padStart(8),
      'Part.'.padStart(6),
      'WR%'.padStart(8),
      'Avg'.padStart(8),
    );
    console.log('─'.repeat(70));

    for (const r of rankings.slice(0, 10)) {
      console.log(
        `${r.rank}`.padStart(4),
        r.playerName.padEnd(20),
        `${r.score}`.padStart(8),
        `${r.wins}-${r.losses}`.padStart(8),
        `${r.participation}`.padStart(6),
        r.winRate.padStart(8),
        r.pointsAverage.padStart(8),
      );
    }

    console.log('─'.repeat(70));
    console.log(`\nTotal ranked players: ${rankings.length}`);
  });
}
