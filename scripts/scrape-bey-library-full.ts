/**
 * Full scraper for bey-library.vercel.app
 * Scrapes ALL categories: blade, over-blade, assist-blade, ratchet, bit, other, x-over
 * Downloads images and builds a complete JSON database.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://bey-library.vercel.app';
const CONCURRENCY = 10;
const OUTPUT_DIR = 'data/bey-library';
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const DELAY_MS = 300;

const ALL_CATEGORIES = [
  'blade',
  'over-blade',
  'assist-blade',
  'ratchet',
  'bit',
  'other',
  'x-over',
] as const;

type Category = (typeof ALL_CATEGORIES)[number];

interface PartVariant {
  name: string;
  imageUrl: string;
  localImagePath: string;
}

interface PartData {
  id: string;
  category: Category;
  name: string;
  code: string;
  specs: Record<string, string>;
  imageUrl: string;
  localImagePath: string;
  variants: PartVariant[];
  sourceUrl: string;
}

fs.mkdirSync(IMAGES_DIR, { recursive: true });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        },
      });
      if (res.ok) return res;
      if (res.status === 429) {
        console.warn(`  Rate limited, waiting ${(i + 1) * 2}s...`);
        await sleep((i + 1) * 2000);
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(1000);
    }
  }
  throw new Error('Unreachable');
}

async function downloadImage(
  url: string,
  filename: string,
): Promise<string | null> {
  if (!url) return null;
  const fullUrl = url.startsWith('http')
    ? url
    : `${BASE_URL}${encodeURI(url)}`;
  const filePath = path.join(IMAGES_DIR, filename);

  if (await Bun.file(filePath).exists() && fs.statSync(filePath).size > 0) {
    return `images/${filename}`;
  }

  try {
    const res = await fetchWithRetry(fullUrl);
    const fileStream = fs.createWriteStream(filePath);
    // @ts-ignore
    await finished(Readable.fromWeb(res.body).pipe(fileStream));
    return `images/${filename}`;
  } catch (err) {
    console.error(`  Image error ${fullUrl}:`, (err as Error).message);
    return null;
  }
}

function sanitizeFilename(str: string): string {
  return str
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

async function scrapeProductPage(
  url: string,
  category: Category,
): Promise<PartData | null> {
  try {
    const res = await fetchWithRetry(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const name = $('h1').first().text().trim();
    if (!name) return null;

    const code =
      $('h1')
        .first()
        .nextAll('p')
        .filter((_, el) => $(el).text().trim().startsWith('B') || $(el).text().trim().startsWith('U') || $(el).text().trim().startsWith('C'))
        .first()
        .text()
        .trim() || '';

    // Main image
    let imgUrl = '';
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (
        src.includes('/Blade/') ||
        src.includes('/Ratchet/') ||
        src.includes('/Bit/') ||
        src.includes('/Over') ||
        src.includes('/Assist') ||
        src.includes('/Other/') ||
        src.includes('/X-Over/') ||
        src.includes('/Collab/')
      ) {
        if (!imgUrl) imgUrl = src;
      }
    });

    // Specs
    const specs: Record<string, string> = {};
    // Pattern 1: grid with label/value spans
    $('span.text-muted-foreground').each((_, el) => {
      const label = $(el).text().trim();
      const value = $(el).parent().find('span.font-medium').text().trim();
      if (label && value && label !== value) {
        specs[label] = value;
      }
    });
    // Pattern 2: flex col with dt/dd or similar
    if (Object.keys(specs).length === 0) {
      $('dt, .label').each((_, el) => {
        const label = $(el).text().trim();
        const value = $(el).next().text().trim();
        if (label && value) specs[label] = value;
      });
    }

    const id = url.split('/').pop() || name;
    const safeId = sanitizeFilename(`${category}-${code || id}-${name}`);

    // Download main image
    let localImagePath = '';
    if (imgUrl) {
      const ext = path.extname(imgUrl.split('?')[0]) || '.webp';
      const filename = `${safeId}${ext}`;
      const result = await downloadImage(imgUrl, filename);
      localImagePath = result || '';
    }

    // Variants
    const variants: PartVariant[] = [];
    const variantImages = new Set<string>();
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      if (
        src &&
        src !== imgUrl &&
        !variantImages.has(src) &&
        (src.includes('/Blade/') ||
          src.includes('/Ratchet/') ||
          src.includes('/Bit/') ||
          src.includes('/Over') ||
          src.includes('/Assist') ||
          src.includes('/Other/') ||
          src.includes('/X-Over/') ||
          src.includes('/Collab/'))
      ) {
        variantImages.add(src);
        const vIdx = variants.length + 1;
        const vFilename = `${safeId}_v${vIdx}${path.extname(src.split('?')[0]) || '.webp'}`;
        variants.push({
          name: alt || `Variant ${vIdx}`,
          imageUrl: src,
          localImagePath: `images/${vFilename}`,
        });
      }
    });

    // Download variant images (no await to speed up, fire and forget within chunk)
    for (const v of variants) {
      downloadImage(v.imageUrl, path.basename(v.localImagePath));
    }

    return {
      id,
      category,
      name,
      code,
      specs,
      imageUrl: imgUrl,
      localImagePath,
      variants,
      sourceUrl: url,
    };
  } catch (error) {
    console.error(`  Error scraping ${url}:`, (error as Error).message);
    return null;
  }
}

async function getCategoryLinks(category: Category): Promise<string[]> {
  const url = `${BASE_URL}/category/${category}`;
  console.log(`\nScanning category: ${category}...`);

  const res = await fetchWithRetry(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const links = new Set<string>();

  // Find all product links
  $('a[href*="/product/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      links.add(`${BASE_URL}${href}`);
    }
  });

  // Also parse from RSC payload (Next.js inline data)
  const rscMatches = html.match(/\/product\/[^"\\]+/g);
  if (rscMatches) {
    for (const m of rscMatches) {
      links.add(`${BASE_URL}${m}`);
    }
  }

  console.log(`  Found ${links.size} product links.`);
  return Array.from(links).sort();
}

async function main() {
  console.log('=== bey-library.vercel.app Full Scraper ===\n');
  console.log(`Categories: ${ALL_CATEGORIES.join(', ')}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Delay: ${DELAY_MS}ms\n`);

  const allParts: PartData[] = [];
  const stats: Record<string, number> = {};

  for (const cat of ALL_CATEGORIES) {
    const links = await getCategoryLinks(cat);
    stats[cat] = 0;

    for (let i = 0; i < links.length; i += CONCURRENCY) {
      const chunk = links.slice(i, i + CONCURRENCY);
      const promises = chunk.map((link) => scrapeProductPage(link, cat));
      const results = await Promise.all(promises);

      for (const p of results) {
        if (p) {
          allParts.push(p);
          stats[cat]++;
          process.stdout.write('.');
        }
      }

      if (i + CONCURRENCY < links.length) {
        await sleep(DELAY_MS);
      }
    }
    console.log(`\n  ${cat}: ${stats[cat]} parts scraped.`);
  }

  // Save full database
  const jsonPath = path.join(OUTPUT_DIR, 'bey-library-full.json');
  await Bun.write(jsonPath, JSON.stringify(allParts, null, 2));

  // Also save a lightweight index (no variants, for API)
  const index = allParts.map((p) => ({
    id: p.id,
    category: p.category,
    name: p.name,
    code: p.code,
    type: p.specs['Type'] || null,
    spin: p.specs['Spin'] || null,
    weight: p.specs['Weight'] || null,
    imageUrl: p.imageUrl,
    localImagePath: p.localImagePath,
    variantCount: p.variants.length,
  }));
  const indexPath = path.join(OUTPUT_DIR, 'bey-library-index.json');
  await Bun.write(indexPath, JSON.stringify(index, null, 2));

  console.log('\n=== Done! ===');
  console.log(`Total: ${allParts.length} parts`);
  console.log('Breakdown:', stats);
  console.log(`Full data: ${jsonPath}`);
  console.log(`Index: ${indexPath}`);
}

main().catch(console.error);
