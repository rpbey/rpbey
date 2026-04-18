/**
 * Fix duplicate gacha card images by finding season-specific alternatives
 * via the Fandom MediaWiki API (bypasses Fandom's HTML 403 blocking).
 *
 * Usage: pnpm tsx scripts/fix-gacha-duplicates.ts [--dry-run]
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import pg from 'pg';
import sharp from 'sharp';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes('--dry-run');

// ── Fandom API helpers (anti-blocking) ──────────────────────────────

const FANDOM_API = 'https://beyblade.fandom.com/api.php';

const HEADERS = {
  'User-Agent': 'RPBDashboard/1.0 (rpbey.fr; bot; beyblade wiki image sync)',
  Accept: 'application/json',
};

/** Query the MediaWiki API with automatic retry */
async function fandomApi(
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const url = new URL(FANDOM_API);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('format', 'json');

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url.toString(), { headers: HEADERS });
      if (!res.ok) {
        console.warn(`  ⚠ API returned ${res.status}, retrying...`);
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return (await res.json()) as Record<string, unknown>;
    } catch (e) {
      console.warn(`  ⚠ Fetch error: ${(e as Error).message}, retrying...`);
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error(`Failed to query Fandom API: ${url.toString()}`);
}

/** Search for character images in the File: namespace */
async function searchCharacterImages(
  characterName: string,
): Promise<string[]> {
  const data = await fandomApi({
    action: 'query',
    list: 'search',
    srsearch: characterName,
    srnamespace: '6', // File: namespace
    srlimit: '50',
  });
  const search = (data.query as Record<string, unknown>)?.search as
    | Array<{ title: string }>
    | undefined;
  return search?.map((r) => r.title) || [];
}

/** Get images used on a specific wiki page */
async function getPageImages(pageTitle: string): Promise<string[]> {
  const data = await fandomApi({
    action: 'query',
    titles: pageTitle,
    prop: 'images',
    imlimit: '50',
  });
  const pages = (data.query as Record<string, unknown>)
    ?.pages as Record<string, { images?: Array<{ title: string }> }>;
  if (!pages) return [];
  return Object.values(pages).flatMap(
    (p) => p.images?.map((i) => i.title) || [],
  );
}

/** Resolve File: titles to full CDN URLs */
async function resolveImageUrls(
  fileTitles: string[],
): Promise<Record<string, string>> {
  if (fileTitles.length === 0) return {};
  const result: Record<string, string> = {};

  // API supports up to 50 titles at once
  for (let i = 0; i < fileTitles.length; i += 50) {
    const batch = fileTitles.slice(i, i + 50);
    const data = await fandomApi({
      action: 'query',
      titles: batch.join('|'),
      prop: 'imageinfo',
      iiprop: 'url|size|mime',
    });
    const pages = (data.query as Record<string, unknown>)
      ?.pages as Record<
      string,
      {
        title?: string;
        imageinfo?: Array<{ url: string; width: number; height: number; mime: string }>;
      }
    >;
    if (!pages) continue;
    for (const page of Object.values(pages)) {
      if (page.title && page.imageinfo?.[0]) {
        const info = page.imageinfo[0];
        // Only keep character renders (not tiny icons or huge screenshots)
        if (info.width >= 150 && info.height >= 200) {
          result[page.title] = info.url;
        }
      }
    }
  }
  return result;
}

/** Check if an image URL is accessible and looks like a character render */
async function validateImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: HEADERS });
    if (!res.ok) return false;
    const contentType = res.headers.get('content-type') || '';
    return contentType.startsWith('image/');
  } catch {
    return false;
  }
}

/** Normalize a Fandom image URL to a consistent CDN format */
function normalizeUrl(url: string, targetWidth = 600): string {
  // Remove any existing scale-to-width or crop params
  const base = url.replace(/\/revision\/latest.*$/, '');
  return `${base}/revision/latest/scale-to-width-down/${targetWidth}`;
}

