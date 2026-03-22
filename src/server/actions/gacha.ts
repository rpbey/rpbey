'use server';

import type { Part, PartType } from '@prisma/client';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ─── Types ───────────────────────────────────────────────────────────────────

type ProductLine = 'BX' | 'UX' | 'CX';

type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'SECRET';

interface PulledPart {
  id: string;
  name: string;
  type: string;
  imageUrl: string | null;
  rarity: Rarity;
  system: string | null;
  weight: number | null;
}

interface PullResult {
  success: boolean;
  parts?: PulledPart[];
  message?: string;
  newBalance?: number;
}

interface DailyResult {
  success: boolean;
  message?: string;
  amount?: number;
  streak?: number;
  newBalance?: number;
}

interface InventoryItem {
  partId: string;
  count: number;
  part: {
    id: string;
    name: string;
    type: PartType;
    imageUrl: string | null;
    system: string | null;
    weight: number | null;
    beyType: string | null;
  };
  rarity: Rarity;
}

interface CurrencyResult {
  success: boolean;
  balance?: number;
  message?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SINGLE_PULL_COST = 100;
const MULTI_PULL_COST = 450; // 10% discount on 5x
const MULTI_PULL_COUNT = 5;
const DAILY_BASE_AMOUNT = 50;
const DAILY_STREAK_BONUS = 10;
const DAILY_MAX_BONUS = 100;
const DAILY_RESET_HOURS = 48; // Streak resets after 48h without claiming

// Rarity distribution weights (must sum to 100)
const RARITY_WEIGHTS: { rarity: Rarity; weight: number }[] = [
  { rarity: 'COMMON', weight: 60 },
  { rarity: 'RARE', weight: 25 },
  { rarity: 'EPIC', weight: 10 },
  { rarity: 'LEGENDARY', weight: 4 },
  { rarity: 'SECRET', weight: 1 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
}

/**
 * Determine a part's rarity based on its characteristics.
 * - BLADE: heavier = rarer
 * - RATCHET: higher protrusions = rarer
 * - BIT: special tip types (gear/trans/rubber) = rarer; heavier = rarer
 */
function determinePartRarity(part: Part): Rarity {
  if (part.type === 'BLADE' || part.type === 'OVER_BLADE') {
    const w = part.weight ?? 0;
    if (w >= 50) return 'SECRET';
    if (w >= 42) return 'LEGENDARY';
    if (w >= 35) return 'EPIC';
    if (w >= 28) return 'RARE';
    return 'COMMON';
  }

  if (part.type === 'RATCHET') {
    const protrusions = part.protrusions ?? 0;
    const w = part.weight ?? 0;
    // High protrusion count or very heavy ratchets are rarer
    if (protrusions >= 9 || w >= 30) return 'LEGENDARY';
    if (protrusions >= 6 || w >= 25) return 'EPIC';
    if (protrusions >= 4 || w >= 20) return 'RARE';
    return 'COMMON';
  }

  if (part.type === 'BIT') {
    const tip = (part.tipType ?? '').toLowerCase();
    const specialTips = ['gear', 'trans', 'rubber', 'metal', 'gyro', 'accel'];
    const isSpecial = specialTips.some((t) => tip.includes(t));
    const w = part.weight ?? 0;

    if (isSpecial && w >= 12) return 'SECRET';
    if (isSpecial) return 'EPIC';
    if (w >= 12) return 'LEGENDARY';
    if (w >= 9) return 'RARE';
    return 'COMMON';
  }

  // LOCK_CHIP, ASSIST_BLADE fallback
  return 'COMMON';
}

/**
 * Roll a rarity tier based on weighted distribution.
 */
function rollRarity(): Rarity {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const tier of RARITY_WEIGHTS) {
    cumulative += tier.weight;
    if (roll < cumulative) return tier.rarity;
  }
  return 'COMMON';
}

/**
 * Select a random part from the pool matching the target rarity.
 * Falls back to nearest available rarity if no parts match exactly.
 */
function selectPartByRarity(parts: Part[], targetRarity: Rarity): Part {
  // Group parts by their derived rarity
  const byRarity = new Map<Rarity, Part[]>();
  for (const part of parts) {
    const r = determinePartRarity(part);
    if (!byRarity.has(r)) byRarity.set(r, []);
    byRarity.get(r)?.push(part);
  }

  // Try exact match first
  const exact = byRarity.get(targetRarity);
  if (exact && exact.length > 0) {
    return exact[Math.floor(Math.random() * exact.length)]!;
  }

  // Fallback: try lower rarities, then higher
  const rarityOrder: Rarity[] = [
    'COMMON',
    'RARE',
    'EPIC',
    'LEGENDARY',
    'SECRET',
  ];
  const targetIdx = rarityOrder.indexOf(targetRarity);

  // Search downward first
  for (let i = targetIdx - 1; i >= 0; i--) {
    const fallback = byRarity.get(rarityOrder[i]!);
    if (fallback && fallback.length > 0) {
      return fallback[Math.floor(Math.random() * fallback.length)]!;
    }
  }

  // Search upward
  for (let i = targetIdx + 1; i < rarityOrder.length; i++) {
    const fallback = byRarity.get(rarityOrder[i]!);
    if (fallback && fallback.length > 0) {
      return fallback[Math.floor(Math.random() * fallback.length)]!;
    }
  }

  // Ultimate fallback: random from entire pool
  return parts[Math.floor(Math.random() * parts.length)]!;
}

/**
 * Execute the pull logic: select random parts, deduct currency, add to inventory.
 */
async function executePull(
  userId: string,
  line: ProductLine,
  count: number,
  cost: number,
  guaranteeEpicPlus: boolean,
): Promise<PullResult> {
  // Fetch all parts matching the product line system
  const availableParts = await prisma.part.findMany({
    where: {
      system: line,
      type: { in: ['BLADE', 'RATCHET', 'BIT'] },
    },
  });

  if (availableParts.length === 0) {
    return {
      success: false,
      message: `Aucune pièce disponible pour la ligne ${line}.`,
    };
  }

  // Roll rarities and select parts
  const selectedParts: { part: Part; rarity: Rarity }[] = [];
  for (let i = 0; i < count; i++) {
    const rarity = rollRarity();
    const part = selectPartByRarity(availableParts, rarity);
    selectedParts.push({ part, rarity: determinePartRarity(part) });
  }

  // Guarantee at least 1 EPIC+ for multi-pull
  if (guaranteeEpicPlus) {
    const hasEpicPlus = selectedParts.some((p) =>
      ['EPIC', 'LEGENDARY', 'SECRET'].includes(p.rarity),
    );
    if (!hasEpicPlus) {
      // Replace the last pull with a guaranteed EPIC+
      const guaranteedRarities: Rarity[] = ['EPIC', 'LEGENDARY', 'SECRET'];
      const guaranteedRarity =
        guaranteedRarities[
          Math.floor(Math.random() * guaranteedRarities.length)
        ]!;
      const part = selectPartByRarity(availableParts, guaranteedRarity);
      selectedParts[selectedParts.length - 1] = {
        part,
        rarity: determinePartRarity(part),
      };
    }
  }

  // Execute transaction: deduct currency + add inventory + log transaction
  const result = await prisma.$transaction(async (tx) => {
    // Get current profile and check balance
    const profile = await tx.profile.findUnique({
      where: { userId },
      select: { currency: true },
    });

    if (!profile) {
      throw new Error('NO_PROFILE');
    }

    if (profile.currency < cost) {
      throw new Error('INSUFFICIENT_FUNDS');
    }

    // Deduct currency
    const updatedProfile = await tx.profile.update({
      where: { userId },
      data: { currency: { decrement: cost } },
    });

    // Add parts to inventory (upsert to handle duplicates)
    for (const { part } of selectedParts) {
      await tx.partInventory.upsert({
        where: {
          userId_partId: { userId, partId: part.id },
        },
        create: {
          userId,
          partId: part.id,
          count: 1,
        },
        update: {
          count: { increment: 1 },
        },
      });
    }

    // Log the transaction
    await tx.currencyTransaction.create({
      data: {
        userId,
        amount: -cost,
        type: count > 1 ? 'MULTI_PULL' : 'GACHA_PULL',
        note: `${count > 1 ? 'Multi' : 'Single'} pull - Ligne ${line}`,
      },
    });

    return updatedProfile.currency;
  });

  return {
    success: true,
    parts: selectedParts.map(({ part, rarity }) => ({
      id: part.id,
      name: part.name,
      type: part.type,
      imageUrl: part.imageUrl,
      rarity,
      system: part.system,
      weight: part.weight,
    })),
    newBalance: result,
  };
}

// ─── Public Actions ──────────────────────────────────────────────────────────

/**
 * Single pull: costs 100 currency, returns 1 random part from the given line.
 */
export async function pullBooster(line: ProductLine): Promise<PullResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, message: 'Non connecté.' };
  }

  try {
    return await executePull(user.id, line, 1, SINGLE_PULL_COST, false);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NO_PROFILE') {
        return {
          success: false,
          message: "Profil introuvable. Créez votre profil blader d'abord.",
        };
      }
      if (error.message === 'INSUFFICIENT_FUNDS') {
        return {
          success: false,
          message: `Solde insuffisant. Il faut ${SINGLE_PULL_COST} BeyCoins pour un tirage.`,
        };
      }
    }
    console.error('Error in pullBooster:', error);
    return { success: false, message: 'Une erreur est survenue.' };
  }
}

