'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ── Public actions ──

export async function getAllGachaCards() {
  return prisma.gachaCard.findMany({
    where: { isActive: true },
    orderBy: [{ rarity: 'desc' }, { name: 'asc' }],
  });
}

export async function getGachaCardsBySeries() {
  const cards = await prisma.gachaCard.findMany({
    where: { isActive: true },
    orderBy: [{ rarity: 'desc' }, { name: 'asc' }],
  });

  const grouped: Record<string, typeof cards> = {};
  for (const card of cards) {
    if (!grouped[card.series]) grouped[card.series] = [];
    grouped[card.series]?.push(card);
  }
  return grouped;
}

export async function getGachaCardBySlug(slug: string) {
  return prisma.gachaCard.findUnique({
    where: { slug },
    include: {
      inventory: {
        include: {
          user: {
            include: { profile: true },
          },
        },
        orderBy: { count: 'desc' },
        take: 10,
      },
    },
  });
}

export async function getGachaStats() {
  const [totalCards, totalOwned, byRarity, bySeries] = await Promise.all([
    prisma.gachaCard.count({ where: { isActive: true } }),
    prisma.cardInventory.aggregate({ _sum: { count: true } }),
    prisma.gachaCard.groupBy({
      by: ['rarity'],
      where: { isActive: true },
      _count: true,
    }),
    prisma.gachaCard.groupBy({
      by: ['series'],
      where: { isActive: true },
      _count: true,
    }),
  ]);

  const totalCollectors = await prisma.cardInventory.groupBy({
    by: ['userId'],
    _count: true,
  });

  return {
    totalCards,
    totalOwned: totalOwned._sum.count || 0,
    totalCollectors: totalCollectors.length,
    byRarity: Object.fromEntries(
      byRarity.map((r) => [r.rarity, r._count]),
    ) as Record<string, number>,
    bySeries: Object.fromEntries(
      bySeries.map((s) => [s.series, s._count]),
    ) as Record<string, number>,
  };
}

export async function getGachaLeaderboard() {
  const inventories = await prisma.cardInventory.groupBy({
    by: ['userId'],
    _count: { cardId: true },
    _sum: { count: true },
    orderBy: { _count: { cardId: 'desc' } },
    take: 20,
  });

  const userIds = inventories.map((i) => i.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    include: { profile: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));
  const totalCards = await prisma.gachaCard.count({
    where: { isActive: true },
  });

  return inventories.map((inv) => {
    const user = userMap.get(inv.userId);
    return {
      userId: inv.userId,
      name: user?.globalName || user?.name || user?.discordTag || 'Inconnu',
      image: user?.image || user?.serverAvatar,
      discordId: user?.discordId,
      uniqueCards: inv._count.cardId,
      totalCards: inv._sum.count || 0,
      currency: user?.profile?.currency || 0,
      completionPct: Math.round((inv._count.cardId / totalCards) * 100),
    };
  });
}

export async function getDropRates() {
  return {
    MISS: 35,
    COMMON: 30,
    RARE: 20,
    EPIC: 10,
    LEGENDARY: 4,
    SECRET: 1,
  };
}

// ── Authenticated actions ──

export async function getUserGachaProfile() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: {
        include: {
          wishlist: {
            include: { card: true },
          },
        },
      },
      cardInventory: {
        include: { card: true },
        orderBy: { obtainedAt: 'desc' },
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!user) return null;

  const totalCards = await prisma.gachaCard.count({
    where: { isActive: true },
  });
  const uniqueCards = user.cardInventory.length;

  // Group by rarity
  const byRarity: Record<string, number> = {};
  for (const inv of user.cardInventory) {
    byRarity[inv.card.rarity] = (byRarity[inv.card.rarity] || 0) + 1;
  }

  return {
    userId: user.id,
    name: user.globalName || user.name || user.discordTag || 'Inconnu',
    image: user.image || user.serverAvatar,
    discordId: user.discordId,
    currency: user.profile?.currency || 0,
    dailyStreak: user.profile?.dailyStreak || 0,
    lastDaily: user.profile?.lastDaily,
    uniqueCards,
    totalCards,
    completionPct: Math.round((uniqueCards / totalCards) * 100),
    byRarity,
    inventory: user.cardInventory.map((inv) => ({
      ...inv.card,
      count: inv.count,
      obtainedAt: inv.obtainedAt,
    })),
    wishlist: user.profile?.wishlist.map((w) => w.card) || [],
    transactions: user.transactions,
  };
}
