/**
 * RPB - Decks API
 * GET /api/decks - List user's decks
 * POST /api/decks - Create a new deck
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// GET - List user's decks
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decks = await prisma.deck.findMany({
      where: { userId: session.user.id },
      include: {
        beys: {
          include: {
            blade: true,
            ratchet: true,
            bit: true,
          },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
    })

    return NextResponse.json({ data: decks })
  } catch (error) {
    console.error('Error fetching decks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch decks' },
      { status: 500 }
    )
  }
}

// POST - Create a new deck
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, beys, isActive } = body as {
      name: string
      isActive?: boolean
      beys: Array<{
        position: number
        nickname?: string
        bladeId: string
        ratchetId: string
        bitId: string
      }>
    }

    // Validate input
    if (!name || !beys || beys.length !== 3) {
      return NextResponse.json(
        { error: 'Invalid deck: name and exactly 3 beys required' },
        { status: 400 }
      )
    }

    // Validate uniqueness of parts within deck
    const allPartIds = beys.flatMap((b) => [b.bladeId, b.ratchetId, b.bitId])
    const uniquePartIds = new Set(allPartIds)
    if (uniquePartIds.size !== allPartIds.length) {
      return NextResponse.json(
        { error: 'Invalid deck: each part can only be used once' },
        { status: 400 }
      )
    }

    // Validate parts exist and are correct types
    const parts = await prisma.part.findMany({
      where: { id: { in: allPartIds } },
    })

    const partMap = new Map(parts.map((p) => [p.id, p]))

    for (const bey of beys) {
      const blade = partMap.get(bey.bladeId)
      const ratchet = partMap.get(bey.ratchetId)
      const bit = partMap.get(bey.bitId)

      if (!blade || blade.type !== 'BLADE') {
        return NextResponse.json(
          { error: `Invalid blade ID: ${bey.bladeId}` },
          { status: 400 }
        )
      }
      if (!ratchet || ratchet.type !== 'RATCHET') {
        return NextResponse.json(
          { error: `Invalid ratchet ID: ${bey.ratchetId}` },
          { status: 400 }
        )
      }
      if (!bit || bit.type !== 'BIT') {
        return NextResponse.json(
          { error: `Invalid bit ID: ${bey.bitId}` },
          { status: 400 }
        )
      }
    }

    // If setting as active, deactivate other decks
    if (isActive) {
      await prisma.deck.updateMany({
        where: { userId: session.user.id, isActive: true },
        data: { isActive: false },
      })
    }

    // Create deck with beys
    const deck = await prisma.deck.create({
      data: {
        name,
        isActive: isActive ?? false,
        userId: session.user.id,
        beys: {
          create: beys.map((bey) => ({
            position: bey.position,
            nickname: bey.nickname,
            bladeId: bey.bladeId,
            ratchetId: bey.ratchetId,
            bitId: bey.bitId,
          })),
        },
      },
      include: {
        beys: {
          include: {
            blade: true,
            ratchet: true,
            bit: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    })

    return NextResponse.json({ data: deck }, { status: 201 })
  } catch (error) {
    console.error('Error creating deck:', error)
    return NextResponse.json(
      { error: 'Failed to create deck' },
      { status: 500 }
    )
  }
}
