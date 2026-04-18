/**
 * WBO Meta Scraper — Scrapes Winning Combinations from the WBO forum thread
 * via FlareSolverr (Cloudflare bypass) and calculates meta power scores.
 *
 * Improvements over BBX Weekly:
 * - Direct WBO source data (no middleman)
 * - Placement-weighted scoring (1st=3x, 2nd=2x, 3rd=1x)
 * - Tournament size weighting (log2 of participant count)
 * - Recency decay (exponential half-life)
 * - Multiple time windows (2w, 4w, 8w)
 * - Full combo tracking (top combos, not just individual parts)
 * - Raw event data preserved for analysis
 *
 * Prerequisites: FlareSolverr running on localhost:8191
 *   docker run -d --name flaresolverr -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest
 *
 * Usage: pnpm tsx scripts/scrape-wbo-meta.ts [--pages N] [--force]
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = import.meta.dir;
const DATA_DIR = join(__dirname, '..', 'data');
const COMBOS_PATH = join(DATA_DIR, 'wbo-combos.json');
const META_PATH = join(DATA_DIR, 'wbo-meta.json');
const PARTS_PATH = join(DATA_DIR, 'master-parts.json');

const FLARESOLVERR_URL = 'http://localhost:8191/v1';
const WBO_BASE = 'https://worldbeyblade.org';
const THREAD_SLUG =
  'Thread-Winning-Combinations-at-WBO-Organized-Events-Beyblade-X-BBX';

// ─── Configuration ───────────────────────────────────────────────────

const PERIODS: Record<string, number> = {
  '2weeks': 14,
  '4weeks': 28,
  '8weeks': 56,
};

const DEFAULT_MAX_PAGES = 15;
const MAX_AGE_DAYS = 60;
const PLACEMENT_WEIGHT: Record<number, number> = { 1: 3, 2: 2, 3: 1 };
const RECENCY_HALF_LIFE = 14;
const CATEGORIES = ['Blade', 'Ratchet', 'Bit', 'Assist Blade'];

// ─── Types ───────────────────────────────────────────────────────────

interface RawCombo {
  blade: string;
  ratchet: string;
  bit: string;
  assistBlade?: string;
  stage?: string;
}

interface PlacementEntry {
  placement: number;
  player: string;
  combos: RawCombo[];
}

interface EventData {
  name: string;
  date: string;
  location?: string;
  matchType?: string;
  playerCount?: number;
  ranked?: boolean;
  placements: PlacementEntry[];
}

interface WboComboData {
  scrapedAt: string;
  threadUrl: string;
  pagesScraped: number;
  totalEvents: number;
  events: EventData[];
}

interface SynergyItem {
  name: string;
  score: number;
}

interface ComponentData {
  name: string;
  score: number;
  position_change: number | 'NEW';
  synergy: SynergyItem[];
  usage: number;
}

interface CategoryData {
  category: string;
  components: ComponentData[];
}

interface PeriodMetadata {
  dataSource: string;
  weekId: string;
  startDate: string;
  endDate: string;
  eventsScanned: number;
  partsAnalyzed: number;
}

interface TopCombo {
  blade: string;
  ratchet: string;
  bit: string;
  assistBlade?: string;
  score: number;
  usage: number;
}

interface PeriodData {
  metadata: PeriodMetadata;
  categories: CategoryData[];
  topCombos: TopCombo[];
}

interface WboMetaData {
  scrapedAt: string;
  dataSource: 'wbo';
  periods: Record<string, PeriodData>;
}

// ─── Part Name Database ──────────────────────────────────────────────

interface PartDB {
  blades: Map<string, string>;
  ratchets: Set<string>;
  bits: Map<string, string>;
  assistBlades: Map<string, string>;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildPartDB(): PartDB {
  const db: PartDB = {
    blades: new Map(),
    ratchets: new Set(),
    bits: new Map(),
    assistBlades: new Map(),
  };

  try {
    const parts = JSON.parse(readFileSync(PARTS_PATH, 'utf-8'));
    for (const part of parts) {
      const n = norm(part.name);
      switch (part.type) {
        case 'BLADE':
          db.blades.set(n, part.name);
          db.blades.set(norm(part.name.replace(/\s+/g, '')), part.name);
          break;
        case 'RATCHET':
          db.ratchets.add(part.name);
          break;
        case 'BIT': {
          const m = part.name.match(/^([A-Z]+)\s*\((.+?)\)$/);
          if (m) {
            // Abbreviated form like "H (Hexa)" — map both abbrev and full name
            db.bits.set(norm(m[1]), part.name);
            db.bits.set(norm(m[2]), part.name);
          } else {
            // Only set if not already mapped by an abbreviated form
            if (!db.bits.has(n)) {
              db.bits.set(n, part.name);
            }
          }
          break;
        }
        case 'ASSIST_BLADE': {
          const m = part.name.match(/^([A-Z])\s*\((.+?)\)$/);
          if (m) {
            db.assistBlades.set(norm(m[1]), part.name);
            db.assistBlades.set(norm(m[2]), part.name);
          } else {
            db.assistBlades.set(n, part.name);
          }
          break;
        }
      }
    }
  } catch {
    console.warn('[WBO] Failed to load master-parts.json');
  }

  // Ensure common ratchets
  for (const p of [0, 1, 2, 3, 4, 5, 6, 7, 9]) {
    for (const h of [50, 55, 60, 65, 70, 80, 85]) {
      db.ratchets.add(`${p}-${h}`);
    }
  }

  return db;
}

// ─── FlareSolverr Client ─────────────────────────────────────────────

async function fetchViaFlare(url: string): Promise<string> {
  const res = await fetch(FLARESOLVERR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cmd: 'request.get',
      url,
      maxTimeout: 60000,
    }),
  });

  const data = (await res.json()) as {
    status: string;
    solution?: { status: number; response: string };
  };

  if (data.status !== 'ok' || !data.solution?.response) {
    throw new Error(`FlareSolverr error: ${data.status}`);
  }

  return data.solution.response;
}

// ─── HTML Parsing ────────────────────────────────────────────────────

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\t+/g, ' ')
    .replace(/  +/g, ' ');
}

function getPageCount(html: string): number {
  const pageLinks = [...html.matchAll(/href="[^"]*page=(\d+)"/g)];
  const pages = pageLinks.map((m) => parseInt(m[1], 10)).filter((n) => !isNaN(n));
  return pages.length > 0 ? Math.max(...pages) : 1;
}

function extractPostsText(html: string): string[] {
  // Split by post_NNNN divs
  const parts = html.split(/id="post_\d+"/);
  const posts: string[] = [];

  for (let i = 1; i < parts.length; i++) {
    const text = htmlToText(parts[i]);
    if (text.length > 50) {
      posts.push(text);
    }
  }

  return posts;
}

// ─── Combo Parsing ───────────────────────────────────────────────────

// Known assist blade names (for detecting BladeAssistBlade patterns)
const ASSIST_BLADE_NAMES = [
  'Heavy', 'Wheel', 'Bumper', 'Charge', 'Assault', 'Dual', 'Erase',
  'Slash', 'Round', 'Turn', 'Jaggy', 'Zillion', 'Free', 'Massive',
  'Knuckle', 'Vertical',
];

const RATCHET_RE = /(\d)-(\d{2})/;

function parseComboLine(line: string, db: PartDB): RawCombo | null {
  // Match ratchet pattern (strongest anchor)
  const ratchetMatch = line.match(RATCHET_RE);
  if (!ratchetMatch) return null;

  const ratchet = `${ratchetMatch[1]}-${ratchetMatch[2]}`;
  const ratchetIdx = ratchetMatch.index!;

  // Everything before ratchet = blade (possibly with assist blade)
  let beforeRatchet = line.substring(0, ratchetIdx).trim();
  // Everything after ratchet = bit + stage annotation
  let afterRatchet = line.substring(ratchetIdx + ratchetMatch[0].length).trim();

  // Remove leading bullets/dashes
  beforeRatchet = beforeRatchet.replace(/^[-–—•*]\s*/, '').trim();

  // Remove stage annotations from bit
  const stageMatch = afterRatchet.match(/\(([^)]+)\)/);
  const stage = stageMatch ? stageMatch[1] : undefined;
  afterRatchet = afterRatchet.replace(/\(.*?\)/g, '').trim();

  // Detect assist blade in the blade string
  // Format: "EmperorBlast Heavy" or "ValkyrieBlast Heavy"
  let assistBlade: string | undefined;
  for (const ab of ASSIST_BLADE_NAMES) {
    const abPattern = new RegExp(`\\s+${ab}$`, 'i');
    if (abPattern.test(beforeRatchet)) {
      assistBlade = ab;
      beforeRatchet = beforeRatchet.replace(abPattern, '').trim();
      break;
    }
    // Also check for "Blade AssistBlade" with no space before ratchet
    // e.g., "EmperorBlast Heavy9-60Kick" → beforeRatchet = "EmperorBlast Heavy"
    const abInline = new RegExp(`${ab}$`, 'i');
    if (abInline.test(beforeRatchet) && beforeRatchet.length > ab.length + 3) {
      assistBlade = ab;
      beforeRatchet = beforeRatchet.substring(0, beforeRatchet.length - ab.length).trim();
      break;
    }
  }

  // Resolve blade name
  const bladeNorm = norm(beforeRatchet);
  let blade = db.blades.get(bladeNorm) || null;

  // Try fuzzy match
  if (!blade) {
    for (const [key, val] of db.blades) {
      if (key.length > 4 && (bladeNorm.includes(key) || key.includes(bladeNorm))) {
        blade = val;
        break;
      }
    }
  }

  if (!blade && beforeRatchet.length >= 3) {
    // Use as-is with proper casing
    blade = beforeRatchet;
  }

  if (!blade) return null;

  // Resolve bit - might be stuck to ratchet (e.g., "9-60Rush")
  let bitStr = afterRatchet;
  let bit: string | null = null;

  if (bitStr) {
    // Try exact match
    bit = db.bits.get(norm(bitStr)) || null;

    // Try splitting on space and matching first word(s)
    if (!bit && bitStr.includes(' ')) {
      const words = bitStr.split(/\s+/);
      bit = db.bits.get(norm(words.slice(0, 2).join(''))) || null;
      if (!bit) bit = db.bits.get(norm(words[0])) || null;
    }

    // Still nothing? Use raw
    if (!bit) bit = bitStr;
  } else {
    bit = 'Unknown';
  }

  return { blade, ratchet, bit, assistBlade, stage };
}

