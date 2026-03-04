'use server';

import { prisma } from '@/lib/prisma';

export async function getMetaStats() {
  // 1. Récupérer l'usage des pièces dans les DeckItems
  const [bladeUsage, ratchetUsage, bitUsage, assistUsage] = await Promise.all([
    prisma.deckItem.groupBy({
      by: ['bladeId'],
      _count: { bladeId: true },
      where: { NOT: { bladeId: null } },
      orderBy: { _count: { bladeId: 'desc' } },
      take: 10,
    }),
    prisma.deckItem.groupBy({
      by: ['ratchetId'],
      _count: { ratchetId: true },
      where: { NOT: { ratchetId: null } },
      orderBy: { _count: { ratchetId: 'desc' } },
      take: 10,
    }),
    prisma.deckItem.groupBy({
      by: ['bitId'],
      _count: { bitId: true },
      where: { NOT: { bitId: null } },
      orderBy: { _count: { bitId: 'desc' } },
      take: 10,
    }),
    prisma.deckItem.groupBy({
      by: ['assistBladeId'],
      _count: { assistBladeId: true },
      where: { NOT: { assistBladeId: null } },
      orderBy: { _count: { assistBladeId: 'desc' } },
      take: 10,
    }),
  ]);

  // 2. Récupérer les détails des pièces pour avoir les noms
  const allPartIds = [
    ...bladeUsage.map((u) => u.bladeId!),
    ...ratchetUsage.map((u) => u.ratchetId!),
    ...bitUsage.map((u) => u.bitId!),
    ...assistUsage.map((u) => u.assistBladeId!),
  ];

  const parts = await prisma.part.findMany({
    where: { id: { in: allPartIds } },
    select: { id: true, name: true, type: true, imageUrl: true },
  });

  const partMap = new Map(parts.map((p) => [p.id, p]));

  return {
    blades: bladeUsage.map((u) => ({
      ...partMap.get(u.bladeId!),
      count: u._count.bladeId,
    })),
    ratchets: ratchetUsage.map((u) => ({
      ...partMap.get(u.ratchetId!),
      count: u._count.ratchetId,
    })),
    bits: bitUsage.map((u) => ({
      ...partMap.get(u.bitId!),
      count: u._count.bitId,
    })),
    assists: assistUsage.map((u) => ({
      ...partMap.get(u.assistBladeId!),
      count: u._count.assistBladeId,
    })),
  };
}
