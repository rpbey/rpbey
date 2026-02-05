'use server';

import { prisma } from '@/lib/prisma';

export async function searchBladers(query: string) {
  if (!query || query.length < 2) return [];

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

  return profiles.map((p) => ({
    name: p.bladerName || p.user.name || 'Inconnu',
    image: p.user.image,
  }));
}