// ─── Date Parsing ────────────────────────────────────────────────────

function validateDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2023 || year > 2030) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseDate(text: string): string | null {
  // "Date: MM/DD/YYYY" — only match after "Date:" to avoid false positives
  const datePrefixed = text.match(/Date:\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/i);
  if (datePrefixed) {
    let year = parseInt(datePrefixed[3]);
    if (year < 100) year += 2000;
    return validateDate(year, parseInt(datePrefixed[1]), parseInt(datePrefixed[2]));
  }

  // MM/DD/YYYY or M/D/YYYY (standalone)
  const mdySlash = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (mdySlash) {
    let year = parseInt(mdySlash[3]);
    if (year < 100) year += 2000;
    const month = parseInt(mdySlash[1]);
    const day = parseInt(mdySlash[2]);
    // If month > 12, swap month and day (DD/MM/YYYY)
    if (month > 12 && day <= 12) {
      return validateDate(year, day, month);
    }
    return validateDate(year, month, day);
  }

  // Month DD, YYYY or DD Month YYYY
  const months: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  };

  const mdy = text.match(
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/i,
  );
  if (mdy) {
    const m = months[mdy[1].toLowerCase()];
    return validateDate(parseInt(mdy[3]), m, parseInt(mdy[2]));
  }

  const dmy = text.match(
    /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december),?\s+(\d{4})/i,
  );
  if (dmy) {
    const m = months[dmy[2].toLowerCase()];
    return validateDate(parseInt(dmy[3]), m, parseInt(dmy[1]));
  }

  return null;
}

