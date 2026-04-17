/**
 * GET  /api/gacha/wishlist - Get user's wishlist
 * POST /api/gacha/wishlist - Add/remove card from wishlist
 */
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, getApiUser, serverError, unauthorized } from '../helpers';

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) return unauthorized();

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ success: true, cards: [] });
    }

    const wishlist = await prisma.cardWishlist.findMany({
      where: { profileId: profile.id },
      include: { card: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      cards: wishlist.map((w) => w.card),
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const { cardId, action } = body as { cardId?: string; action?: string };

    if (!cardId) return badRequest('cardId requis');

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profil introuvable' },
        { status: 404 },
      );
    }

    if (action === 'remove') {
      await prisma.cardWishlist.deleteMany({
        where: { profileId: profile.id, cardId },
      });
      return NextResponse.json({ success: true, action: 'removed' });
    }

    // Add to wishlist
    await prisma.cardWishlist.upsert({
      where: {
        profileId_cardId: { profileId: profile.id, cardId },
      },
      create: { profileId: profile.id, cardId },
      update: {},
    });

    return NextResponse.json({ success: true, action: 'added' });
  } catch (error) {
    return serverError(error);
  }
}
