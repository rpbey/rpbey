/**
 * RPB - Single Deck API
 * GET /api/decks/[id] - Get a deck by ID
 * PUT /api/decks/[id] - Update a deck
 * DELETE /api/decks/[id] - Delete a deck
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
    ratchet: true,
    bit: true,
    lockChip: true,
    assistBlade: true,
  },
  orderBy: { position: 'asc' as const },
};

// GET - Get a deck
export async function GET(
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

    const deck = await prisma.deck.findFirst({
      where: { id, userId: session.user.id },
      include: {
        items: DECK_ITEMS_INCLUDE,
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    return NextResponse.json({ data: deck });
  } catch (error) {
    console.error('Error fetching deck:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deck' },
      { status: 500 },
    );
  }
}

// PUT - Update a deck
export async function PUT(
  request: NextRequest,
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
    const body = await request.json();
    const { name, beys, isActive } = body as {
      name?: string;
      isActive?: boolean;
      beys?: Array<{
        position: number;
        nickname?: string;
        bladeId: string;
        ratchetId: string;
        bitId: string;
        lockChipId?: string;
        assistBladeId?: string;
      }>;
    };

    // Check ownership
    const existingDeck = await prisma.deck.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingDeck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // If updating beys, validate them
    if (beys) {
      if (beys.length !== 3) {
        return NextResponse.json(
          { error: 'Invalid deck: exactly 3 beys required' },
          { status: 400 },
        );
      }

      const standardPartIds = beys.flatMap((b) => [b.bladeId, b.ratchetId, b.bitId]);
      const uniqueStandardIds = new Set(standardPartIds);
      if (uniqueStandardIds.size !== standardPartIds.length) {
        return NextResponse.json(
          { error: 'Invalid deck: each part can only be used once' },
          { status: 400 },
        );
      }

      // Collect all part IDs for validation
      const allPartIds = [...standardPartIds];
      for (const bey of beys) {
        if (bey.lockChipId) allPartIds.push(bey.lockChipId);
        if (bey.assistBladeId) allPartIds.push(bey.assistBladeId);
      }

      // Validate assist blade uniqueness
      const assistBladeIds = beys.map((b) => b.assistBladeId).filter(Boolean) as string[];
      const uniqueAssistIds = new Set(assistBladeIds);
      if (uniqueAssistIds.size !== assistBladeIds.length) {
        return NextResponse.json(
          { error: 'Invalid deck: each Assist Blade can only be used once' },
          { status: 400 },
        );
      }

      const parts = await prisma.part.findMany({
        where: { id: { in: allPartIds } },
      });

      const partMap = new Map(parts.map((p) => [p.id, p]));

      for (const bey of beys) {
        const blade = partMap.get(bey.bladeId);
        const ratchet = partMap.get(bey.ratchetId);
        const bit = partMap.get(bey.bitId);

        if (!blade || blade.type !== 'BLADE') {
          return NextResponse.json(
            { error: `Invalid blade ID: ${bey.bladeId}` },
            { status: 400 },
          );
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
    }

    // If setting as active, deactivate other decks
    if (isActive) {
      await prisma.deck.updateMany({
        where: { userId: session.user.id, isActive: true, NOT: { id } },
        data: { isActive: false },
      });
    }

    // Update deck
    const deck = await prisma.deck.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(isActive !== undefined && { isActive }),
        ...(beys && {
          items: {
            deleteMany: {},
            create: beys.map((bey) => ({
              position: bey.position,
              bladeId: bey.bladeId,
              ratchetId: bey.ratchetId,
              bitId: bey.bitId,
              lockChipId: bey.lockChipId || null,
              assistBladeId: bey.assistBladeId || null,
            })),
          },
        }),
      },
      include: {
        items: DECK_ITEMS_INCLUDE,
      },
    });

    return NextResponse.json({ data: deck });
  } catch (error) {
    console.error('Error updating deck:', error);
    return NextResponse.json(
      { error: 'Failed to update deck' },
      { status: 500 },
    );
  }
}

// DELETE - Delete a deck
export async function DELETE(
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

    await prisma.deck.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deck:', error);
    return NextResponse.json(
      { error: 'Failed to delete deck' },
      { status: 500 },
    );
  }
}
