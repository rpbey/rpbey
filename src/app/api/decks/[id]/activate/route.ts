/**
 * RPB - Set Active Deck API
 * POST /api/decks/[id]/activate - Set a deck as active
 */

import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const existingDeck = await prisma.deck.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingDeck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Deactivate all other decks and activate this one
    await prisma.$transaction([
      prisma.deck.updateMany({
        where: { userId: session.user.id, isActive: true },
        data: { isActive: false },
      }),
      prisma.deck.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error activating deck:', error);
    return NextResponse.json(
      { error: 'Failed to activate deck' },
      { status: 500 },
    );
  }
}
