import { PartType } from '@prisma/client';
import { connection, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function getRandomPart(type: PartType) {
  const count = await prisma.part.count({ where: { type } });
  if (count === 0) return null;
  const skip = Math.floor(Math.random() * count);
  return await prisma.part.findFirst({
    where: { type },
    skip,
  });
}

export async function GET() {
  await connection();
  try {
    const [randomBlade, randomRatchet, randomBit] = await Promise.all([
      getRandomPart(PartType.BLADE),
      getRandomPart(PartType.RATCHET),
      getRandomPart(PartType.BIT),
    ]);

    if (!randomBlade || !randomRatchet || !randomBit) {
      return NextResponse.json(
        { error: 'Not enough parts found' },
        { status: 404 },
      );
    }

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
