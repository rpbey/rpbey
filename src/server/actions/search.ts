'use server';

import { prisma } from '@/lib/prisma';

export async function searchBladers(query: string) {
  if (!query || query.length < 2) return [];

  // Search in primary profiles
  const profiles = await prisma.profile.findMany({
    where: {
      OR: [
        { challongeUsername: { contains: query, mode: 'insensitive' } },
        { bladerName: { contains: query, mode: 'insensitive' } },
        { user: { name: { contains: query, mode: 'insensitive' } } },
        { user: { username: { contains: query, mode: 'insensitive' } } },
      ],
      user: {
        tournaments: { some: {} }, // Uniquement les profils Challonge réels
      },
    },
    take: 5,
    select: {
      bladerName: true,
      challongeUsername: true,
      user: {
        select: {
          name: true,
          username: true,
          image: true,
        },
      },
    },
  });

  // Search in SATR profiles
  const satrBladers = await prisma.satrBlader.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' },
    },
    take: 3,
    select: {
      name: true,
    },
  });

  const results = profiles.map((p) => ({
    name: p.challongeUsername
      ? `@${p.challongeUsername}`
      : `@${p.user.username?.replace(/^bts[1-3]_/, '') || p.bladerName || 'blader'}`,
    image: p.user.image,
  }));

  // Add SATR results if they don't duplicate names
  for (const sb of satrBladers) {
    if (!results.some((r) => r.name.toLowerCase() === sb.name.toLowerCase())) {
      results.push({
        name: sb.name,
        image: null,
      });
    }
  }

  return results.slice(0, 8);
}