// ── Season-specific image mapping ───────────────────────────────────
// Manually curated from Fandom API results: each season gets a unique image.

interface ImageFix {
  slug: string;
  series: string;
  wikiPage: string;
  preferredFiles: string[]; // Ordered by preference
  fallbackUrl?: string; // Direct URL if known
}

const IMAGE_FIXES: ImageFix[] = [
  // ── Gingka Hagane ──
  {
    slug: 'gingka-fusion',
    series: 'METAL_FUSION',
    wikiPage: 'Gingka_Hagane',
    preferredFiles: ['File:Gingka.png'],
    fallbackUrl:
      'https://static.wikia.nocookie.net/beyblade/images/2/2d/Gingka.png/revision/latest/scale-to-width-down/600',
  },
  {
    slug: 'gingka-masters',
    series: 'METAL_MASTERS',
    wikiPage: 'Gingka_Hagane',
    preferredFiles: ['File:Gingka Masters Galaxy.png'],
    fallbackUrl:
      'https://static.wikia.nocookie.net/beyblade/images/0/00/Gingka_Masters_Galaxy.png/revision/latest/scale-to-width-down/600',
  },
  {
    slug: 'gingka-fury',
    series: 'METAL_FURY',
    wikiPage: 'Gingka_Hagane',
    preferredFiles: ['File:GingkaHaganeShogunSteel.png'],
    fallbackUrl:
      'https://static.wikia.nocookie.net/beyblade/images/5/5f/GingkaHaganeShogunSteel.png/revision/latest/scale-to-width-down/600',
  },

  // ── Ryuga ──
  {
    slug: 'ryuga-fusion',
    series: 'METAL_FUSION',
    wikiPage: 'Ryuga',
    preferredFiles: ['File:RyugaLDragoDestroy.png', 'File:Ryuga.JPG'],
    fallbackUrl:
      'https://static.wikia.nocookie.net/beyblade/images/0/09/RyugaLDragoDestroy.png/revision/latest/scale-to-width-down/600',
  },
  {
    slug: 'ryuga-masters',
    series: 'METAL_MASTERS',
    wikiPage: 'Ryuga',
    preferredFiles: ['File:Ryuga metal masters2.png'],
    fallbackUrl:
      'https://static.wikia.nocookie.net/beyblade/images/e/eb/Ryuga_metal_masters2.png/revision/latest/scale-to-width-down/600',
  },
  // ryuga-fury keeps current image (Ryuga_Trans.png) - that's the canonical 4D/Fury render

  // ── Kyoya Tategami ──
  // kyoya-fusion keeps current image (Kyoya_Tategami_Trans.png) - that's the Metal Fusion render
  {
    slug: 'kyoya-masters',
    series: 'METAL_MASTERS',
    wikiPage: 'Kyoya_Tategami',
    preferredFiles: ['File:Kyoya MFury.png'],
    fallbackUrl:
      'https://static.wikia.nocookie.net/beyblade/images/c/c7/Kyoya_MFury.png/revision/latest/scale-to-width-down/600',
  },
  {
    slug: 'kyoya-fury',
    series: 'METAL_FURY',
    wikiPage: 'Kyoya_Tategami',
    preferredFiles: ['File:Kyoya Metal Fury.png'],
    fallbackUrl:
      'https://static.wikia.nocookie.net/beyblade/images/2/2f/Kyoya_Metal_Fury.png/revision/latest/scale-to-width-down/600',
  },

  // ── Doji ──
  // doji-fusion keeps current image (DojiAnimeUpdated.jpg) - that's the original
  {
    slug: 'doji-fury',
    series: 'METAL_FURY',
    wikiPage: 'Doji',
    preferredFiles: ['File:Daidouji.png', 'File:Doji.png'],
    fallbackUrl:
      'https://static.wikia.nocookie.net/beyblade/images/c/c6/Daidouji.png/revision/latest/scale-to-width-down/600',
  },
];

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('🎴 Fixing duplicate gacha card images...\n');
  if (DRY_RUN) console.log('  (DRY RUN - no changes will be made)\n');

  // First, show current duplicates
  const allCards = await prisma.gachaCard.findMany({
    select: { slug: true, name: true, series: true, imageUrl: true },
    orderBy: { series: 'asc' },
  });

  // Detect duplicates by base URL
  const byBaseUrl = new Map<string, typeof allCards>();
  for (const card of allCards) {
    if (!card.imageUrl) continue;
    const base = card.imageUrl.replace(/\/revision\/latest.*$/, '');
    const group = byBaseUrl.get(base) || [];
    group.push(card);
    byBaseUrl.set(base, group);
  }

  const duplicates = [...byBaseUrl.entries()].filter(([, cards]) => cards.length > 1);
  console.log(`  Found ${duplicates.length} duplicate image groups:\n`);
  for (const [, cards] of duplicates) {
    const names = cards.map((c) => `${c.name} (${c.series})`).join(', ');
    console.log(`  📋 ${names}`);
  }
  console.log();

  // Apply fixes
  let fixed = 0;
  for (const fix of IMAGE_FIXES) {
    const card = allCards.find((c) => c.slug === fix.slug);
    if (!card) {
      console.log(`  ⚠ Card "${fix.slug}" not found, skipping`);
      continue;
    }

    console.log(`  🔍 ${card.name} (${fix.series})...`);

    let newUrl: string | null = null;

    // Try to resolve preferred files via API
    try {
      const resolved = await resolveImageUrls(fix.preferredFiles);
      for (const file of fix.preferredFiles) {
        if (resolved[file]) {
          const url = normalizeUrl(resolved[file]);
          if (await validateImage(url)) {
            newUrl = url;
            console.log(`    ✓ Found via API: ${file}`);
            break;
          }
        }
      }
    } catch (e) {
      console.warn(`    ⚠ API lookup failed: ${(e as Error).message}`);
    }

    // Fallback to hardcoded URL
    if (!newUrl && fix.fallbackUrl) {
      if (await validateImage(fix.fallbackUrl)) {
        newUrl = fix.fallbackUrl;
        console.log(`    ✓ Using fallback URL`);
      }
    }

    if (!newUrl) {
      console.log(`    ✗ No valid image found, skipping`);
      continue;
    }

    // Check it's actually different from current
    const currentBase = card.imageUrl?.replace(/\/revision\/latest.*$/, '') || '';
    const newBase = newUrl.replace(/\/revision\/latest.*$/, '');
    if (currentBase === newBase) {
      console.log(`    ○ Already using a unique image`);
      continue;
    }

    if (!DRY_RUN) {
      await prisma.gachaCard.update({
        where: { slug: fix.slug },
        data: { imageUrl: newUrl },
      });
    }
    console.log(
      `    ${DRY_RUN ? '🔵 Would update' : '✅ Updated'}: ${newUrl.split('/').slice(-2, -1)[0]}`,
    );
    fixed++;
  }

  console.log(`\n${DRY_RUN ? '🔵' : '✅'} ${fixed} cartes ${DRY_RUN ? 'à mettre à jour' : 'mises à jour'}.`);

  // Final duplicate check
  if (!DRY_RUN && fixed > 0) {
    const updatedCards = await prisma.gachaCard.findMany({
      select: { slug: true, name: true, series: true, imageUrl: true },
    });
    const stillDup = new Map<string, string[]>();
    for (const c of updatedCards) {
      if (!c.imageUrl) continue;
      const base = c.imageUrl.replace(/\/revision\/latest.*$/, '');
      const group = stillDup.get(base) || [];
      group.push(`${c.name} (${c.series})`);
      stillDup.set(base, group);
    }
    const remaining = [...stillDup.values()].filter((g) => g.length > 1);
    if (remaining.length > 0) {
      console.log(`\n⚠ Remaining duplicates:`);
      for (const group of remaining) console.log(`  ${group.join(', ')}`);
    } else {
      console.log('\n🎉 Aucun doublon restant !');
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
