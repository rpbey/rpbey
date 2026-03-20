/**
 * Scrape EN episode titles for Metal Masters, Metal Fury, and Original Beyblade
 * These use continuous numbering on EN Wikipedia, so we need an offset.
 *
 * Usage: pnpm tsx scripts/scrape-episode-titles-en.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface EpisodeInfo {
  number: number;
  title: string;
  titleJp?: string;
  synopsis?: string;
}

interface SourceConfig {
  page: string;
  slug: string;
  offset: number; // Subtract from wiki episode number to get our episode number
}

const SOURCES: SourceConfig[] = [
  { page: 'Beyblade:_Metal_Fusion', slug: 'metal-fight-beyblade', offset: 0 },
  { page: 'Beyblade:_Metal_Masters', slug: 'metal-fight-beyblade-baku', offset: 51 },
  { page: 'Beyblade:_Metal_Fury', slug: 'metal-fight-beyblade-4d', offset: 102 },
];

function cleanWiki(text: string): string {
  return text
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\[\[[^\]]*\|([^\]]*)\]\]/g, '$1')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/''+/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/<ref[^/]*\/>/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .trim();
}

async function scrapeEN(page: string): Promise<EpisodeInfo[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&redirects=1`;
  const res = await fetch(url);
  const data = (await res.json()) as { parse?: { wikitext: { '*': string } } };
  if (!data.parse) return [];

  const text = data.parse.wikitext['*'];
  const episodes: EpisodeInfo[] = [];

  const templateRegex = /\{\{Episode list([\s\S]*?)\}\}/gi;
  let match: RegExpExecArray | null;

  while ((match = templateRegex.exec(text)) !== null) {
    const content = match[1]!;

    const getField = (name: string): string | undefined => {
      const r = new RegExp(`\\|\\s*${name}\\s*=\\s*(.+?)(?=\\n\\s*\\||$)`, 'is');
      const m = r.exec(content);
      return m ? cleanWiki(m[1]!).trim() || undefined : undefined;
    };

    const numStr = getField('EpisodeNumber');
    if (!numStr) continue;
    const number = parseInt(numStr, 10);
    if (Number.isNaN(number)) continue;

    const title = getField('Title');
    if (!title) continue;

    episodes.push({
      number,
      title,
      titleJp: getField('NativeTitle') || getField('RTitle'),
      synopsis: getField('ShortSummary'),
    });
  }

  return episodes;
}

async function main() {
  console.log('📖 Scraping EN episode titles for Metal series...\n');

  let totalUpdated = 0;

  for (const src of SOURCES) {
    console.log(`  📄 ${src.page} → ${src.slug} (offset: -${src.offset})`);

    const episodes = await scrapeEN(src.page);
    if (episodes.length === 0) {
      console.log('     ⚠ No episodes found\n');
      continue;
    }
    console.log(`     Found ${episodes.length} episodes (wiki #${episodes[0]!.number}-${episodes[episodes.length - 1]!.number})`);

    const series = await prisma.animeSeries.findUnique({ where: { slug: src.slug } });
    if (!series) {
      console.log('     ⚠ Series not in DB\n');
      continue;
    }

    let updated = 0;
    for (const ep of episodes) {
      const ourNumber = ep.number - src.offset;
      if (ourNumber < 1) continue;

      const existing = await prisma.animeEpisode.findUnique({
        where: { seriesId_number: { seriesId: series.id, number: ourNumber } },
      });
      if (!existing) continue;

      const updateData: Record<string, string> = {};

      // EN title as main title
      if (existing.title === `Episode ${ourNumber}`) {
        updateData.title = ep.title;
      }

      // Japanese title
      if (ep.titleJp && !existing.titleJp) {
        updateData.titleJp = ep.titleJp;
      }

      // Synopsis
      if (ep.synopsis && !existing.synopsis) {
        // Truncate to 500 chars
        updateData.synopsis = ep.synopsis.length > 500
          ? `${ep.synopsis.substring(0, 497)}...`
          : ep.synopsis;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.animeEpisode.update({
          where: { id: existing.id },
          data: updateData,
        });
        updated++;
      }
    }

    console.log(`     ✓ ${updated} episodes updated\n`);
    totalUpdated += updated;
  }

  console.log(`✅ Done! ${totalUpdated} episodes updated.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
