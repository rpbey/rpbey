/**
 * Scrape episode titles and descriptions from Wikipedia FR + EN
 * Supports two wiki formats:
 *   1. {{Épisode anime}} templates (Metal Fusion, etc.)
 *   2. Wikitable rows (Beyblade X, Burst, etc.)
 *
 * Usage: pnpm tsx scripts/scrape-episode-titles.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface EpisodeInfo {
  number: number;
  titleFr?: string;
  titleJp?: string;
  title?: string;
  synopsis?: string;
}

interface WikiSource {
  lang: 'fr' | 'en';
  page: string;
  slug: string;
  seasonFilter?: string;
}

const WIKI_SOURCES: WikiSource[] = [
  // ── FR: Metal series (uses {{Épisode anime}} template) ──
  { lang: 'fr', page: 'Liste_des_épisodes_de_Beyblade:_Metal_Fusion', slug: 'metal-fight-beyblade', seasonFilter: 'Saison 1|Metal Fusion' },
  { lang: 'fr', page: 'Liste_des_épisodes_de_Beyblade:_Metal_Fusion', slug: 'metal-fight-beyblade-baku', seasonFilter: 'Saison 2|Metal Masters' },
  { lang: 'fr', page: 'Liste_des_épisodes_de_Beyblade:_Metal_Fusion', slug: 'metal-fight-beyblade-4d', seasonFilter: 'Saison 3|Metal Fury' },
  { lang: 'fr', page: 'Liste_des_épisodes_de_Beyblade:_Metal_Fusion', slug: 'beyblade-shogun-steel', seasonFilter: 'Saison 4|Shogun|Zero' },

  // ── FR: Burst (uses {{Épisode anime}} or wikitable) ──
  { lang: 'fr', page: 'Liste_des_épisodes_de_Beyblade_Burst', slug: 'beyblade-burst', seasonFilter: 'Saison 1' },
  { lang: 'fr', page: 'Liste_des_épisodes_de_Beyblade_Burst', slug: 'beyblade-burst-god', seasonFilter: 'Saison 2|God|Evolution' },
  { lang: 'fr', page: 'Liste_des_épisodes_de_Beyblade_Burst', slug: 'beyblade-burst-chouzetsu', seasonFilter: 'Saison 3|Chouzetsu|Turbo' },
  { lang: 'fr', page: 'Liste_des_épisodes_de_Beyblade_Burst', slug: 'beyblade-burst-gt', seasonFilter: 'Saison 4|GT|Gachi|Rise' },
  { lang: 'fr', page: 'Liste_des_épisodes_de_Beyblade_Burst', slug: 'beyblade-burst-superking', seasonFilter: 'Saison 5|Superking|Surge|Sparking' },
  { lang: 'fr', page: 'Liste_des_épisodes_de_Beyblade_Burst', slug: 'beyblade-burst-db', seasonFilter: 'Saison 6|Dynamite|QuadDrive' },

  // ── FR: X (wikitable) ──
  { lang: 'fr', page: 'Liste_des_épisodes_de_Beyblade_X', slug: 'beyblade-x' },

  // ── EN: Original series (fallback) ──
  { lang: 'en', page: 'List_of_Beyblade_episodes', slug: 'bakuten-shoot-beyblade', seasonFilter: 'Season 1|Bakuten' },
  { lang: 'en', page: 'List_of_Beyblade_episodes', slug: 'beyblade-v-force', seasonFilter: 'Season 2|V.?Force' },
  { lang: 'en', page: 'List_of_Beyblade_episodes', slug: 'beyblade-g-revolution', seasonFilter: 'Season 3|G.?Revolution' },

  // ── EN: supplements for series missing FR data ──
  { lang: 'en', page: 'List_of_Beyblade_X_episodes', slug: 'beyblade-x' },
  { lang: 'en', page: 'List_of_Beyblade:_Shogun_Steel_episodes', slug: 'beyblade-shogun-steel' },
];

// ── Wiki API ──

async function fetchWikitext(lang: 'fr' | 'en', page: string): Promise<string> {
  const encoded = encodeURIComponent(page);
  const url = `https://${lang}.wikipedia.org/w/api.php?action=parse&page=${encoded}&prop=wikitext&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { parse?: { wikitext: { '*': string } }; error?: { info: string } };
  if (!data.parse) throw new Error(`Page not found: ${page}`);
  return data.parse.wikitext['*'];
}

// ── Clean wiki markup ──

function cleanWikiText(text: string): string {
  return text
    .replace(/\{\{[^}]*\}\}/g, '')          // {{templates}}
    .replace(/\[\[[^\]]*\|([^\]]*)\]\]/g, '$1') // [[link|text]]
    .replace(/\[\[([^\]]*)\]\]/g, '$1')       // [[text]]
    .replace(/''+/g, '')                       // ''italic''
    .replace(/<[^>]+>/g, '')                   // <html>
    .replace(/<ref[^/]*\/>/g, '')              // <ref/>
    .replace(/<ref[^>]*>.*?<\/ref>/gs, '')     // <ref>...</ref>
    .trim();
}

// ── Parser 1: {{Épisode anime}} templates ──

function parseEpisodeAnimeTemplates(wikitext: string, seasonFilter?: string): EpisodeInfo[] {
  // First, filter to the right section if needed
  let text = wikitext;
  if (seasonFilter) {
    const filterRegex = new RegExp(seasonFilter, 'i');
    const sections = wikitext.split(/(?===[^=]+=={2,3})/);
    const matched = sections.filter((s) => {
      const header = s.match(/^=+([^=]+)=+/);
      return header && filterRegex.test(header[1]!);
    });
    if (matched.length > 0) text = matched.join('\n');
  }

  const episodes: EpisodeInfo[] = [];
  const templateRegex = /\{\{Épisode anime([\s\S]*?)\}\}/gi;
  let match: RegExpExecArray | null;

  while ((match = templateRegex.exec(text)) !== null) {
    const content = match[1]!;

    const getField = (name: string): string | undefined => {
      const fieldRegex = new RegExp(`\\|\\s*${name}\\s*=\\s*(.+?)(?=\\n\\s*\\||$)`, 'is');
      const m = fieldRegex.exec(content);
      return m ? cleanWikiText(m[1]!).trim() || undefined : undefined;
    };

    const numStr = getField('NumeroEpisode') || getField('EpisodeNumber');
    if (!numStr) continue;
    const number = parseInt(numStr, 10);
    if (Number.isNaN(number) || number <= 0) continue;

    episodes.push({
      number,
      titleFr: getField('TitreFrançais') || getField('TitreFrancais'),
      titleJp: getField('TitreKanji'),
      title: getField('Title') || getField('TitreAnglais'),
      synopsis: getField('CourtResume') || getField('ShortSummary'),
    });
  }

  return episodes;
}

// ── Parser 2: Wikitable rows ──

function parseWikitableRows(wikitext: string, seasonFilter?: string): EpisodeInfo[] {
  let text = wikitext;
  if (seasonFilter) {
    const filterRegex = new RegExp(seasonFilter, 'i');
    const sections = wikitext.split(/(?==={2,3}[^=]+=={2,3})/);
    const matched = sections.filter((s) => filterRegex.test(s.substring(0, 200)));
    if (matched.length > 0) text = matched.join('\n');
  }

  const episodes: EpisodeInfo[] = [];
  // Split by row separator
  const rows = text.split(/\|-/);

  for (const row of rows) {
    // Extract all cells (lines starting with |)
    const cells: string[] = [];
    for (const line of row.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && !trimmed.startsWith('|-') && !trimmed.startsWith('|+') && !trimmed.startsWith('|}') && !trimmed.startsWith('|{')) {
        // Remove leading | and style attributes
        let content = trimmed.substring(1).replace(/^\s*style="[^"]*"\s*\|/i, '').trim();
        content = cleanWikiText(content);
        if (content) cells.push(content);
      }
    }

    if (cells.length < 3) continue;

    // Find episode number (first pure number cell)
    let epNum: number | null = null;
    let titleFr: string | undefined;
    let titleJp: string | undefined;

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]!;

      // Episode number
      if (epNum === null && /^\d{1,3}$/.test(cell)) {
        epNum = parseInt(cell, 10);
        continue;
      }

      // Skip if we don't have a number yet
      if (epNum === null) continue;

      // Japanese title (contains kanji/kana)
      if (/[\u3000-\u9fff\uff00-\uffef]/.test(cell) && cell.length > 1 && !titleJp) {
        titleJp = cell;
        continue;
      }

      // French/English title (not a date, not a number)
      if (
        !titleFr &&
        cell.length > 1 &&
        !/^\d/.test(cell) &&
        !/^(rowspan|colspan|style|class|width|align)/i.test(cell) &&
        !/^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i.test(cell) &&
        !/^(january|february|march|april|may|june|july|august|september|october|november|december)/i.test(cell)
      ) {
        titleFr = cell;
      }
    }

    if (epNum !== null && epNum > 0 && (titleFr || titleJp)) {
      episodes.push({ number: epNum, titleFr, titleJp });
    }
  }

  // Deduplicate
  const seen = new Set<number>();
  return episodes.filter((ep) => {
    if (seen.has(ep.number)) return false;
    seen.add(ep.number);
    return true;
  });
}

// ── Combined parser ──

function parseEpisodes(wikitext: string, seasonFilter?: string): EpisodeInfo[] {
  // Try template format first
  const fromTemplates = parseEpisodeAnimeTemplates(wikitext, seasonFilter);
  if (fromTemplates.length > 0) return fromTemplates;

  // Fallback to wikitable
  return parseWikitableRows(wikitext, seasonFilter);
}

// ── DB update ──

async function updateEpisodes(slug: string, episodes: EpisodeInfo[], lang: 'fr' | 'en') {
  const series = await prisma.animeSeries.findUnique({ where: { slug } });
  if (!series) {
    console.log(`    ⚠ Series not found: ${slug}`);
    return 0;
  }

  let updated = 0;
  for (const ep of episodes) {
    const existing = await prisma.animeEpisode.findUnique({
      where: { seriesId_number: { seriesId: series.id, number: ep.number } },
    });
    if (!existing) continue;

    const updateData: Record<string, string> = {};

    if (lang === 'fr') {
      if (ep.titleFr && (!existing.titleFr || existing.titleFr === existing.title)) {
        updateData.titleFr = ep.titleFr;
      }
      if (ep.titleJp && !existing.titleJp) {
        updateData.titleJp = ep.titleJp;
      }
      if (ep.synopsis && !existing.synopsis) {
        updateData.synopsis = ep.synopsis;
      }
    }

    if (lang === 'en') {
      if ((ep.titleFr || ep.title) && existing.title === `Episode ${ep.number}`) {
        updateData.title = ep.titleFr || ep.title || existing.title;
      }
      if (ep.titleJp && !existing.titleJp) {
        updateData.titleJp = ep.titleJp;
      }
      if (ep.synopsis && !existing.synopsis) {
        updateData.synopsis = ep.synopsis;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.animeEpisode.update({
        where: { id: existing.id },
        data: updateData,
      });
      updated++;
    }
  }

  return updated;
}

// ── Main ──

async function main() {
  console.log('📖 Scraping episode titles from Wikipedia FR + EN...\n');

  let totalUpdated = 0;
  const processedPages = new Set<string>();

  for (const source of WIKI_SOURCES) {
    const cacheKey = `${source.lang}:${source.page}`;
    console.log(`  📄 ${source.lang.toUpperCase()}: ${source.page}`);
    console.log(`     → ${source.slug}${source.seasonFilter ? ` (${source.seasonFilter})` : ''}`);

    try {
      const wikitext = await fetchWikitext(source.lang, source.page);
      processedPages.add(cacheKey);

      const episodes = parseEpisodes(wikitext, source.seasonFilter);

      if (episodes.length === 0) {
        console.log(`     ⚠ No episodes parsed\n`);
        continue;
      }

      console.log(`     Found ${episodes.length} episodes`);
      for (const ep of episodes.slice(0, 2)) {
        const t = ep.titleFr || ep.title || '?';
        const jp = ep.titleJp ? ` (${ep.titleJp.substring(0, 20)}...)` : '';
        const syn = ep.synopsis ? ' [+synopsis]' : '';
        console.log(`       EP ${ep.number}: ${t}${jp}${syn}`);
      }
      if (episodes.length > 2) console.log(`       ... +${episodes.length - 2} more`);

      const updated = await updateEpisodes(source.slug, episodes, source.lang);
      totalUpdated += updated;
      console.log(`     ✓ ${updated} episodes updated\n`);
    } catch (err) {
      console.log(`     ✗ ${(err as Error).message}\n`);
    }
  }

  console.log(`✅ Done! ${totalUpdated} episodes updated with titles/synopsis.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