// ─── Event Parsing ───────────────────────────────────────────────────

function parseEvent(text: string, db: PartDB): EventData | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) return null;

  let eventName = '';
  let date: string | null = null;
  let playerCount: number | undefined;
  let ranked = false;
  let matchType: string | undefined;

  // Pass 1: Extract metadata
  for (const line of lines) {
    if (/^Date:\s*/i.test(line)) {
      date = parseDate(line);
    }
    if (/^Player Count:\s*(\d+)/i.test(line)) {
      const m = line.match(/Player Count:\s*(\d+)/i);
      if (m) playerCount = parseInt(m[1]);
    }
    if (/^RANKED$/i.test(line)) {
      ranked = true;
    }
    if (/^Event Page Link:/i.test(line)) {
      // Try to extract event name from URL slug
      const urlMatch = line.match(/Thread-([^-]+(?:-[^-]+)*?)(?:--\d+)?$/);
      if (urlMatch) {
        eventName = urlMatch[1].replace(/-/g, ' ');
      }
    }
    if (/Stage Battle Type/i.test(line)) {
      matchType = line.replace(/.*?:\s*/, '').trim();
    }
  }

  // Try to find event name from first non-metadata line
  if (!eventName) {
    for (const line of lines.slice(0, 5)) {
      if (
        !/^(Date|Event Page|Bracket|RANKED|Stadium|First Stage|Final Stage|Player Count|Optional)/i.test(line) &&
        !RATCHET_RE.test(line) &&
        !/^(1st|2nd|3rd|4th)/i.test(line) &&
        line.length > 3 &&
        line.length < 100
      ) {
        eventName = line;
        break;
      }
    }
  }

  if (!date) {
    // Try finding date anywhere in the text
    for (const line of lines) {
      date = parseDate(line);
      if (date) break;
    }
  }

  if (!date) return null;

  // Pass 2: Extract placements and combos
  const placements: PlacementEntry[] = [];
  let current: PlacementEntry | null = null;

  const placeMap: Record<string, number> = { '1st': 1, '2nd': 2, '3rd': 3 };

  for (const line of lines) {
    // Detect placement line
    const placeMatch = line.match(/^(1st|2nd|3rd)\s+(.*)/i);
    if (placeMatch) {
      if (current && current.combos.length > 0) placements.push(current);
      const placement = placeMap[placeMatch[1].toLowerCase()];
      if (!placement) continue;
      // Clean player name (remove @" " wrapper)
      const player = placeMatch[2].replace(/@"|"/g, '').trim();
      current = { placement, player, combos: [] };
      continue;
    }

    // Try to parse combo line
    if (current && RATCHET_RE.test(line)) {
      const combo = parseComboLine(line, db);
      if (combo) {
        current.combos.push(combo);
      }
    }
  }

  if (current && current.combos.length > 0) placements.push(current);

  // Filter placements without combos
  const valid = placements.filter((p) => p.combos.length > 0);
  if (valid.length === 0) return null;

  return {
    name: eventName || 'Unknown Event',
    date,
    matchType,
    playerCount,
    ranked,
    placements: valid,
  };
}

