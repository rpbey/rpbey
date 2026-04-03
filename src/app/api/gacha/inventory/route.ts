/**
 * GET /api/gacha/inventory
 * Get user's card collection
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiUser, serverError, unauthorized } from '../helpers';

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return unauthorized();

    const inventory = await prisma.cardInventory.findMany({
      where: { userId: user.id },
      include: { card: true },
      orderBy: { obtainedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      cards: inventory,
      total: inventory.length,
    });
  } catch (error) {
    return serverError(error);
  }
}
