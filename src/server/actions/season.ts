'use server';

import { cacheTag, revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Zod Schemas
const CreateSeasonSchema = z.object({
  name: z.string().min(3),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/),
});

const ArchiveSeasonSchema = z.object({
  nextSeasonName: z.string().min(3),
  nextSeasonSlug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/),
});

// Cached Data Fetching
export async function getCurrentSeason() {
  'use cache';
  cacheTag('seasons');
  const season = await prisma.rankingSeason.findFirst({
    where: { isActive: true },
  });
  return season;
}

export async function getSeasons() {
  'use cache';
  cacheTag('seasons');
  return await prisma.rankingSeason.findMany({
    orderBy: { startDate: 'desc' },
  });
}

export async function getSeasonStandings(slug: string) {
  'use cache';
  cacheTag(`season-standings-${slug}`);
  const season = await prisma.rankingSeason.findUnique({
    where: { slug },
    include: {
      entries: {
        include: {
          user: {
            include: {
              _count: {
                select: { tournaments: true },
              },
            },
          },
        },
        orderBy: { points: 'desc' },
      },
    },
  });
  return season;
}

// Mutations
export async function createSeason(name: string, slug: string) {
  // Validate input
  const result = CreateSeasonSchema.safeParse({ name, slug });
  if (!result.success) {
    throw new Error('Invalid input: ' + result.error.message);
  }

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

  // revalidateTag('seasons');
  revalidatePath('/admin/rankings');
  return season;
}

export async function archiveCurrentSeason(
  nextSeasonName: string,
  nextSeasonSlug: string,
) {
  // Validate input
  const result = ArchiveSeasonSchema.safeParse({
    nextSeasonName,
    nextSeasonSlug,
  });
  if (!result.success) {
    throw new Error('Invalid input: ' + result.error.message);
  }

  const currentSeason = await getCurrentSeason();

  if (!currentSeason) {
    throw new Error('Aucune saison active à archiver.');
  }

  // Transaction to ensure atomic operation
  await prisma.$transaction(
    async (tx) => {
      // 1. Snapshot profiles to SeasonEntry
      const profiles = await tx.profile.findMany({
        where: {
          OR: [
            { rankingPoints: { gt: 0 } },
            { wins: { gt: 0 } },
            { losses: { gt: 0 } },
            { tournamentWins: { gt: 0 } },
          ],
        },
      });

      const entriesData = profiles.map((p) => ({
        seasonId: currentSeason.id,
        userId: p.userId,
        points: p.rankingPoints,
        wins: p.wins,
        losses: p.losses,
        tournamentWins: p.tournamentWins,
      }));

      if (entriesData.length > 0) {
        await tx.seasonEntry.createMany({
          data: entriesData,
          skipDuplicates: true,
        });
      }

      // 2. Mark old tournaments as ARCHIVED
      await tx.tournament.updateMany({
        where: {
          status: 'COMPLETE',
          date: { gte: currentSeason.startDate },
        },
        data: { status: 'ARCHIVED' },
      });

      // 3. Reset Profiles
      await tx.profile.updateMany({
        data: {
          rankingPoints: 0,
          wins: 0,
          losses: 0,
          tournamentWins: 0,
        },
      });

      // 4. Create Next Season
      await tx.rankingSeason.update({
        where: { id: currentSeason.id },
        data: { isActive: false, endDate: new Date() },
      });

      await tx.rankingSeason.create({
        data: {
          name: nextSeasonName,
          slug: nextSeasonSlug,
          isActive: true,
          startDate: new Date(),
        },
      });
    },
    {
      timeout: 15000, // Increased timeout for archiving
    },
  );

  // revalidateTag('seasons');
  revalidatePath('/admin/rankings');
  return { success: true };
}
