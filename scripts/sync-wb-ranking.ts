import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import 'dotenv/config';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:rpb_password@localhost:5432/rpb_dashboard';
const pool = new Pool({ connectionString });
const SEASON = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

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

  const playerStats = new Map<string, any>();
  for (const t of tournaments) {
    const idToName = new Map<number, string>();
    for (const p of t.participants) idToName.set(p.id, p.name);
    for (const match of t.matches || []) {
      if (match.state !== 'complete' || !match.winnerId || !match.loserId) continue;
      const wName = idToName.get(match.winnerId);
      const lName = idToName.get(match.loserId);
      if (!wName || !lName) continue;
      if (!playerStats.has(wName)) playerStats.set(wName, { wins: 0, losses: 0, points: 0, participations: 0, tournaments: [] as string[] });
      if (!playerStats.has(lName)) playerStats.set(lName, { wins: 0, losses: 0, points: 0, participations: 0, tournaments: [] as string[] });
      const w = playerStats.get(wName)!;
      w.wins++;
      w.points += 4;
      const l = playerStats.get(lName)!;
      l.losses++;
      if (match.scores && match.scores.length === 3 && match.scores !== '0-0') {
        const parts = match.scores.split('-').map(Number);
        if (parts.length === 2) l.points += Math.min(parts[0], parts[1]);
      }
    }
    const slug = t.metadata.url.split('/').pop() || '';
    for (const p of t.participants) {
      const s = playerStats.get(p.name);
      if (s && !s.tournaments.includes(slug)) {
        s.tournaments.push(slug);
        s.participations++;
      }
    }
  }

  const nbT = tournaments.length;
  const rankings: any[] = [];
  for (const [name, s] of playerStats) {
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
      playerName: name,
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
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
