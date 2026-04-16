import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { MetaPartPreview } from '@/components/marketing';
import type { TournamentShowcaseItem } from '@/components/marketing/TournamentShowcase';
import { prisma } from '@/lib/prisma';
import { getContent } from '@/server/actions/cms';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const CATEGORY_ORDER = ['Blade', 'Ratchet', 'Bit'];
const TOP_PER_CATEGORY = 3;

const MANUAL_MAPPINGS: Record<string, string> = {
  blast: 'pegasusblast',
  shark: 'sharkedge',
  wizardrod: 'wizardrod',
  heavy: 'hheavy',
  wheel: 'wwheel',
  bumper: 'bbumper',
  charge: 'ccharge',
  assault: 'aassault',
  dual: 'ddual',
  erase: 'eerase',
  slash: 'sslash',
  round: 'rround',
  turn: 'tturn',
  jaggy: 'jjaggy',
  zillion: 'zzillion',
  free: 'ffree',
  level: 'l',
  ball: 'b',
  taper: 't',
  needle: 'n',
  flat: 'f',
  rush: 'r',
  point: 'p',
  orb: 'o',
  spike: 's',
  jolt: 'j',
  kick: 'k',
  quattro: 'q',
};

function normalizeName(name: string): string {
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return MANUAL_MAPPINGS[norm] || norm;
}

async function getTopMetaParts(): Promise<MetaPartPreview[]> {
  try {
    const filePath = join(process.cwd(), 'data', 'bbx-weekly.json');
    const raw = await readFile(filePath, 'utf-8');
    const data = JSON.parse(raw) as {
      periods: {
        '4weeks': {
          categories: {
            category: string;
            components: {
              name: string;
              score: number;
              position_change: number | 'NEW';
              imageUrl?: string;
            }[];
          }[];
        };
      };
    };

    const period = data.periods['4weeks'];
    if (!period?.categories) return [];

    // Fetch part images from DB
    const dbParts = await prisma.part.findMany({
      select: { name: true, imageUrl: true },
    });
    const imageMap = new Map<string, string>();
    for (const p of dbParts) {
      if (p.imageUrl) {
        imageMap.set(normalizeName(p.name), p.imageUrl);
      }
    }

    const results: MetaPartPreview[] = [];

    for (const catName of CATEGORY_ORDER) {
      const category = period.categories.find((c) => c.category === catName);
      if (!category?.components) continue;

      const top = category.components.slice(0, TOP_PER_CATEGORY);
      for (const comp of top) {
        const normName = normalizeName(comp.name);
        results.push({
          name: comp.name,
          score: comp.score,
          category: catName,
          imageUrl: comp.imageUrl || imageMap.get(normName) || null,
          position_change: comp.position_change,
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

const BTS_EDITIONS = [
  {
    id: 'bts3',
    file: 'B_TS3.json',
    name: 'Bey-Tamashii Séries #3',
    date: '2026-03-01',
    poster: '/tournaments/BTS3_poster.webp',
    fallbackCount: 73,
  },
  {
    id: 'bts2',
    file: 'B_TS2.json',
    name: 'Bey-Tamashii Séries #2',
    date: '2026-02-08',
    poster: '/tournaments/BTS2.webp',
    fallbackCount: 60,
  },
  {
    id: 'bts1',
    file: 'B_TS1.json',
    name: 'Bey-Tamashii Séries #1',
    date: '2026-01-11',
    poster: '/tournaments/BTS1_poster.webp',
    fallbackCount: 69,
  },
];

function getBtsTournaments(): TournamentShowcaseItem[] {
  const exportDir = join(process.cwd(), 'data/exports');
  const cards: TournamentShowcaseItem[] = [];
  for (const edition of BTS_EDITIONS) {
    try {
      const data = JSON.parse(
        readFileSync(join(exportDir, edition.file), 'utf-8'),
      );
      const participants = data.participants || [];
      const podium = participants
        .filter((p: { rank: number }) => p.rank <= 3)
        .sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank)
        .map(
          (p: {
            name: string;
            rank: number;
            exactWins?: number;
            exactLosses?: number;
          }) => ({
            name: p.name.replace(/✅|✔️/g, '').trim(),
            rank: p.rank,
            wins: p.exactWins || 0,
            losses: p.exactLosses || 0,
          }),
        );
      cards.push({
        id: edition.id,
        name: edition.name,
        date: edition.date,
        poster: edition.poster,
        participants: data.participantsCount || edition.fallbackCount,
        matchesCount: data.matchesCount || 0,
        podium,
      });
    } catch {
      /* skip */
    }
  }
  return cards;
}

export default async function HomePage() {
  const [activeTournament, heroContent, rankings, metaParts, recentVideos] =
    await Promise.all([
      prisma.tournament.findFirst({
        where: {
          status: {
            in: ['UNDERWAY', 'CHECKIN', 'REGISTRATION_OPEN'],
          },
          challongeUrl: { not: null },
        },
        orderBy: { date: 'desc' },
        select: {
          id: true,
          challongeUrl: true,
          name: true,
          standings: true,
          stations: true,
          activityLog: true,
        },
      }),
      getContent('home-hero-text'),
      prisma.globalRanking.findMany({
        where: {
          points: { gt: 0 },
          playerName: { notIn: ['Yoyo', 'Loteux', '𝓡𝓟𝓑 | LOTTEUX!'] },
        },
        take: 20,
        orderBy: [
          { points: 'desc' },
          { tournamentWins: 'desc' },
          { wins: 'desc' },
          { playerName: 'asc' },
        ],
        include: {
          user: {
            include: {
              _count: {
                select: { tournaments: true },
              },
            },
          },
        },
      }),
      getTopMetaParts(),
      prisma.youTubeVideo
        .findMany({
          where: { isFeatured: true, channelId: 'UCHiDwWI-2uQrsUiJhXt6rng' },
          orderBy: { publishedAt: 'desc' },
          take: 12,
          select: {
            id: true,
            title: true,
            channelName: true,
            channelAvatar: true,
            thumbnail: true,
            views: true,
            duration: true,
            publishedAt: true,
          },
        })
        .then((vids) =>
          vids.map((v) => ({
            ...v,
            videoId: v.id,
            publishedAt: v.publishedAt.toISOString(),
          })),
        )
        .catch(() => []),
    ]);

  const btsTournaments = getBtsTournaments();

  // Add next upcoming BTS tournament at the front of the list
  const nextBts = await prisma.tournament.findFirst({
    where: {
      name: { contains: 'BEY-TAMASHII', mode: 'insensitive' },
      status: { in: ['UPCOMING', 'REGISTRATION_OPEN', 'CHECKIN', 'UNDERWAY'] },
    },
    orderBy: { date: 'asc' },
    select: { id: true, name: true, date: true, location: true, challongeUrl: true },
  });

  if (nextBts) {
    const edition = nextBts.name.match(/#(\d+)/)?.[1];
    btsTournaments.unshift({
      id: nextBts.id,
      name: nextBts.name,
      date: nextBts.date.toISOString(),
      poster: edition ? `/tournaments/BTS${edition}_poster.webp` : '/logo.webp',
      participants: 0,
      matchesCount: 0,
      podium: [],
    });
  }

  return (
    <HomeClient
      activeTournament={activeTournament}
      heroContent={heroContent?.content}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      topRankings={rankings as any}
      metaParts={metaParts}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentVideos={recentVideos as any}
      tournaments={btsTournaments}
    />
  );
}
