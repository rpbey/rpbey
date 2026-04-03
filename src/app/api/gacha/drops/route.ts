/**
 * GET /api/gacha/drops
 * List all gacha drops with card counts
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverError } from '../helpers';

export async function GET() {
  try {
    const drops = await prisma.gachaDrop.findMany({
      orderBy: { season: 'desc' },
      include: {
        _count: { select: { cards: true } },
      },
    });

    return NextResponse.json({
      success: true,
      drops: drops.map((d) => ({
        ...d,
        cardCount: d._count.cards,
        _count: undefined,
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}