/**
 * Multi pull (5x): costs 450 currency (10% discount), guaranteed 1 EPIC+ minimum.
 */
export async function pullMulti(line: ProductLine): Promise<PullResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, message: 'Non connecté.' };
  }

  try {
    return await executePull(
      user.id,
      line,
      MULTI_PULL_COUNT,
      MULTI_PULL_COST,
      true,
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NO_PROFILE') {
        return {
          success: false,
          message: "Profil introuvable. Créez votre profil blader d'abord.",
        };
      }
      if (error.message === 'INSUFFICIENT_FUNDS') {
        return {
          success: false,
          message: `Solde insuffisant. Il faut ${MULTI_PULL_COST} BeyCoins pour un multi-tirage (x5).`,
        };
      }
    }
    console.error('Error in pullMulti:', error);
    return { success: false, message: 'Une erreur est survenue.' };
  }
}

/**
 * Claim daily currency reward with streak bonus.
 * Base: 50 BeyCoins + 10 per day of streak (max +100 bonus).
 * Streak resets if 48h+ since last claim.
 */
export async function claimDaily(): Promise<DailyResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, message: 'Non connecté.' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUnique({
        where: { userId: user.id },
        select: { currency: true, lastDaily: true, dailyStreak: true },
      });

      if (!profile) {
        throw new Error('NO_PROFILE');
      }

      const now = new Date();
      const lastDaily = profile.lastDaily;

      // Check if already claimed today
      if (lastDaily) {
        const lastDate = new Date(lastDaily);
        const isSameDay =
          lastDate.getUTCFullYear() === now.getUTCFullYear() &&
          lastDate.getUTCMonth() === now.getUTCMonth() &&
          lastDate.getUTCDate() === now.getUTCDate();

        if (isSameDay) {
          throw new Error('ALREADY_CLAIMED');
        }
      }

      // Calculate streak
      let newStreak = 1;
      if (lastDaily) {
        const hoursSinceLastDaily =
          (now.getTime() - new Date(lastDaily).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastDaily < DAILY_RESET_HOURS) {
          // Continue streak
          newStreak = profile.dailyStreak + 1;
        }
        // Otherwise streak resets to 1
      }

      // Calculate reward
      const streakBonus = Math.min(
        (newStreak - 1) * DAILY_STREAK_BONUS,
        DAILY_MAX_BONUS,
      );
      const totalAmount = DAILY_BASE_AMOUNT + streakBonus;

      // Update profile
      const updatedProfile = await tx.profile.update({
        where: { userId: user.id },
        data: {
          currency: { increment: totalAmount },
          lastDaily: now,
          dailyStreak: newStreak,
        },
      });

      // Log the transaction
      await tx.currencyTransaction.create({
        data: {
          userId: user.id,
          amount: totalAmount,
          type: 'DAILY_CLAIM',
          note: `Récompense quotidienne (série: ${newStreak} jours)`,
        },
      });

      return {
        amount: totalAmount,
        streak: newStreak,
        newBalance: updatedProfile.currency,
      };
    });

    return {
      success: true,
      amount: result.amount,
      streak: result.streak,
      newBalance: result.newBalance,
      message: `+${result.amount} BeyCoins ! Série de ${result.streak} jour${result.streak > 1 ? 's' : ''}.`,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NO_PROFILE') {
        return {
          success: false,
          message: "Profil introuvable. Créez votre profil blader d'abord.",
        };
      }
      if (error.message === 'ALREADY_CLAIMED') {
        return {
          success: false,
          message:
            "Tu as déjà récupéré ta récompense quotidienne aujourd'hui ! Reviens demain.",
        };
      }
    }
    console.error('Error in claimDaily:', error);
    return { success: false, message: 'Une erreur est survenue.' };
  }
}

/**
 * Get the user's collected parts inventory with counts and rarity.
 */
export async function getInventory(): Promise<InventoryItem[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const inventory = await prisma.partInventory.findMany({
    where: { userId: user.id },
    include: {
      part: {
        select: {
          id: true,
          name: true,
          type: true,
          imageUrl: true,
          system: true,
          weight: true,
          beyType: true,
          tipType: true,
          protrusions: true,
        },
      },
    },
    orderBy: { obtainedAt: 'desc' },
  });

  return inventory.map((item) => ({
    partId: item.partId,
    count: item.count,
    part: {
      id: item.part.id,
      name: item.part.name,
      type: item.part.type,
      imageUrl: item.part.imageUrl,
      system: item.part.system,
      weight: item.part.weight,
      beyType: item.part.beyType,
    },
    rarity: determinePartRarity(item.part as Part),
  }));
}

/**
 * Get the user's current currency balance.
 */
export async function getUserCurrency(): Promise<CurrencyResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, message: 'Non connecté.' };
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { currency: true },
  });

  if (!profile) {
    return {
      success: false,
      message: "Profil introuvable. Créez votre profil blader d'abord.",
    };
  }

  return { success: true, balance: profile.currency };
}
