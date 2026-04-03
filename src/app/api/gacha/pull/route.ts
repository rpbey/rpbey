/**
 * POST /api/gacha/pull
 * Single card pull (costs 100 BeyCoins)
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getApiUser,
  PITY_THRESHOLD,
  rollCardRarity,
  SINGLE_PULL_COST,
  serverError,
  unauthorized,
} from '../helpers';

export async function POST() {
  try {
    const user = await getApiUser();
    if (!user) return unauthorized();

    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUnique({
        where: { userId: user.id },
        select: { id: true, currency: true, pityCount: true },
      });

      if (!profile) throw new Error('NO_PROFILE');
      if (profile.currency < SINGLE_PULL_COST)
        throw new Error('INSUFFICIENT_FUNDS');

      // Roll rarity with pity system
      let rarity = rollCardRarity();
      let newPity = profile.pityCount + 1;

      if (
        newPity >= PITY_THRESHOLD &&
        !['SUPER_RARE', 'LEGENDARY', 'SECRET'].includes(rarity)
      ) {
        rarity = 'SUPER_RARE';
        newPity = 0;
      }
      if (['SUPER_RARE', 'LEGENDARY', 'SECRET'].includes(rarity)) {
        newPity = 0;
      }

      // Find a card of this rarity from active drops
      const card = await tx.gachaCard.findFirst({
        where: { rarity, isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!card) {
        // Fallback: any active card
        const fallback = await tx.gachaCard.findFirst({
          where: { isActive: true },
        });
        if (!fallback) throw new Error('NO_CARDS');
      }

      const selectedCard =
        card ??
        (await tx.gachaCard.findFirst({
          where: { isActive: true },
        }));

      if (!selectedCard) throw new Error('NO_CARDS');

      // Deduct currency
      const updatedProfile = await tx.profile.update({
        where: { userId: user.id },
        data: {
          currency: { decrement: SINGLE_PULL_COST },
          pityCount: newPity,
        },
      });

      // Add to inventory
      await tx.cardInventory.upsert({
        where: { userId_cardId: { userId: user.id, cardId: selectedCard.id } },
        create: { userId: user.id, cardId: selectedCard.id, count: 1 },
        update: { count: { increment: 1 } },
      });

      // Log transaction
      await tx.currencyTransaction.create({
        data: {
          userId: user.id,
          amount: -SINGLE_PULL_COST,
          type: 'GACHA_PULL',
          note: `Tirage simple — ${selectedCard.name} (${selectedCard.rarity})`,
        },
      });

      return {
        cards: [selectedCard],
        newBalance: updatedProfile.currency,
        pityCount: newPity,
      };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NO_PROFILE')
        return NextResponse.json(
          { success: false, error: 'Profil introuvable' },
          { status: 404 },
        );
      if (error.message === 'INSUFFICIENT_FUNDS')
        return NextResponse.json(
          {
            success: false,
            error: `Solde insuffisant (${SINGLE_PULL_COST} requis)`,
          },
          { status: 400 },
        );
      if (error.message === 'NO_CARDS')
        return NextResponse.json(
          { success: false, error: 'Aucune carte disponible' },
          { status: 404 },
        );
    }
    return serverError(error);
  }
}
