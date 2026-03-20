'use server';

import { prisma } from '@/lib/prisma';

export async function getAnimeSeries() {
  return prisma.animeSeries.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getAnimeSeriesByGeneration() {
  const series = await prisma.animeSeries.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: 'asc' },
  });

  const grouped: Record<string, typeof series> = {};
  for (const s of series) {
    if (!grouped[s.generation]) grouped[s.generation] = [];
    grouped[s.generation]?.push(s);
  }
  return grouped;
}

export async function getAnimeSeriesBySlug(slug: string) {
  return prisma.animeSeries.findUnique({
    where: { slug },
    include: {
      episodes: {
        where: { isPublished: true },
        orderBy: { number: 'asc' },
        include: {
          sources: {
            where: { isActive: true },
            orderBy: { priority: 'desc' },
          },
        },
      },
    },
  });
}

export async function getAnimeEpisode(slug: string, episodeNumber: number) {
  const series = await prisma.animeSeries.findUnique({
    where: { slug },
  });

  if (!series) return null;

  const episode = await prisma.animeEpisode.findUnique({
    where: {
      seriesId_number: {
        seriesId: series.id,
        number: episodeNumber,
      },
    },
    include: {
      sources: {
        where: { isActive: true },
        orderBy: { priority: 'desc' },
      },
      series: true,
    },
  });

  if (!episode) return null;

  // Get prev/next episodes
  const [prev, next] = await Promise.all([
    prisma.animeEpisode.findFirst({
      where: {
        seriesId: series.id,
        number: { lt: episodeNumber },
        isPublished: true,
      },
      orderBy: { number: 'desc' },
      select: { number: true, title: true, titleFr: true },
    }),
    prisma.animeEpisode.findFirst({
      where: {
        seriesId: series.id,
        number: { gt: episodeNumber },
        isPublished: true,
      },
      orderBy: { number: 'asc' },
      select: { number: true, title: true, titleFr: true },
    }),
  ]);

  return { episode, series, prev, next };
}

export async function getFeaturedAnimeSeries() {
  return prisma.animeSeries.findMany({
    where: {
      isPublished: true,
      bannerUrl: { not: null },
    },
    orderBy: { sortOrder: 'asc' },
    take: 5,
  });
}

export async function searchAnime(query: string) {
  const [series, episodes] = await Promise.all([
    prisma.animeSeries.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { titleFr: { contains: query, mode: 'insensitive' } },
          { titleJp: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    }),
    prisma.animeEpisode.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { titleFr: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { series: { select: { slug: true, title: true } } },
      take: 10,
    }),
  ]);
  return { series, episodes };
}

// Admin actions
export async function getAllAnimeSeries() {
  return prisma.animeSeries.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { episodes: true } },
    },
  });
}

export async function getAnimeSeriesById(id: string) {
  return prisma.animeSeries.findUnique({
    where: { id },
    include: {
      episodes: {
        orderBy: { number: 'asc' },
        include: {
          sources: { orderBy: { priority: 'desc' } },
          _count: { select: { sources: true } },
        },
      },
    },
  });
}

export async function upsertAnimeSeries(data: {
  id?: string;
  slug: string;
  title: string;
  titleJp?: string;
  titleFr?: string;
  generation: 'ORIGINAL' | 'METAL' | 'BURST' | 'X';
  synopsis?: string;
  posterUrl?: string;
  bannerUrl?: string;
  year: number;
  episodeCount: number;
  sortOrder: number;
  isPublished: boolean;
}) {
  const { id, ...rest } = data;
  if (id) {
    return prisma.animeSeries.update({ where: { id }, data: rest });
  }
  return prisma.animeSeries.create({ data: rest });
}

export async function deleteAnimeSeries(id: string) {
  return prisma.animeSeries.delete({ where: { id } });
}

export async function upsertAnimeEpisode(data: {
  id?: string;
  seriesId: string;
  number: number;
  title: string;
  titleFr?: string;
  titleJp?: string;
  synopsis?: string;
  thumbnailUrl?: string;
  duration: number;
  isPublished: boolean;
}) {
  const { id, ...rest } = data;
  if (id) {
    return prisma.animeEpisode.update({ where: { id }, data: rest });
  }
  return prisma.animeEpisode.create({ data: rest });
}

export async function deleteAnimeEpisode(id: string) {
  return prisma.animeEpisode.delete({ where: { id } });
}

export async function upsertAnimeSource(data: {
  id?: string;
  episodeId: string;
  type: 'YOUTUBE' | 'DAILYMOTION' | 'MP4' | 'HLS' | 'IFRAME';
  url: string;
  quality: string;
  language: string;
  priority: number;
  isActive: boolean;
}) {
  const { id, ...rest } = data;
  if (id) {
    return prisma.animeEpisodeSource.update({ where: { id }, data: rest });
  }
  return prisma.animeEpisodeSource.create({ data: rest });
}

export async function deleteAnimeSource(id: string) {
  return prisma.animeEpisodeSource.delete({ where: { id } });
}

export async function bulkImportEpisodes(
  seriesId: string,
  episodes: Array<{
    number: number;
    title: string;
    titleFr?: string;
    duration?: number;
  }>,
) {
  const results = [];
  for (const ep of episodes) {
    const result = await prisma.animeEpisode.upsert({
      where: {
        seriesId_number: { seriesId, number: ep.number },
      },
      create: {
        seriesId,
        number: ep.number,
        title: ep.title,
        titleFr: ep.titleFr,
        duration: ep.duration ?? 0,
      },
      update: {
        title: ep.title,
        titleFr: ep.titleFr,
        duration: ep.duration ?? 0,
      },
    });
    results.push(result);
  }
  return results;
}
