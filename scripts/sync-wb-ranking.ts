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

async function run() {
  const dir = join(process.cwd(), 'data', 'wb_history');
  const files = await readdir(dir);
  const tournaments: any[] = [];

  for (const file of files.sort()) {
    const match = file.match(/wb_ub(\d+)\.json/);
    if (!match?.[1]) continue;
    const num = parseInt(match[1], 10);
    if (!UB_NUMBERS.includes(num)) continue;
    tournaments.push(JSON.parse(await readFile(join(dir, file), 'utf-8')));
  }
  console.log(`Loaded ${tournaments.length} tournaments`);

  const nbTournois = tournaments.length;
  const playerStats = new Map<string, any>();
  const canonicalNames = new Map<string, string>();

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

      if (!playerStats.has(wKey))
        playerStats.set(wKey, {
          name: wName,
          wins: 0,
          losses: 0,
          points: 0,
          tournaments: new Set(),
        });
      if (!playerStats.has(lKey))
        playerStats.set(lKey, {
          name: lName,
          wins: 0,
          losses: 0,
          points: 0,
          tournaments: new Set(),
        });

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

    const slug = t.metadata?.url?.split('/').pop() || t.metadata?.name || '';
    for (const p of t.participants) {
      const normalized = normalizeName(p.name);
      const key = normalized.toLowerCase();
      const stats = playerStats.get(key);
      if (stats && !stats.tournaments.has(slug)) {
        stats.tournaments.add(slug);
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
      const score = Math.round(punish * winscore * 100000);
      return {
        rank: 0,
        playerName: p.name,
        score,
        wins: p.wins,
        losses: p.losses,
        participation: p.tournaments.size,
        winRate: `${(winRate * 100).toFixed(1)}%`,
        pointsAverage: pointsAvg.toFixed(2),
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        parseFloat(b.pointsAverage) - parseFloat(a.pointsAverage) ||
        b.participation - a.participation,
    );

  ranked.forEach((r, i) => (r.rank = i + 1));
  console.log(`Computed ${ranked.length} rankings (Ichigo v2)`);

  await prisma.$transaction([
    prisma.wbRanking.deleteMany(),
    prisma.wbRanking.createMany({ data: ranked }),
  ]);

  console.log(`\n✅ DB updated! Top 15:`);
  ranked
    .slice(0, 15)
    .forEach((r) =>
      console.log(
        `  ${r.rank}. ${r.playerName} (score: ${r.score}, W/L: ${r.wins}/${r.losses}, UBs: ${r.participation}, avg: ${r.pointsAverage})`,
      ),
    );
  await prisma.$disconnect();
  await pool.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
