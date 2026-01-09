/**
 * RPB - Parts API
 * GET /api/parts - Liste toutes les pièces avec filtres
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PartType, BeyType } from '@prisma/client'
import { connection } from 'next/server'

export async function GET(request: NextRequest) {
  await connection()
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const type = searchParams.get('type') as PartType | null
    const beyType = searchParams.get('beyType') as BeyType | null
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') ?? '100', 10)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)

    // Build where clause
    const where: Record<string, unknown> = {}

    if (type && Object.values(PartType).includes(type)) {
      where.type = type
    }

    if (beyType && Object.values(BeyType).includes(beyType)) {
      where.beyType = beyType
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { externalId: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch parts
    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        take: Math.min(limit, 500),
        skip: offset,
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      }),
      prisma.part.count({ where }),
    ])

    return NextResponse.json({
      data: parts,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + parts.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching parts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parts' },
      { status: 500 }
    )
  }
}
