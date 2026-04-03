/**
 * POST /api/gacha/multi
 * Multi pull: 5 cards for 450 BeyCoins (10% discount), guaranteed 1 SR+
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getApiUser,
  MULTI_PULL_COST,
  MULTI_PULL_COUNT,
  rollCardRarity,
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
      if (profile.currency < MULTI_PULL_COST)
        throw new Error('INSUFFICIENT_FUNDS');

      // Roll all rarities
      const rarities = Array.from({ length: MULTI_PULL_COUNT }, () =>
        rollCardRarity(),
      );

      // Guarantee at least 1 SR+
      const hasSRPlus = rarities.some((r) =>
        ['SUPER_RARE', 'LEGENDARY', 'SECRET'].includes(r),
      );
      if (!hasSRPlus) {
        rarities[MULTI_PULL_COUNT - 1] = 'SUPER_RARE';
      }

      // Select cards for each rarity
      const cards = [];
      for (const rarity of rarities) {
        let card = await tx.gachaCard.findFirst({
          where: { rarity, isActive: true },
          orderBy: { createdAt: 'desc' },
          skip: Math.floor(
            Math.random() *
              (await tx.gachaCard.count({
                where: { rarity, isActive: true },
              })),
          ),
        });

        if (!card) {
          card = await tx.gachaCard.findFirst({
            where: { isActive: true },
          });
        }

        if (card) cards.push(card);
      }

      if (cards.length === 0) throw new Error('NO_CARDS');

      // Deduct currency
      const updatedProfile = await tx.profile.update({
        where: { userId: user.id },
        data: {
          currency: { decrement: MULTI_PULL_COST },
          pityCount: 0,
        },
      });

      // Add all cards to inventory
      for (const card of cards) {
        await tx.cardInventory.upsert({
          where: {
            userId_cardId: { userId: user.id, cardId: card.id },
          },
          create: { userId: user.id, cardId: card.id, count: 1 },
          update: { count: { increment: 1 } },
        });
      }

      // Log transaction
      await tx.currencyTransaction.create({
        data: {
          userId: user.id,
          amount: -MULTI_PULL_COST,
          type: 'MULTI_PULL',
          note: `Multi-tirage ×${cards.length}`,
        },
      });

      return {
        cards,
        newBalance: updatedProfile.currency,
        pityCount: 0,
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
            error: `Solde insuffisant (${MULTI_PULL_COST} requis)`,
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
