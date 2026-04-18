/**
 * Scraper streaming-espace.fr → RPB Anime Database
 *
 * Scrape toutes les séries Beyblade, épisodes et sources vidéo
 * depuis streaming-espace.fr et les importe dans la base de données.
 *
 * Usage: pnpm tsx scripts/scrape-anime.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BASE_URL = 'https://www.streaming-espace.fr';
const DELAY_MS = 800; // politeness delay between requests

// ─── Mapping streaming-espace → our database slugs ─────────────────────────

interface SeasonMapping {
  /** Path on streaming-espace.fr, e.g. "/bakuten/saison1" */
  path: string;
  /** Our AnimeSeries slug */
  slug: string;
  /** Languages to scrape */
  languages: string[];
  /** Episode offset (for multi-season series mapped to one entry) */
  episodeOffset: number;
}

const SEASON_MAP: SeasonMapping[] = [
  // ── Bakuten (Original) ──
  { path: '/bakuten/saison1', slug: 'bakuten-shoot-beyblade', languages: ['vostfr', 'vf'], episodeOffset: 0 },
  { path: '/bakuten/saison2', slug: 'beyblade-v-force', languages: ['vostfr', 'vf'], episodeOffset: 0 },
  { path: '/bakuten/saison3', slug: 'beyblade-g-revolution', languages: ['vostfr', 'vf'], episodeOffset: 0 },

  // ── Metal Fight ──
  { path: '/metal/saison1', slug: 'metal-fight-beyblade', languages: ['vostfr', 'vf'], episodeOffset: 0 },
  { path: '/metal/saison2', slug: 'metal-fight-beyblade-baku', languages: ['vostfr', 'vf'], episodeOffset: 0 },
  { path: '/metal/saison3', slug: 'metal-fight-beyblade-4d', languages: ['vostfr', 'vf'], episodeOffset: 0 },
  { path: '/metal/saison4', slug: 'beyblade-shogun-steel', languages: ['vostfr', 'vf'], episodeOffset: 0 },

  // ── Burst ──
  { path: '/burst/saison1', slug: 'beyblade-burst', languages: ['vostfr', 'vf'], episodeOffset: 0 },
  { path: '/burst/saison2', slug: 'beyblade-burst-god', languages: ['vostfr', 'vf'], episodeOffset: 0 },
  { path: '/burst/saison3', slug: 'beyblade-burst-chouzetsu', languages: ['vostfr', 'vf'], episodeOffset: 0 },
  { path: '/burst/saison4', slug: 'beyblade-burst-gt', languages: ['vostfr', 'vf'], episodeOffset: 0 },
  { path: '/burst/saison5', slug: 'beyblade-burst-superking', languages: ['vostfr', 'vf'], episodeOffset: 0 },
  { path: '/burst/saison6', slug: 'beyblade-burst-db', languages: ['vostfr', 'vf'], episodeOffset: 0 },

  // ── X (3 saisons sur le site → 1 série chez nous, offset épisodes) ──
  { path: '/x/saison1', slug: 'beyblade-x', languages: ['vostfr', 'vf'], episodeOffset: 0 },
  { path: '/x/saison2', slug: 'beyblade-x', languages: ['vostfr', 'vf'], episodeOffset: 26 },
  { path: '/x/saison3', slug: 'beyblade-x', languages: ['vostfr'], episodeOffset: 52 },
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface EpisodeLink {
  name: string;
  link: string;
}

interface EpisodeData {
  episode: number;
  multi?: boolean;
  link?: string;
  links?: EpisodeLink[];
  dllink?: string;
}

interface ScrapedEpisode {
  number: number;
  sources: Array<{
    name: string;
    url: string;
    type: 'YOUTUBE' | 'DAILYMOTION' | 'MP4' | 'HLS' | 'IFRAME';
  }>;
  downloadUrl?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function detectSourceType(url: string): 'YOUTUBE' | 'DAILYMOTION' | 'MP4' | 'HLS' | 'IFRAME' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YOUTUBE';
  if (url.includes('dailymotion.com')) return 'DAILYMOTION';
  if (url.endsWith('.mp4')) return 'MP4';
  if (url.endsWith('.m3u8')) return 'HLS';
  return 'IFRAME';
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// ─── Episode list scraper ───────────────────────────────────────────────────

async function scrapeEpisodeList(seasonPath: string, lang: string): Promise<number[]> {
  const url = `${BASE_URL}${seasonPath}-${lang}`;
  console.log(`    📋 Fetching episode list: ${url}`);

  const html = await fetchPage(url);

  const episodes: number[] = [];
  let match: RegExpExecArray | null;

  // Extract episode numbers from relative links like href="saison1-vostfr/3"
  const seasonFile = seasonPath.split('/').pop(); // "saison1"
  const relativePattern = new RegExp(`href="${seasonFile}-${lang}/(\\d+)"`, 'g');
  while ((match = relativePattern.exec(html)) !== null) {
    const num = parseInt(match[1]!, 10);
    if (!episodes.includes(num)) episodes.push(num);
  }

  // Also try full path pattern
  if (episodes.length === 0) {
    const fullPattern = new RegExp(`${seasonPath.replace(/\//g, '\\/')}-${lang}/(\\d+)`, 'g');
    while ((match = fullPattern.exec(html)) !== null) {
      const num = parseInt(match[1]!, 10);
      if (!episodes.includes(num)) episodes.push(num);
    }
  }

  // Also try simple numeric href patterns like href="1"
  if (episodes.length === 0) {
    const simplePattern = /href="(\d+)"/g;
    while ((match = simplePattern.exec(html)) !== null) {
      const num = parseInt(match[1]!, 10);
      if (num > 0 && num <= 200 && !episodes.includes(num)) episodes.push(num);
    }
  }

  episodes.sort((a, b) => a - b);
  return episodes;
}

// ─── Episode data scraper ───────────────────────────────────────────────────

function extractEpisodeData(html: string): EpisodeData | null {
  // Pattern 1: Next.js serialized data — episodeData in React props
  // Look for JSON-like structures with "episode" and "link"/"links"
  const patterns = [
    // Multi-source: {"episode":5,"multi":true,"links":[...],"dllink":"..."}
    /\{"episode":\d+,"multi":true,"links":\[.*?\](?:,"dllink":"[^"]*")?\}/g,
    // Single source: {"episode":1,"link":"..."}
    /\{"episode":\d+,"link":"[^"]*"\}/g,
  ];

  for (const pattern of patterns) {
    const matches = html.match(pattern);
    if (matches) {
      for (const m of matches) {
        try {
          const data = JSON.parse(m) as EpisodeData;
          if (data.episode != null) return data;
        } catch {
          // Try unescaping
          try {
            const unescaped = m.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            const data = JSON.parse(unescaped) as EpisodeData;
            if (data.episode != null) return data;
          } catch {
            continue;
          }
        }
      }
    }
  }

  // Pattern 2: escaped JSON in Next.js flight data
  const escapedPattern = /\\?"episode\\?":\s*(\d+).*?\\?"link(?:s)?\\?":\s*(\[.*?\]|\\?"[^"]*\\?")/g;
  const escapedMatch = escapedPattern.exec(html);
  if (escapedMatch) {
    try {
      // Reconstruct JSON from captured groups
      const epNum = parseInt(escapedMatch[1]!, 10);
      const linksRaw = escapedMatch[2]!;

      if (linksRaw.startsWith('[')) {
        const links = JSON.parse(linksRaw.replace(/\\"/g, '"')) as EpisodeLink[];
        return { episode: epNum, multi: true, links };
      } else {
        const link = linksRaw.replace(/\\?"/g, '');
        return { episode: epNum, link };
      }
    } catch {
      // Fall through
    }
  }

  // Pattern 3: search for known video URLs directly in HTML
  // Decode &amp; to & for matching
  const decoded = html.replace(/&amp;/g, '&');
  const videoUrls: EpisodeLink[] = [];

  const sibnetMatch = decoded.match(/video\.sibnet\.ru\/(?:shell\.php\?videoid=|video)(\d+)/);
  if (sibnetMatch) {
    videoUrls.push({
      name: 'Sibnet',
      link: `https://video.sibnet.ru/shell.php?videoid=${sibnetMatch[1]}`,
    });
  }

  const vidmolyMatch = decoded.match(/vidmoly\.net\/embed-([a-z0-9]+)\.html/);
  if (vidmolyMatch) {
    videoUrls.push({
      name: 'VidMoly',
      link: `https://vidmoly.net/embed-${vidmolyMatch[1]}.html`,
    });
  }

  const vkMatch = decoded.match(/vk\.com\/video_ext\.php\?oid=(-?\d+)&id=(\d+)&hd=(\d)/);
  if (vkMatch) {
    videoUrls.push({
      name: 'VK Video',
      link: `https://vk.com/video_ext.php?oid=${vkMatch[1]}&id=${vkMatch[2]}&hd=${vkMatch[3]}`,
    });
  }

  const dmMatch = decoded.match(/dailymotion\.com\/embed\/video\/([a-z0-9]+)/);
  if (dmMatch) {
    videoUrls.push({
      name: 'Dailymotion',
      link: `https://www.dailymotion.com/embed/video/${dmMatch[1]}`,
    });
  }

  const ytMatch = decoded.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    videoUrls.push({
      name: 'YouTube',
      link: `https://www.youtube.com/embed/${ytMatch[1]}`,
    });
  }

  if (videoUrls.length > 0) {
    // Extract download link
    const dlMatch = decoded.match(/drive\.google\.com\/uc\?export=download&id=([a-zA-Z0-9_-]+)/);
    const dllink = dlMatch ? `https://drive.google.com/uc?export=download&id=${dlMatch[1]}` : undefined;

    return {
      episode: 0, // Will be set by caller
      multi: videoUrls.length > 1,
      links: videoUrls,
      dllink,
    };
  }

  return null;
}

async function scrapeEpisode(
  seasonPath: string,
  lang: string,
  episodeNum: number,
): Promise<ScrapedEpisode | null> {
  const url = `${BASE_URL}${seasonPath}-${lang}/${episodeNum}`;

  try {
    const html = await fetchPage(url);
    const data = extractEpisodeData(html);

    if (!data) {
      console.log(`      ⚠ No video data found for EP ${episodeNum}`);
      return null;
    }

    const sources: ScrapedEpisode['sources'] = [];

    if (data.links && data.links.length > 0) {
      for (const link of data.links) {
        sources.push({
          name: link.name,
          url: link.link,
          type: detectSourceType(link.link),
        });
      }
    } else if (data.link) {
      sources.push({
        name: 'Lecteur',
        url: data.link,
        type: detectSourceType(data.link),
      });
    }

    return {
      number: episodeNum,
      sources,
      downloadUrl: data.dllink,
    };
  } catch (err) {
    console.log(`      ✗ Failed EP ${episodeNum}: ${(err as Error).message}`);
    return null;
  }
}

// ─── Database import ────────────────────────────────────────────────────────

async function importEpisode(
  seriesId: string,
  episodeNumber: number,
  scraped: ScrapedEpisode,
  language: string,
) {
  // Upsert episode
  const episode = await prisma.animeEpisode.upsert({
    where: {
      seriesId_number: { seriesId, number: episodeNumber },
    },
    create: {
      seriesId,
      number: episodeNumber,
      title: `Episode ${episodeNumber}`,
      isPublished: true,
    },
    update: {},
  });

  // Add sources (skip duplicates by checking URL)
  for (let i = 0; i < scraped.sources.length; i++) {
    const src = scraped.sources[i]!;
    const langLabel = language.toUpperCase();

    // Check if this exact URL already exists for this episode
    const existing = await prisma.animeEpisodeSource.findFirst({
      where: {
        episodeId: episode.id,
        url: src.url,
      },
    });

    if (!existing) {
      await prisma.animeEpisodeSource.create({
        data: {
          episodeId: episode.id,
          type: src.type,
          url: src.type === 'YOUTUBE' ? (extractYouTubeId(src.url) || src.url) : src.url,
          quality: '720p',
          language: langLabel,
          priority: scraped.sources.length - i, // First source = highest priority
          isActive: true,
        },
      });
    }
  }

  // Add Google Drive download as a source too
  if (scraped.downloadUrl) {
    const existing = await prisma.animeEpisodeSource.findFirst({
      where: {
        episodeId: episode.id,
        url: scraped.downloadUrl,
      },
    });

    if (!existing) {
      await prisma.animeEpisodeSource.create({
        data: {
          episodeId: episode.id,
          type: 'MP4',
          url: scraped.downloadUrl,
          quality: '1080p',
          language: language.toUpperCase(),
          priority: 0, // Lowest priority (download, not streaming)
          isActive: true,
        },
      });
    }
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎬 Scraper streaming-espace.fr → RPB Anime Database\n');

  let totalEpisodes = 0;
  let totalSources = 0;

  for (const mapping of SEASON_MAP) {
    // Find our series in DB
    const series = await prisma.animeSeries.findUnique({
      where: { slug: mapping.slug },
    });

    if (!series) {
      console.log(`⚠ Series not found in DB: ${mapping.slug}, skipping`);
      continue;
    }

    console.log(`\n🔵 ${series.titleFr || series.title} (${mapping.path})`);

    for (const lang of mapping.languages) {
      console.log(`  🌐 Language: ${lang.toUpperCase()}`);

      try {
        // Get episode list
        const episodeNumbers = await scrapeEpisodeList(mapping.path, lang);
        console.log(`    Found ${episodeNumbers.length} episodes`);

        if (episodeNumbers.length === 0) {
          console.log('    ⚠ No episodes found, skipping');
          continue;
        }

        await sleep(DELAY_MS);

        // Scrape each episode
        for (const epNum of episodeNumbers) {
          const actualEpNum = epNum + mapping.episodeOffset;

          const scraped = await scrapeEpisode(mapping.path, lang, epNum);
          if (scraped) {
            await importEpisode(series.id, actualEpNum, scraped, lang);
            totalEpisodes++;
            totalSources += scraped.sources.length + (scraped.downloadUrl ? 1 : 0);
            process.stdout.write(`      ✓ EP ${actualEpNum} (${scraped.sources.length} sources)\n`);
          }

          await sleep(DELAY_MS);
        }
      } catch (err) {
        console.log(`    ✗ Error: ${(err as Error).message}`);
      }
    }
  }

  console.log(`\n✅ Scraping terminé!`);
  console.log(`   ${totalEpisodes} épisodes importés`);
  console.log(`   ${totalSources} sources vidéo ajoutées`);
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
