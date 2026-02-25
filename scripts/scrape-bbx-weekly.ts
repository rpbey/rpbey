import 'dotenv/config';
import { writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'data', 'bbx-weekly.json');

const BASE_URL = 'https://bbxweekly.com';
const PERIODS = ['2weeks', '4weeks'] as const;

interface SynergyItem {
  name: string;
  score: number;
}

interface ComponentData {
  name: string;
  score: number;
  position_change: number | 'NEW';
  synergy: SynergyItem[];
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

interface PeriodData {
  metadata: PeriodMetadata;
  categories: CategoryData[];
}

interface BbxWeeklyData {
  scrapedAt: string;
  periods: {
    '2weeks': PeriodData;
    '4weeks': PeriodData;
  };
}

function parseRSCData(rscChunks: string[]): {
  categories: CategoryData[];
  metadata: PeriodMetadata;
} {
  const categories: CategoryData[] = [];
  const metadata: PeriodMetadata = {
    dataSource: 'bbxweekly.com',
    weekId: '',
    startDate: '',
    endDate: '',
    eventsScanned: 0,
    partsAnalyzed: 0,
  };

  const stream = rscChunks.join('');

  // Extract category data: "category":"<name>","components":[...]
  const categoryRegex =
    /"category":"(Blade|Ratchet|Bit|Lock Chip|Assist Blade)","components":\[/g;
  let match;
  const categoryPositions: { name: string; start: number }[] = [];

  while ((match = categoryRegex.exec(stream)) !== null) {
    categoryPositions.push({
      name: match[1],
      start: match.index + match[0].length,
    });
  }

  for (const cat of categoryPositions) {
    let depth = 1;
    let pos = cat.start;
    while (pos < stream.length && depth > 0) {
      if (stream[pos] === '[') depth++;
      if (stream[pos] === ']') depth--;
      pos++;
    }

    const componentsJson = stream.substring(cat.start - 1, pos);
    try {
      const components = JSON.parse(componentsJson);
      if (Array.isArray(components)) {
        categories.push({
          category: cat.name,
          components: components.map((c: Record<string, unknown>) => ({
            name: String(c.name || ''),
            score: Number(c.score || 0),
            position_change:
              c.position_change === 'NEW'
                ? 'NEW'
                : Number(c.position_change || 0),
            synergy: Array.isArray(c.synergy)
              ? c.synergy.map((s: Record<string, unknown>) => ({
                  name: String(s.name || ''),
                  score: Number(s.score || 0),
                }))
              : [],
          })),
        });
      }
    } catch {
      console.warn(`[BBX] Failed to parse components for ${cat.name}`);
    }
  }

  // Extract metadata from RSC stream cards
  const weekIdMatch = stream.match(
    /"Week ID"[\s\S]*?"children":"(\d{4}-W\d{2})"/,
  );
  if (weekIdMatch) metadata.weekId = weekIdMatch[1];

  const startDateMatch = stream.match(
    /"Start Date"[\s\S]*?"children":"(\d{4}-\d{2}-\d{2})"/,
  );
  if (startDateMatch) metadata.startDate = startDateMatch[1];

  const endDateMatch = stream.match(
    /"End Date"[\s\S]*?"children":"(\d{4}-\d{2}-\d{2})"/,
  );
  if (endDateMatch) metadata.endDate = endDateMatch[1];

  // Try multiple patterns for events scanned (string or number children)
  const eventsMatch =
    stream.match(/"Event(?:s)? Scanned"[\s\S]*?"children":"(\d+)"/) ||
    stream.match(/"Event(?:s)? Scanned"[\s\S]*?"children":(\d+)/) ||
    stream.match(/Event(?:s)? Scanned[\s\S]{0,200}?(\d{2,})/);
  if (eventsMatch) metadata.eventsScanned = parseInt(eventsMatch[1], 10);

  // Try multiple patterns for parts analyzed (string or number children)
  const partsMatch =
    stream.match(/"Parts Analyzed"[\s\S]*?"children":"(\d+)"/) ||
    stream.match(/"Parts Analyzed"[\s\S]*?"children":(\d+)/) ||
    stream.match(/Parts Analyzed[\s\S]{0,200}?(\d{2,})/);
  if (partsMatch) metadata.partsAnalyzed = parseInt(partsMatch[1], 10);

  return { categories, metadata };
}

async function waitForContent(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newPage']>>,
  maxWait = 60000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      const text = await page.evaluate(
        () => document.body?.innerText?.substring(0, 300) || '',
      );
      if (text.includes('BBX WEEKLY') || text.includes('Meta Ranking')) {
        return true;
      }
    } catch {
      // Context destroyed during navigation
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

async function scrapePeriod(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newPage']>>,
  period: string,
): Promise<PeriodData> {
  const url = `${BASE_URL}/${period}`;
  console.log(`[BBX] Scraping ${url}...`);

  await page.goto(url, { waitUntil: 'load', timeout: 60000 });

  const resolved = await waitForContent(page);
  if (!resolved) {
    console.warn(`[BBX] Timeout waiting for content on ${period}`);
    return {
      metadata: {
        dataSource: `bbxweekly.com/${period}`,
        weekId: '',
        startDate: '',
        endDate: '',
        eventsScanned: 0,
        partsAnalyzed: 0,
      },
      categories: [],
    };
  }

  console.log(`[BBX] Content loaded for ${period}`);
  await new Promise((r) => setTimeout(r, 1000));

  // Extract RSC payload chunks
  const rscChunks = await page.evaluate(() => {
    const chunks: string[] = [];
    document.querySelectorAll('script').forEach((script) => {
      const text = script.textContent || '';
      if (text.includes('self.__next_f')) {
        const regex =
          /self\.__next_f\.push\(\[\d+,"((?:[^"\\]|\\.)*)"\]\)/g;
        let m;
        while ((m = regex.exec(text)) !== null) {
          chunks.push(
            m[1]
              .replace(/\\"/g, '"')
              .replace(/\\n/g, '\n')
              .replace(/\\\\/g, '\\'),
          );
        }
      }
    });
    return chunks;
  });

  console.log(`[BBX] Extracted ${rscChunks.length} RSC chunks for ${period}`);

  const { categories, metadata } = parseRSCData(rscChunks);
  metadata.dataSource = `bbxweekly.com/${period}`;

  // Fallback: extract events/parts from visible page text if RSC parsing missed them
  if (metadata.eventsScanned === 0 || metadata.partsAnalyzed === 0) {
    try {
      const pageText = await page.evaluate(() => document.body?.innerText || '');
      if (metadata.eventsScanned === 0) {
        const evMatch = pageText.match(/Event(?:s)?\s*Scanned\s*(\d+)/i);
        if (evMatch) metadata.eventsScanned = parseInt(evMatch[1], 10);
      }
      if (metadata.partsAnalyzed === 0) {
        const paMatch = pageText.match(/Parts?\s*Analyzed\s*(\d+)/i);
        if (paMatch) metadata.partsAnalyzed = parseInt(paMatch[1], 10);
      }
    } catch {
      // Page context may be unavailable
    }
  }

  console.log(
    `[BBX] ${period}: ${categories.length} categories, ${categories.reduce((s, c) => s + c.components.length, 0)} components`,
  );
  console.log(
    `[BBX] ${period} metadata: week=${metadata.weekId}, events=${metadata.eventsScanned}, parts=${metadata.partsAnalyzed}`,
  );

  return { metadata, categories };
}

async function main() {
  console.log('[BBX] Starting BBX Weekly scrape...');

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

  const browser = await chromium.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
    });

    const page = await context.newPage();

    // Visit homepage first to solve Vercel challenge
    console.log('[BBX] Solving Vercel challenge on homepage...');
    await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
    const challengeResolved = await waitForContent(page);
    if (!challengeResolved) {
      console.warn('[BBX] Failed to solve Vercel challenge');
    }

    const results: Record<string, PeriodData> = {};

    for (const period of PERIODS) {
      results[period] = await scrapePeriod(page, period);
    }

    await context.close();

    const data: BbxWeeklyData = {
      scrapedAt: new Date().toISOString(),
      periods: {
        '2weeks': results['2weeks'],
        '4weeks': results['4weeks'],
      },
    };

    const tmpPath = `${OUTPUT_PATH}.tmp`;
    writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    renameSync(tmpPath, OUTPUT_PATH);

    const total2w = data.periods['2weeks'].categories.reduce(
      (s, c) => s + c.components.length,
      0,
    );
    const total4w = data.periods['4weeks'].categories.reduce(
      (s, c) => s + c.components.length,
      0,
    );

    console.log(`[BBX] Scrape complete!`);
    console.log(`[BBX] Output: ${OUTPUT_PATH}`);
    console.log(
      `[BBX] 2weeks: ${data.periods['2weeks'].categories.length} categories, ${total2w} parts`,
    );
    console.log(
      `[BBX] 4weeks: ${data.periods['4weeks'].categories.length} categories, ${total4w} parts`,
    );
    console.log(`[BBX] Total: ${total2w + total4w} components`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('[BBX] Fatal error:', error);
  process.exit(1);
});
