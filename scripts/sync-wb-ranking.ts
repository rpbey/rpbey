import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const UB_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const NAME_OVERRIDES: Record<string, string> = {
  'staff wb azure': 'Azure',
  'staff wb': 'Staff WB',
};

function normalizeName(raw: string) {
  const name = raw.split('/')[0]!.trim();
  return NAME_OVERRIDES[name.toLowerCase()] || name;
}

function parseMatchScores(scores: string | null) {
  if (!scores || scores === '0-0') return null;
  const [firstSet] = scores.split(',');
  if (!firstSet) return null;
  const parts = firstSet.trim().split('-').map(Number);
  if (parts.length !== 2) return null;
  const a = parts[0]!;
  const b = parts[1]!;
  if (Number.isNaN(a) || Number.isNaN(b) || (a === 0 && b === 0)) return null;
  return { winnerScore: Math.max(a, b), loserScore: Math.min(a, b) };
}

interface Stats {
  name: string;
  wins: number;
  losses: number;
  points: number;
  tournaments: Set<string>;
  tournamentWins: number;
  top3: number;
  top5: number;
}

async function run() {
  const dir = join(process.cwd(), 'data', 'wb_history');
  const files = await readdir(dir);
  const tournaments: any[] = [];

  for (const file of files.sort()) {
    const ubMatch = file.match(/wb_ub(\d+)\.json/);
    if (ubMatch?.[1]) {
      const num = parseInt(ubMatch[1], 10);
      if (!UB_NUMBERS.includes(num)) continue;
      tournaments.push(JSON.parse(await readFile(join(dir, file), 'utf-8')));
      continue;
    }
    // Also load hors-série tournaments
    if (file.match(/wb_hs_\w+\.json/)) {
      tournaments.push(JSON.parse(await readFile(join(dir, file), 'utf-8')));
    }
  }
  console.log(`Loaded ${tournaments.length} tournaments`);

  const nbTournois = tournaments.length;
  const playerStats = new Map<string, Stats>();
  const canonicalNames = new Map<string, string>();

  const init = (name: string): Stats => ({
    name,
    wins: 0,
    losses: 0,
    points: 0,
    tournaments: new Set(),
    tournamentWins: 0,
    top3: 0,
    top5: 0,
  });

  for (let tIdx = 0; tIdx < tournaments.length; tIdx++) {
    const t = tournaments[tIdx];
    const recency =
      nbTournois > 1 ? 0.6 + (0.4 * tIdx) / (nbTournois - 1) : 1;

    const idToName = new Map<number, string>();
    for (const p of t.participants) {
      const normalized = normalizeName(p.name);
      const key = normalized.toLowerCase();
      if (!canonicalNames.has(key)) canonicalNames.set(key, normalized);
      idToName.set(p.id, canonicalNames.get(key)!);
    }

    for (const m of t.matches) {
      if (!m.winnerId || !m.loserId) continue;
      const wName = idToName.get(m.winnerId);
      const lName = idToName.get(m.loserId);
      if (!wName || !lName) continue;
      const wKey = wName.toLowerCase();
      const lKey = lName.toLowerCase();

      if (!playerStats.has(wKey)) playerStats.set(wKey, init(wName));
      if (!playerStats.has(lKey)) playerStats.set(lKey, init(lName));

      const w = playerStats.get(wKey)!;
      const l = playerStats.get(lKey)!;

      const parsed = parseMatchScores(m.scores);
      if (parsed) {
        w.points += Math.round(parsed.winnerScore * recency * 100) / 100;
        l.points += Math.round(parsed.loserScore * recency * 100) / 100;
      } else {
        w.points += Math.round(4 * recency * 100) / 100;
      }
      w.wins++;
      l.losses++;
    }

    // Track participation + placements
    const slug = t.metadata?.url?.split('/').pop() || t.metadata?.name || '';
    for (const p of t.participants) {
      const normalized = normalizeName(p.name);
      const key = normalized.toLowerCase();
      if (!playerStats.has(key)) playerStats.set(key, init(normalized));
      const stats = playerStats.get(key)!;
      if (!stats.tournaments.has(slug)) {
        stats.tournaments.add(slug);
      }
      if (p.finalRank === 1) {
        stats.tournamentWins++;
        stats.top3++;
        stats.top5++;
      } else if (p.finalRank && p.finalRank <= 3) {
        stats.top3++;
        stats.top5++;
      } else if (p.finalRank && p.finalRank <= 5) {
        stats.top5++;
      }
    }
  }

  const ranked = [...playerStats.values()]
    .filter((p) => p.wins + p.losses > 0)
    .map((p) => {
      const total = p.wins + p.losses;
      const winRate = p.wins / total;
      const pointsAvg = p.points / total;
      const winscore = winRate + pointsAvg / 100;
      const participationRate = p.tournaments.size / nbTournois;
      const punish = Math.pow(participationRate, 0.6);

      // Placement bonus: 1st +15%, top3 +5%, top5 +2%
      const placementBonus =
        1 +
        p.tournamentWins * 0.15 +
        (p.top3 - p.tournamentWins) * 0.05 +
        (p.top5 - p.top3) * 0.02;

      const score = Math.round(punish * winscore * placementBonus * 100000);
      return {
        rank: 0,
        playerName: p.name,
        score,
        wins: p.wins,
        losses: p.losses,
        participation: p.tournaments.size,
        winRate: `${(winRate * 100).toFixed(1)}%`,
        pointsAverage: pointsAvg.toFixed(2),
        _tw: p.tournamentWins,
        _t3: p.top3,
        _t5: p.top5,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        parseFloat(b.pointsAverage) - parseFloat(a.pointsAverage) ||
        b.participation - a.participation,
    );

  ranked.forEach((r, i) => (r.rank = i + 1));
  console.log(`Computed ${ranked.length} rankings (Ichigo v3)`);

  await prisma.$transaction([
    prisma.wbRanking.deleteMany(),
    prisma.wbRanking.createMany({
      data: ranked.map(({ _tw, _t3, _t5, ...r }) => r),
    }),
  ]);

  console.log(`\n✅ DB updated! Top 15:`);
  ranked
    .slice(0, 15)
    .forEach((r) =>
      console.log(
        `  ${r.rank}. ${r.playerName} (score: ${r.score}, W/L: ${r.wins}/${r.losses}, UBs: ${r.participation}, 🏆${r._tw} 🥉${r._t3} top5:${r._t5})`,
      ),
    );
  await prisma.$disconnect();
  await pool.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
