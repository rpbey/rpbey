'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

export async function getCurrentSeason() {
  const season = await prisma.rankingSeason.findFirst({
    where: { isActive: true },
  });
  return season;
}

export async function getSeasons() {
  return await prisma.rankingSeason.findMany({
    orderBy: { startDate: 'desc' },
  });
}

export async function createSeason(name: string, slug: string) {
  // Deactivate current season if exists
  await prisma.rankingSeason.updateMany({
    where: { isActive: true },
    data: { isActive: false, endDate: new Date() },
  });

  const season = await prisma.rankingSeason.create({
    data: {
      name,
      slug,
      isActive: true,
      startDate: new Date(),
    },
  });

  revalidatePath('/admin/rankings');
  return season;
}

export async function archiveCurrentSeason(nextSeasonName: string, nextSeasonSlug: string) {
  const currentSeason = await getCurrentSeason();

  if (!currentSeason) {
    throw new Error("Aucune saison active à archiver.");
  }

  // 1. Snapshot profiles to SeasonEntry
  const profiles = await prisma.profile.findMany({
    where: { rankingPoints: { gt: 0 } },
  });

  // Batch insert entries
  // Note: Prisma createMany doesn't support relations easily with where clauses in SQLite/some adapters, 
  // but standard postgres is fine. We iterate to be safe and simple for now or map data.
  const entriesData = profiles.map(p => ({
    seasonId: currentSeason.id,
    userId: p.userId,
    points: p.rankingPoints,
    wins: p.wins,
    losses: p.losses,
    tournamentWins: p.tournamentWins,
  }));

  if (entriesData.length > 0) {
    await prisma.seasonEntry.createMany({
      data: entriesData,
    });
  }

  // 2. Mark old tournaments as ARCHIVED (Optional but good for cleanup)
  // We only archive COMPLETE tournaments that happened during this season
  // Actually, let's rely on date filtering for calculation, but marking status is good.
  await prisma.tournament.updateMany({
    where: { 
      status: 'COMPLETE',
      date: { gte: currentSeason.startDate }
    },
    data: { status: 'ARCHIVED' }
  });

  // 3. Reset Profiles
  await prisma.profile.updateMany({
    data: {
      rankingPoints: 0,
      wins: 0,
      losses: 0,
      tournamentWins: 0,
    },
  });

  // 4. Create Next Season
  await createSeason(nextSeasonName, nextSeasonSlug);

  return { success: true };
}

export async function getSeasonStandings(slug: string) {
  const season = await prisma.rankingSeason.findUnique({
    where: { slug },
    include: {
      entries: {
        include: {
          user: true,
        },
        orderBy: { points: 'desc' },
      },
    },
  });
  return season;
}
