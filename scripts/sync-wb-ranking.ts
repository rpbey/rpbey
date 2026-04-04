import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const UB_NUMBERS = [1,2,3,4,5,6,7,8,9,10,11,12,13];
const NAME_OVERRIDES: Record<string, string> = { 'staff wb azure': 'Azure', 'staff wb': 'Staff WB' };

function normalizeName(raw: string) {
  const name = raw.split('/')[0]!.trim();
  return NAME_OVERRIDES[name.toLowerCase()] || name;
}

function getLoserScore(scores: string | null) {
  if (!scores) return 0;
  const parts = scores.split(',')[0]!.split('-');
  if (parts.length !== 2) return 0;
  return Math.min(Number(parts[0]), Number(parts[1]));
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

  const playerStats = new Map<string, any>();
  const canonicalNames = new Map<string, string>();

  for (const t of tournaments) {
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
      if (!playerStats.has(wKey)) playerStats.set(wKey, { name: wName, wins: 0, losses: 0, points: 0, tournaments: new Set() });
      if (!playerStats.has(lKey)) playerStats.set(lKey, { name: lName, wins: 0, losses: 0, points: 0, tournaments: new Set() });
      const w = playerStats.get(wKey)!;
      w.wins++; w.points += 4; w.tournaments.add(t.metadata?.name || '');
      const l = playerStats.get(lKey)!;
      l.losses++; l.points += getLoserScore(m.scores); l.tournaments.add(t.metadata?.name || '');
    }
  }

  const ranked = [...playerStats.values()].map(p => {
    const total = p.wins + p.losses;
    const winRate = total > 0 ? p.wins / total : 0;
    const pointsAvg = total > 0 ? p.points / total : 0;
    const punish = Math.min(p.tournaments.size / tournaments.length, 1);
    const score = Math.round(punish * winRate * pointsAvg / 100 * 100000);
    return {
      rank: 0,
      playerName: p.name,
      score,
      wins: p.wins,
      losses: p.losses,
      participation: p.tournaments.size,
      winRate: `${(Math.round(winRate * 1000) / 10).toFixed(1)}%`,
      pointsAverage: `${(Math.round(pointsAvg * 100) / 100).toFixed(2)}`,
    };
  }).sort((a, b) => b.score - a.score || parseFloat(b.pointsAverage) - parseFloat(a.pointsAverage) || b.participation - a.participation);

  ranked.forEach((r, i) => r.rank = i + 1);
  console.log(`Computed ${ranked.length} rankings`);

  await prisma.$transaction([
    prisma.wbRanking.deleteMany(),
    prisma.wbRanking.createMany({ data: ranked }),
  ]);

  console.log(`✅ DB updated! Top 10:`);
  ranked.slice(0, 10).forEach(r => console.log(`  ${r.rank}. ${r.playerName} (score: ${r.score}, W/L: ${r.wins}/${r.losses}, UBs: ${r.participation})`));
  await prisma.$disconnect();
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
