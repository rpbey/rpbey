import { PartType } from '@prisma/client';
import { NextResponse, connection } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  await connection();
  try {
    const [blades, ratchets, bits] = await Promise.all([
      prisma.part.findMany({ where: { type: PartType.BLADE } }),
      prisma.part.findMany({ where: { type: PartType.RATCHET } }),
      prisma.part.findMany({ where: { type: PartType.BIT } }),
    ]);

    if (!blades.length || !ratchets.length || !bits.length) {
      return NextResponse.json(
        { error: 'Not enough parts found' },
        { status: 404 },
      );
    }

    const randomBlade = blades[Math.floor(Math.random() * blades.length)];
    const randomRatchet = ratchets[Math.floor(Math.random() * ratchets.length)];
    const randomBit = bits[Math.floor(Math.random() * bits.length)];

    return NextResponse.json({
      blade: randomBlade,
      ratchet: randomRatchet,
      bit: randomBit,
    });
  } catch (error) {
    console.error('Failed to fetch random parts:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
