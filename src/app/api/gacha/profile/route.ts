/**
 * GET /api/gacha/profile
 * Get user's TCG profile (currency, streak, stats)
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiUser, serverError, unauthorized } from '../helpers';

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return unauthorized();

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        userId: true,
        bladerName: true,
        currency: true,
        dailyStreak: true,
        lastDaily: true,
        pityCount: true,
        wins: true,
        losses: true,
        tournamentWins: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profil introuvable' },
        { status: 404 },
      );
    }

    // Count cards
    const cardCount = await prisma.cardInventory.count({
      where: { userId: user.id },
    });

    const totalCards = await prisma.gachaCard.count({
      where: { isActive: true },
    });

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        cardCount,
        totalCards,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
          discordTag: (user as Record<string, unknown>).discordTag,
        },
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
