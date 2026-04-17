/**
 * Import SAtR ranking from Google Sheet CSV, merging with W-L from local tournament data.
 * Usage: pnpm tsx scripts/import-satr-sheet.ts
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface TournamentData {
  metadata: { participantsCount: number };
  participants: { id: number; name: string }[];
  matches: {
    state: string;
    winnerId: number;
    loserId: number;
  }[];
}

// Season 2 BBTs — must match the Google Sheet's tournament set
const SEASON_2_BBTS = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

// Compute match W-L per player from tournament JSON files (season 2 only)
function computeMatchStats() {
  const historyDir = join(process.cwd(), 'data', 'satr_history');
  const files = readdirSync(historyDir).filter((f) => {
    const match = f.match(/satr_bbt(\d+)\.json/);
    return match && SEASON_2_BBTS.includes(parseInt(match[1]!, 10));
  });
  const stats = new Map<string, { wins: number; losses: number }>();

  console.log(`Using ${files.length} tournament files: ${files.join(', ')}`);

  for (const file of files) {
    const data: TournamentData = JSON.parse(
      readFileSync(join(historyDir, file), 'utf-8'),
    );
    const idToName = new Map<number, string>();
    for (const p of data.participants) {
      idToName.set(p.id, p.name.toLowerCase().trim());
    }

    for (const match of data.matches || []) {
      if (match.state !== 'complete' || !match.winnerId || !match.loserId)
        continue;
      const winner = idToName.get(match.winnerId);
      const loser = idToName.get(match.loserId);
      if (!winner || !loser) continue;

      if (!stats.has(winner)) stats.set(winner, { wins: 0, losses: 0 });
      if (!stats.has(loser)) stats.set(loser, { wins: 0, losses: 0 });
      stats.get(winner)!.wins++;
      stats.get(loser)!.losses++;
    }
  }

  return stats;
}

// Parse CSV (handles quoted fields with commas)
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

async function main() {
  const csv = readFileSync('/tmp/satr-ranking.csv', 'utf-8');
  const lines = csv.split('\n').filter((l) => l.trim());

  // Skip header
  const dataLines = lines.slice(1);
  console.log(`Parsed ${dataLines.length} players from sheet`);

  // Compute W-L from tournament data
  const matchStats = computeMatchStats();
  console.log(`Computed match stats for ${matchStats.size} players`);

  const rankings = dataLines.map((line) => {
    const fields = parseCSVLine(line);
    // CSV: #, PLAYER, SCORE, WIN, PART., WINRATE, POINTS MOY.
    const rank = parseInt(fields[0]!, 10);
    const playerName = fields[1]!;
    const score = parseInt(fields[2]!, 10);
    const participation = parseInt(fields[4]!, 10);
    // French format: "66,67%" -> "66.67%"
    const winRate = (fields[5] || '0%').replace(',', '.');
    const pointsAverage = (fields[6] || '0').replace(',', '.');

    // Get W-L from tournament data
    const key = playerName.toLowerCase().trim();
    const wl = matchStats.get(key) || { wins: 0, losses: 0 };

    return {
      rank,
      playerName,
      score,
      wins: wl.wins,
      losses: wl.losses,
      participation,
      winRate,
      pointsAverage,
    };
  });

  // Check for players without W-L match
  const noMatch = rankings.filter(
    (r) => r.wins === 0 && r.losses === 0 && r.score > 0,
  );
  if (noMatch.length > 0) {
    console.log(
      `Warning: ${noMatch.length} players with score > 0 had no W-L from tournament data (name mismatch?)`,
    );
    for (const p of noMatch.slice(0, 5)) {
      console.log(`  - "${p.playerName}" (score: ${p.score})`);
    }
  }

  // Import to DB
  await prisma.$transaction([
    prisma.satrRanking.deleteMany(),
    prisma.satrRanking.createMany({ data: rankings }),
  ]);

  console.log(`Imported ${rankings.length} rankings to database.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
