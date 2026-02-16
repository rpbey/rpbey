'use server';

import { prisma } from '@/lib/prisma';

export async function searchBladers(query: string) {
  if (!query || query.length < 2) return [];

  // Search in primary profiles
  const profiles = await prisma.profile.findMany({
    where: {
      OR: [
        { bladerName: { contains: query, mode: 'insensitive' } },
        { user: { name: { contains: query, mode: 'insensitive' } } },
        { user: { username: { contains: query, mode: 'insensitive' } } },
        { user: { discordTag: { contains: query, mode: 'insensitive' } } },
      ],
    },
    take: 5,
    select: {
      bladerName: true,
      user: {
        select: {
          name: true,
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
    name: p.bladerName || p.user.name || 'Inconnu',
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
