'use server';

import type { PartType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function getPublicParts(params: {
  search?: string;
  type?: PartType | 'ALL';
  systems?: string[];
  spin?: string;
  beyTypes?: string[];
  page?: number;
  pageSize?: number;
}) {
  const {
    search,
    type,
    systems,
    spin,
    beyTypes,
    page = 1,
    pageSize = 24,
  } = params;
  const take = pageSize;
  const skip = (page - 1) * take;

  // biome-ignore lint/suspicious/noExplicitAny: Dynamic Prisma query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (type && type !== 'ALL') {
    if (type === 'BLADE') {
      where.type = { in: ['BLADE', 'OVER_BLADE'] };
    } else {
      where.type = type;
    }
  }

  if (systems && systems.length > 0) {
    where.system = { in: systems };
  }

  if (spin && spin !== 'ALL') {
    where.spinDirection = spin;
  }

  if (beyTypes && beyTypes.length > 0) {
    // Map string[] to BeyType enum (Prisma handles strings for enums usually, but let's be safe if types mismatch)
    // biome-ignore lint/suspicious/noExplicitAny: Enum matching
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where.beyType = { in: beyTypes as any };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { externalId: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [parts, total] = await Promise.all([
    prisma.part.findMany({
      where,
      take,
      skip,
      orderBy: { name: 'asc' },
    }),
    prisma.part.count({ where }),
  ]);

  return {
    parts,
    total,
    totalPages: Math.ceil(total / take),
  };
}
