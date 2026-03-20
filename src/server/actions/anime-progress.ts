'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
}

export async function getUserContinueWatching() {
  const user = await getSessionUser();
  if (!user) return [];

  return prisma.animeWatchProgress.findMany({
    where: {
      userId: user.id,
      status: 'IN_PROGRESS',
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: {
      episode: {
        include: {
          series: {
            select: { slug: true, title: true, posterUrl: true },
          },
        },
      },
    },
  });
}

export async function getSeriesProgress(seriesId: string) {
  const user = await getSessionUser();
  if (!user) return {};

  const progress = await prisma.animeWatchProgress.findMany({
    where: {
      userId: user.id,
      episode: { seriesId },
    },
  });

  const map: Record<
    string,
    { status: string; progressTime: number; episodeId: string }
  > = {};
  for (const p of progress) {
    map[p.episodeId] = {
      status: p.status,
      progressTime: p.progressTime,
      episodeId: p.episodeId,
    };
  }
  return map;
}

export async function getEpisodeProgress(episodeId: string) {
  const user = await getSessionUser();
  if (!user) return null;

  return prisma.animeWatchProgress.findUnique({
    where: {
      userId_episodeId: {
        userId: user.id,
        episodeId,
      },
    },
  });
}

export async function updateWatchProgress(
  episodeId: string,
  progressTime: number,
  duration: number,
) {
  const user = await getSessionUser();
  if (!user) return null;

  const isCompleted = duration > 0 && progressTime / duration > 0.9;

  return prisma.animeWatchProgress.upsert({
    where: {
      userId_episodeId: {
        userId: user.id,
        episodeId,
      },
    },
    create: {
      userId: user.id,
      episodeId,
      progressTime: Math.floor(progressTime),
      status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: isCompleted ? new Date() : null,
    },
    update: {
      progressTime: Math.floor(progressTime),
      status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: isCompleted ? new Date() : null,
    },
  });
}
