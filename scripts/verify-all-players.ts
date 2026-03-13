import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const exportsDir = join(process.cwd(), 'data/exports');

const bts2 = JSON.parse(readFileSync(join(exportsDir, 'B_TS2.json'), 'utf-8'));
const bts3 = JSON.parse(readFileSync(join(exportsDir, 'B_TS3.json'), 'utf-8'));
const standalone: Array<{
  handle: string;
  displayName: string;
  points: number;
  wins: number;
  losses: number;
  tournaments: number;
}> = JSON.parse(
  readFileSync(join(exportsDir, 'standalone_ranking.json'), 'utf-8'),
);
const mapper: Record<
  string,
  { primaryName: string; challongeUsername: string; aliases: string[] }
> = JSON.parse(
  readFileSync(join(exportsDir, 'participants_map.json'), 'utf-8'),
);

const aliasToKey = new Map<string, string>();
for (const [key, data] of Object.entries(mapper)) {
  for (const alias of data.aliases) aliasToKey.set(alias, key);
}
const normalize = (name: string) =>
  aliasToKey.get(name) || name.toLowerCase().replace(/[^a-z0-9]/g, '');

interface Participant {
  name: string;
  rank: number;
  exactWins?: number;
  exactLosses?: number;
  matchHistory?: string[];
  challongeUsername?: string;
  challongeUrl?: string;
  avatarUrl?: string | null;
}

const isSkipName = (name: string) =>
  !name || name === 'Inscription' || name === 'Player' || name === 'Participant';

// Standalone lookup
const standaloneMap = new Map<string, (typeof standalone)[0]>();
for (const s of standalone) {
  standaloneMap.set(normalize(s.handle || s.displayName), s);
}

// B_TS3 data (reliable - matchHistory available)
const bts3Data = new Map<string, { w: number; l: number }>();
for (const p of bts3.participants as Participant[]) {
  if (isSkipName(p.name)) continue;
  const key = normalize(p.name);
  let w = 0;
  let l = 0;
  if (p.matchHistory && p.matchHistory.length > 0) {
    for (const r of p.matchHistory) {
      if (r === 'W') w++;
      else if (r === 'L') l++;
    }
  }
  bts3Data.set(key, { w, l });
}

// Expected minimum wins by rank in a 58-player double elimination
// Rank 1-2: many wins, Rank 3-4: ~5-7, Rank 5-8: ~3-5, Rank 9-12: ~2-4
// Rank 13-16: ~1-3, Rank 17-32: ~1-2, Rank 33-48: 0-1, Rank 49+: 0
function minWinsForRank(rank: number): number {
  if (rank <= 2) return 5;
  if (rank <= 4) return 4;
  if (rank <= 8) return 3;
  if (rank <= 12) return 2;
  if (rank <= 16) return 1;
  if (rank <= 32) return 1;
  return 0;
}

function maxWinsForRank(rank: number): number {
  if (rank <= 2) return 10;
  if (rank <= 4) return 8;
  if (rank <= 8) return 6;
  if (rank <= 12) return 5;
  if (rank <= 16) return 4;
  if (rank <= 32) return 3;
  if (rank <= 48) return 2;
  return 1;
}

interface Fix {
  name: string;
  participantName: string;
  rank: number;
  currentWins: number;
  currentLosses: number;
  suggestedWins: number;
  suggestedLosses: number;
  reason: string;
}

const fixes: Fix[] = [];

console.log('=== VÉRIFICATION COMPLÈTE B_TS2 (58 joueurs, double elimination) ===\n');

for (const p of (bts2.participants as Participant[]).sort(
  (a, b) => a.rank - b.rank,
)) {
  if (isSkipName(p.name)) continue;

  const key = normalize(p.name);
  const displayName = mapper[key]?.primaryName || p.name;
  const sa = standaloneMap.get(key);
  const b3 = bts3Data.get(key);
  const currentW = p.exactWins || 0;
  const currentL = p.exactLosses ?? 2;
  const minW = minWinsForRank(p.rank);
  const maxW = maxWinsForRank(p.rank);

  // Check 1: Current wins plausible for rank?
  const currentPlausible = currentW >= minW && currentW <= maxW;

  // Check 2: Standalone suggests different values?
  let saW: number | null = null;
  let saL: number | null = null;
  if (sa && b3) {
    saW = sa.wins - b3.w;
    saL = sa.losses - b3.l;
  } else if (sa && !b3) {
    saW = sa.wins;
    saL = sa.losses;
  }

  const saPlausible =
    saW !== null &&
    saL !== null &&
    saW >= 0 &&
    saL >= 0 &&
    saW >= minW &&
    saW <= maxW;

  let status = 'OK';
  let detail = '';

  if (!currentPlausible && saPlausible && saW !== null && saL !== null) {
    // Current data wrong, standalone gives plausible values
    status = 'FIX (standalone)';
    detail = `${currentW}W/${currentL}L -> ${saW}W/${saL}L`;
    fixes.push({
      name: displayName,
      participantName: p.name,
      rank: p.rank,
      currentWins: currentW,
      currentLosses: currentL,
      suggestedWins: saW,
      suggestedLosses: saL,
      reason: 'standalone cross-ref',
    });
  } else if (!currentPlausible && !saPlausible) {
    // Current data wrong but standalone can't help
    status = 'WARN';
    detail = `${currentW}W/${currentL}L (expected ${minW}-${maxW}W)`;
    if (saW !== null) detail += ` | standalone suggests ${saW}W/${saL}L (not plausible)`;
  } else if (currentPlausible) {
    detail = `${currentW}W/${currentL}L`;
  }

  const flag = status === 'OK' ? '  ' : status.startsWith('FIX') ? '→ ' : '⚠ ';
  console.log(
    `${flag}${status.padEnd(18)} ${displayName.padEnd(20)} rank ${String(p.rank).padEnd(4)} ${detail}`,
  );
}

// Apply fixes
console.log(`\n=== RÉSUMÉ ===`);
console.log(`Corrections fiables: ${fixes.length}\n`);

if (fixes.length > 0) {
  for (const fix of fixes) {
    const idx = bts2.participants.findIndex(
      (p: Participant) => p.name === fix.participantName,
    );
    if (idx >= 0) {
      console.log(
        `  ${fix.name}: rank ${fix.rank} | ${fix.currentWins}W/${fix.currentLosses}L -> ${fix.suggestedWins}W/${fix.suggestedLosses}L (${fix.reason})`,
      );
      bts2.participants[idx].exactWins = fix.suggestedWins;
      bts2.participants[idx].exactLosses = fix.suggestedLosses;
    }
  }

  writeFileSync(
    join(exportsDir, 'B_TS2.json'),
    JSON.stringify(bts2, null, 2),
  );
  console.log(`\n${fixes.length} corrections appliquées à B_TS2.json`);
} else {
  console.log('Aucune correction à appliquer.');
}
