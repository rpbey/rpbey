/**
 * RPB - Decks API
 * GET /api/decks - List user's decks
 * POST /api/decks - Create a new deck
 */

import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DECK_ITEMS_INCLUDE = {
  include: {
    bey: true,
    blade: true,
    overBlade: true,
    ratchet: true,
    bit: true,
    lockChip: true,
    assistBlade: true,
  },
  orderBy: { position: 'asc' as const },
};

// GET - List user's decks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const targetUserId = userIdParam || session?.user?.id;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If viewing someone else's decks, only show the active one
    const where: any = { userId: targetUserId };
    if (userIdParam && userIdParam !== session?.user?.id) {
      where.isActive = true;
    }

    const decks = await prisma.deck.findMany({
      where,
      include: {
        items: DECK_ITEMS_INCLUDE,
      },
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
    });

    const formattedDecks = decks.map((deck) => ({
      ...deck,
      beys: deck.items,
    }));

    return NextResponse.json({ data: formattedDecks });
  } catch (error) {
    console.error('Error fetching decks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decks' },
      { status: 500 },
    );
  }
}

// POST - Create a new deck
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, beys, isActive } = body as {
      name: string;
      isActive?: boolean;
      beys: Array<{
        position: number;
        nickname?: string;
        bladeId: string;
        overBladeId?: string;
        ratchetId: string;
        bitId: string;
        lockChipId?: string;
        assistBladeId?: string;
      }>;
    };

    // Validate input
    if (!name || !beys || beys.length !== 3) {
      return NextResponse.json(
        { error: 'Invalid deck: name and exactly 3 beys required' },
        { status: 400 },
      );
    }

    // Validate uniqueness of standard parts within deck
    const standardPartIds = beys.flatMap((b) => [
      b.bladeId,
      b.ratchetId,
      b.bitId,
    ]);
    const uniqueStandardIds = new Set(standardPartIds);
    if (uniqueStandardIds.size !== standardPartIds.length) {
      return NextResponse.json(
        { error: 'Invalid deck: each standard part can only be used once' },
        { status: 400 },
      );
    }

    // Collect all part IDs for validation
    const allPartIds = [...standardPartIds];
    for (const bey of beys) {
      if (bey.overBladeId) allPartIds.push(bey.overBladeId);
      if (bey.lockChipId) allPartIds.push(bey.lockChipId);
      if (bey.assistBladeId) allPartIds.push(bey.assistBladeId);
    }

    // Validate over blade uniqueness
    const overBladeIds = beys
      .map((b) => b.overBladeId)
      .filter(Boolean) as string[];
    if (new Set(overBladeIds).size !== overBladeIds.length) {
      return NextResponse.json(
        { error: 'Duplicate Over Blades in deck' },
        { status: 400 },
      );
    }

    // Validate assist blade uniqueness
    const assistBladeIds = beys
      .map((b) => b.assistBladeId)
      .filter(Boolean) as string[];
    const uniqueAssistIds = new Set(assistBladeIds);
    if (uniqueAssistIds.size !== assistBladeIds.length) {
      return NextResponse.json(
        { error: 'Invalid deck: each Assist Blade can only be used once' },
        { status: 400 },
      );
    }

    // Validate parts exist and are correct types
    const parts = await prisma.part.findMany({
      where: { id: { in: allPartIds } },
    });

    const partMap = new Map(parts.map((p) => [p.id, p]));

    for (const bey of beys) {
      const blade = partMap.get(bey.bladeId);
      const ratchet = partMap.get(bey.ratchetId);
      const bit = partMap.get(bey.bitId);

      if (!blade || (blade.type !== 'BLADE' && blade.type !== 'OVER_BLADE')) {
        return NextResponse.json(
          { error: `Invalid blade ID: ${bey.bladeId}` },
          { status: 400 },
        );
      }

      if (bey.overBladeId) {
        const overBlade = partMap.get(bey.overBladeId);
        if (!overBlade || overBlade.type !== 'OVER_BLADE') {
          return NextResponse.json(
            { error: `Invalid over blade ID: ${bey.overBladeId}` },
            { status: 400 },
          );
        }
      }

      if (!ratchet || ratchet.type !== 'RATCHET') {
        return NextResponse.json(
          { error: `Invalid ratchet ID: ${bey.ratchetId}` },
          { status: 400 },
        );
      }
      if (!bit || bit.type !== 'BIT') {
        return NextResponse.json(
          { error: `Invalid bit ID: ${bey.bitId}` },
          { status: 400 },
        );
      }

      if (bey.lockChipId) {
        const lockChip = partMap.get(bey.lockChipId);
        if (!lockChip || lockChip.type !== 'LOCK_CHIP') {
          return NextResponse.json(
            { error: `Invalid lock chip ID: ${bey.lockChipId}` },
            { status: 400 },
          );
        }
      }

      if (bey.assistBladeId) {
        const assistBlade = partMap.get(bey.assistBladeId);
        if (!assistBlade || assistBlade.type !== 'ASSIST_BLADE') {
          return NextResponse.json(
            { error: `Invalid assist blade ID: ${bey.assistBladeId}` },
            { status: 400 },
          );
        }
      }
    }

    // If setting as active, deactivate other decks
    if (isActive) {
      await prisma.deck.updateMany({
        where: { userId: session.user.id, isActive: true },
        data: { isActive: false },
      });
    }

    // Create deck with beys
    const deck = await prisma.deck.create({
      data: {
        name,
        isActive: isActive ?? false,
        userId: session.user.id,
        items: {
          create: beys.map((bey) => ({
            position: bey.position,
            bladeId: bey.bladeId,
            overBladeId: bey.overBladeId || null,
            ratchetId: bey.ratchetId,
            bitId: bey.bitId,
            lockChipId: bey.lockChipId || null,
            assistBladeId: bey.assistBladeId || null,
          })),
        },
      },
      include: {
        items: DECK_ITEMS_INCLUDE,
      },
    });

    const formattedDeck = {
      ...deck,
      beys: deck.items,
    };

    return NextResponse.json({ data: formattedDeck }, { status: 201 });
  } catch (error) {
    console.error('Error creating deck:', error);
    return NextResponse.json(
      { error: 'Failed to create deck' },
      { status: 500 },
    );
  }
}
