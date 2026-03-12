import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import 'dotenv/config';
import { normalizeWbName } from './wb-name-aliases.js';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:rpb_password@localhost:5432/rpb_dashboard';
const pool = new Pool({ connectionString });
const SEASON = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

/**
 * Parse loser score from a score string.
 * Handles: "4-2", "0-5", "5-2,0-0" (multi-set: take first set)
 */
function getLoserScore(scores: string): number | null {
  if (!scores || scores === '0-0') return null;
  const firstSet = scores.split(',')[0]!.trim();
  const parts = firstSet.split('-').map(Number);
  if (parts.length !== 2) return null;
  const [a, b] = parts;
  if (a === undefined || b === undefined || isNaN(a) || isNaN(b)) return null;
  if (a === 0 && b === 0) return null;
  return Math.min(a, b);
}

async function run() {
  const historyDir = join(process.cwd(), 'data', 'wb_history');
  const files = await readdir(historyDir);
  const tournaments: any[] = [];

  for (const file of files.sort()) {
    const m = file.match(/wb_ub(\d+)\.json/);
    if (!m) continue;
    const ubNum = parseInt(m[1]);
    if (!SEASON.includes(ubNum)) continue;
    const content = await readFile(join(historyDir, file), 'utf-8');
    tournaments.push(JSON.parse(content));
  }

  // Canonical name map: lowercase key -> display name (first occurrence wins)
  const canonicalNames = new Map<string, string>();
  // Player stats keyed by lowercase normalized name
  const playerStats = new Map<string, any>();

  for (const t of tournaments) {
    // Build normalized ID->name map for this tournament
    const idToName = new Map<number, string>();
    for (const p of t.participants) {
      const normalized = normalizeWbName(p.name);
      const key = normalized.toLowerCase();
      if (!canonicalNames.has(key)) canonicalNames.set(key, normalized);
      idToName.set(p.id, canonicalNames.get(key)!);
    }

    for (const match of t.matches || []) {
      if (match.state !== 'complete' || !match.winnerId || !match.loserId) continue;
      const wName = idToName.get(match.winnerId);
      const lName = idToName.get(match.loserId);
      if (!wName || !lName) continue;

      const wKey = wName.toLowerCase();
      const lKey = lName.toLowerCase();

      if (!playerStats.has(wKey)) playerStats.set(wKey, { displayName: wName, wins: 0, losses: 0, points: 0, participations: 0, tournaments: [] as string[] });
      if (!playerStats.has(lKey)) playerStats.set(lKey, { displayName: lName, wins: 0, losses: 0, points: 0, participations: 0, tournaments: [] as string[] });

      const w = playerStats.get(wKey)!;
      w.wins++;
      w.points += 4;

      const l = playerStats.get(lKey)!;
      l.losses++;
      const loserScore = getLoserScore(match.scores);
      if (loserScore !== null) l.points += loserScore;
    }

    const slug = t.metadata.url.split('/').pop() || '';
    for (const p of t.participants) {
      const key = normalizeWbName(p.name).toLowerCase();
      const s = playerStats.get(key);
      if (s && !s.tournaments.includes(slug)) {
        s.tournaments.push(slug);
        s.participations++;
      }
    }
  }

  const nbT = tournaments.length;
  const rankings: any[] = [];
  for (const [, s] of playerStats) {
    const total = s.wins + s.losses;
    if (total === 0) continue;
    const pa = s.points / total;
    const wr = s.wins / total;
    const ws = wr + pa / 100;
    const punish = s.participations > 0 && pa > 0
      ? 1 / (1 + (Math.floor(nbT / 1.25) + 2) * (1 / (s.participations * pa)))
      : 0;
    rankings.push({
      rank: 0,
      playerName: s.displayName,
      score: Math.round(punish * ws * 100000),
      wins: s.wins,
      losses: s.losses,
      participation: s.participations,
      winRate: `${(wr * 100).toFixed(1)}%`,
      pointsAverage: pa.toFixed(2),
    });
  }

  rankings.sort((a, b) => b.score - a.score || parseFloat(b.pointsAverage) - parseFloat(a.pointsAverage) || b.participation - a.participation);
  for (let i = 0; i < rankings.length; i++) rankings[i].rank = i + 1;

  console.log(`📊 ${playerStats.size} joueurs uniques (avant: 379 noms bruts)`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM wb_rankings');
    for (const r of rankings) {
      await client.query(
        'INSERT INTO wb_rankings (id, rank, "playerName", score, wins, losses, participation, "winRate", "pointsAverage", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())',
        [
          `wbr_${Math.random().toString(36).substr(2, 9)}`,
          r.rank, r.playerName, r.score, r.wins, r.losses,
          r.participation, r.winRate, r.pointsAverage,
        ]
      );
    }
    await client.query('COMMIT');
    console.log(`✅ ${rankings.length} joueurs dans le classement WB`);
    console.log(`🏆 Top 10:`);
    for (const r of rankings.slice(0, 10)) {
      console.log(`  #${r.rank} ${r.playerName} - Score: ${r.score} | W:${r.wins} L:${r.losses} | PA:${r.pointsAverage} | WR:${r.winRate} | P:${r.participation}`);
    }
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