function splitPostIntoEvents(postText: string): string[] {
  // Split by "Date:" lines (each event starts with Date:)
  const events: string[] = [];
  const lines = postText.split('\n');
  let current: string[] = [];

  for (const line of lines) {
    if (/^Date:\s*\d/i.test(line.trim())) {
      if (current.length > 0) events.push(current.join('\n'));
      current = [line];
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) events.push(current.join('\n'));

  // If no "Date:" headers found, the whole post might be one event
  if (events.length === 0 && postText.length > 50) {
    events.push(postText);
  }

  return events;
}

// ─── Meta Score Calculation ──────────────────────────────────────────

interface PartScore {
  name: string;
  category: string;
  rawScore: number;
  usage: number;
  coOccurrences: Map<string, number>;
}

function getISOWeekId(d: Date): string {
  const date = new Date(d);
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function calculateMeta(
  events: EventData[],
  periodDays: number,
  now: Date,
  previousData?: PeriodData,
): PeriodData {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - periodDays);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const periodEvents = events.filter((e) => e.date >= cutoffStr);

  const partScores = new Map<string, PartScore>();
  let totalParts = 0;

  for (const event of periodEvents) {
    const eventDate = new Date(event.date);
    if (isNaN(eventDate.getTime())) continue; // Skip invalid dates

    const daysAgo = (now.getTime() - eventDate.getTime()) / 86400000;
    if (daysAgo < 0 || daysAgo > 365) continue; // Skip future/very old dates

    const recencyWeight = Math.pow(0.5, daysAgo / RECENCY_HALF_LIFE);

    // Tournament size weight: log2(playerCount), default 16 if unknown
    const sizeWeight = Math.log2(event.playerCount || 16) / Math.log2(16);

    for (const placement of event.placements) {
      const placementWeight = PLACEMENT_WEIGHT[placement.placement] || 1;

      for (const combo of placement.combos) {
        const weight = placementWeight * recencyWeight * sizeWeight;
        if (!isFinite(weight) || weight <= 0) continue;

        // All parts from this combo
        const partKeys: [string, string][] = [
          ['Blade', combo.blade],
          ['Ratchet', combo.ratchet],
          ['Bit', combo.bit],
        ];
        if (combo.assistBlade) {
          partKeys.push(['Assist Blade', combo.assistBlade]);
        }

        for (const [category, name] of partKeys) {
          totalParts++;
          const key = `${category}:${name}`;

          if (!partScores.has(key)) {
            partScores.set(key, {
              name,
              category,
              rawScore: 0,
              usage: 0,
              coOccurrences: new Map(),
            });
          }

          const ps = partScores.get(key)!;
          ps.rawScore += weight;
          ps.usage++;

          // Co-occurrences for synergy (cross-category only)
          for (const [otherCat, otherName] of partKeys) {
            if (otherCat === category) continue;
            ps.coOccurrences.set(
              otherName,
              (ps.coOccurrences.get(otherName) || 0) + weight,
            );
          }
        }
      }
    }
  }

  // Build previous ranks lookup
  const previousRanks = new Map<string, number>();
  if (previousData) {
    for (const cat of previousData.categories) {
      for (let i = 0; i < cat.components.length; i++) {
        previousRanks.set(`${cat.category}:${cat.components[i].name}`, i + 1);
      }
    }
  }

  // Group by category, normalize, build output
  const categoryMap = new Map<string, PartScore[]>();
  for (const ps of partScores.values()) {
    if (!categoryMap.has(ps.category)) categoryMap.set(ps.category, []);
    categoryMap.get(ps.category)!.push(ps);
  }

  const categories: CategoryData[] = [];

  for (const catName of CATEGORIES) {
    const parts = categoryMap.get(catName);
    if (!parts || parts.length === 0) continue;

    parts.sort((a, b) => b.rawScore - a.rawScore);
    const maxScore = parts[0].rawScore;

    const components: ComponentData[] = parts.map((ps, idx) => {
      const score = maxScore > 0 ? Math.round((ps.rawScore / maxScore) * 100) : 0;

      const prevKey = `${catName}:${ps.name}`;
      const prevRank = previousRanks.get(prevKey);
      const position_change: number | 'NEW' =
        prevRank === undefined ? 'NEW' : prevRank - (idx + 1);

      const synEntries = [...ps.coOccurrences.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
      const maxSyn = synEntries.length > 0 ? synEntries[0][1] : 1;
      const synergy: SynergyItem[] = synEntries.map(([name, raw]) => ({
        name,
        score: Math.round((raw / maxSyn) * 100),
      }));

      return { name: ps.name, score, position_change, synergy, usage: ps.usage };
    });

    // Filter very low usage (< 2% of top)
    const minUsage = Math.max(1, Math.floor(parts[0].usage * 0.02));
    categories.push({
      category: catName,
      components: components.filter((c) => c.usage >= minUsage),
    });
  }

  // Top combos
  const comboMap = new Map<
    string,
    { score: number; usage: number; blade: string; ratchet: string; bit: string; assistBlade?: string }
  >();

  for (const event of periodEvents) {
    const eventDate = new Date(event.date);
    if (isNaN(eventDate.getTime())) continue;
    const daysAgo = (now.getTime() - eventDate.getTime()) / 86400000;
    if (daysAgo < 0 || daysAgo > 365) continue;
    const recencyWeight = Math.pow(0.5, daysAgo / RECENCY_HALF_LIFE);
    const sizeWeight = Math.log2(event.playerCount || 16) / Math.log2(16);

    for (const placement of event.placements) {
      const w = (PLACEMENT_WEIGHT[placement.placement] || 1) * recencyWeight * sizeWeight;
      if (!isFinite(w) || w <= 0) continue;

      for (const combo of placement.combos) {
        const key = `${combo.blade}|${combo.ratchet}|${combo.bit}${combo.assistBlade ? `|${combo.assistBlade}` : ''}`;
        const ex = comboMap.get(key);
        if (ex) {
          ex.score += w;
          ex.usage++;
        } else {
          comboMap.set(key, {
            score: w,
            usage: 1,
            blade: combo.blade,
            ratchet: combo.ratchet,
            bit: combo.bit,
            assistBlade: combo.assistBlade,
          });
        }
      }
    }
  }

  const sortedCombos = [...comboMap.values()].sort((a, b) => b.score - a.score);
  const maxComboScore = sortedCombos.length > 0 ? sortedCombos[0].score : 1;
  const topCombos: TopCombo[] = sortedCombos.slice(0, 25).map((c) => ({
    blade: c.blade,
    ratchet: c.ratchet,
    bit: c.bit,
    assistBlade: c.assistBlade,
    score: Math.round((c.score / maxComboScore) * 100),
    usage: c.usage,
  }));

  return {
    metadata: {
      dataSource: `wbo-direct/${periodDays}d`,
      weekId: getISOWeekId(now),
      startDate: cutoff.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      eventsScanned: periodEvents.length,
      partsAnalyzed: totalParts,
    },
    categories,
    topCombos,
  };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const maxPagesIdx = args.indexOf('--pages');
  const maxPages = maxPagesIdx >= 0
    ? parseInt(args[maxPagesIdx + 1] || String(DEFAULT_MAX_PAGES))
    : DEFAULT_MAX_PAGES;
  const forceRescrape = args.includes('--force');

  console.log(`[WBO] Starting WBO Meta scraper (max ${maxPages} pages)...`);

  mkdirSync(DATA_DIR, { recursive: true });
  const db = buildPartDB();
  console.log(
    `[WBO] Part DB: ${db.blades.size} blades, ${db.ratchets.size} ratchets, ${db.bits.size} bits, ${db.assistBlades.size} assists`,
  );

  // Check FlareSolverr is running
  try {
    const healthRes = await fetch(FLARESOLVERR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd: 'sessions.list' }),
    });
    if (!healthRes.ok) throw new Error('Not reachable');
    console.log('[WBO] FlareSolverr is running');
  } catch {
    console.error(
      '[WBO] FlareSolverr not running! Start it with:\n  docker run -d --name flaresolverr -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest',
    );
    process.exit(1);
  }

  // Load existing combos for incremental updates
  let existingCombos: WboComboData | null = null;
  if (!forceRescrape && existsSync(COMBOS_PATH)) {
    try {
      existingCombos = JSON.parse(readFileSync(COMBOS_PATH, 'utf-8'));
      console.log(`[WBO] Loaded ${existingCombos!.events.length} existing events`);
    } catch { /* ignore */ }
  }

  // Step 1: Get page count
  console.log('[WBO] Fetching thread page 1...');
  const firstPageHtml = await fetchViaFlare(`${WBO_BASE}/${THREAD_SLUG}?page=1`);
  const totalPages = getPageCount(firstPageHtml);
  console.log(`[WBO] Thread has ${totalPages} pages`);

  // Step 2: Scrape from last page backwards
  let allEvents: EventData[] = [];
  const startPage = totalPages;
  const endPage = Math.max(1, totalPages - maxPages + 1);
  let pagesScraped = 0;
  let stopScraping = false;

  for (let pageNum = startPage; pageNum >= endPage && !stopScraping; pageNum--) {
    console.log(`[WBO] Scraping page ${pageNum}/${totalPages}...`);

    const html = pageNum === 1 ? firstPageHtml : await fetchViaFlare(
      `${WBO_BASE}/${THREAD_SLUG}?page=${pageNum}`,
    );
    pagesScraped++;

    const posts = extractPostsText(html);
    let pageEvents = 0;

    for (const postText of posts) {
      const eventTexts = splitPostIntoEvents(postText);

      for (const eventText of eventTexts) {
        const event = parseEvent(eventText, db);
        if (!event) continue;

        allEvents.push(event);
        pageEvents++;

        // Check age
        const daysAgo = (Date.now() - new Date(event.date).getTime()) / 86400000;
        if (daysAgo > MAX_AGE_DAYS) {
          console.log(
            `[WBO] Reached ${event.date} (${Math.round(daysAgo)}d ago), stopping`,
          );
          stopScraping = true;
          break;
        }
      }
      if (stopScraping) break;
    }

    console.log(`[WBO] Page ${pageNum}: ${posts.length} posts → ${pageEvents} events`);

    // Rate limit between pages
    if (pageNum > endPage && !stopScraping) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Merge with existing data
  if (existingCombos && !forceRescrape) {
    const newDates = new Set(allEvents.map((e) => `${e.date}:${e.name}`));
    const oldEvents = existingCombos.events.filter(
      (e) => !newDates.has(`${e.date}:${e.name}`),
    );
    console.log(
      `[WBO] Merging: ${allEvents.length} new + ${oldEvents.length} existing`,
    );
    allEvents = [...allEvents, ...oldEvents];
  }

  // Sort newest first + deduplicate
  allEvents.sort((a, b) => b.date.localeCompare(a.date));
  const seen = new Set<string>();
  allEvents = allEvents.filter((e) => {
    const key = `${e.date}:${e.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Save raw combo data
  const totalCombos = allEvents.reduce(
    (s, e) => s + e.placements.reduce((ps, p) => ps + p.combos.length, 0),
    0,
  );

  const comboData: WboComboData = {
    scrapedAt: new Date().toISOString(),
    threadUrl: `${WBO_BASE}/${THREAD_SLUG}`,
    pagesScraped,
    totalEvents: allEvents.length,
    events: allEvents,
  };

  const tmpCombo = `${COMBOS_PATH}.tmp`;
  writeFileSync(tmpCombo, JSON.stringify(comboData, null, 2), 'utf-8');
  renameSync(tmpCombo, COMBOS_PATH);
  console.log(`[WBO] Saved ${allEvents.length} events (${totalCombos} combos) to ${COMBOS_PATH}`);

  // Load previous meta for position changes
  let previousMeta: WboMetaData | null = null;
  if (existsSync(META_PATH)) {
    try {
      previousMeta = JSON.parse(readFileSync(META_PATH, 'utf-8'));
    } catch { /* ignore */ }
  }

  // Calculate meta for each period
  const now = new Date();
  const periods: Record<string, PeriodData> = {};

  for (const [key, days] of Object.entries(PERIODS)) {
    periods[key] = calculateMeta(allEvents, days, now, previousMeta?.periods?.[key]);
    const pd = periods[key];
    const partCount = pd.categories.reduce((s, c) => s + c.components.length, 0);
    console.log(
      `[WBO] ${key}: ${pd.metadata.eventsScanned} events, ${partCount} parts, ${pd.topCombos.length} top combos`,
    );
  }

  // Save meta
  const metaData: WboMetaData = {
    scrapedAt: new Date().toISOString(),
    dataSource: 'wbo',
    periods,
  };

  const tmpMeta = `${META_PATH}.tmp`;
  writeFileSync(tmpMeta, JSON.stringify(metaData, null, 2), 'utf-8');
  renameSync(tmpMeta, META_PATH);
  console.log(`[WBO] Meta saved to ${META_PATH}`);

  // Summary
  console.log('\n[WBO] ═══════════════════════════════════');
  console.log(`[WBO] Events: ${allEvents.length}`);
  console.log(`[WBO] Combos: ${totalCombos}`);
  console.log(`[WBO] Pages scraped: ${pagesScraped}`);

  for (const [key, pd] of Object.entries(periods)) {
    const topBlade = pd.categories.find((c) => c.category === 'Blade')?.components[0];
    const topBit = pd.categories.find((c) => c.category === 'Bit')?.components[0];
    const topCombo = pd.topCombos[0];
    console.log(`[WBO] ─── ${key} ───`);
    console.log(`[WBO]   Events: ${pd.metadata.eventsScanned}, Parts: ${pd.metadata.partsAnalyzed}`);
    if (topBlade) console.log(`[WBO]   #1 Blade: ${topBlade.name} (${topBlade.score})`);
    if (topBit) console.log(`[WBO]   #1 Bit: ${topBit.name} (${topBit.score})`);
    if (topCombo) {
      console.log(
        `[WBO]   #1 Combo: ${topCombo.blade} ${topCombo.ratchet} ${topCombo.bit}${topCombo.assistBlade ? ` ${topCombo.assistBlade}` : ''} (score: ${topCombo.score}, used: ${topCombo.usage}x)`,
      );
    }
  }
}

main().catch((error) => {
  console.error('[WBO] Fatal error:', error);
  process.exit(1);
});
