'use server';

import type { ProductLine, ProductType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

interface GetProductsParams {
  search?: string;
  productLine?: ProductLine | 'ALL';
  productType?: ProductType | 'ALL';
  page?: number;
  pageSize?: number;
}

export async function getPublicProducts({
  search,
  productLine,
  productType,
  page = 1,
  pageSize = 24,
}: GetProductsParams = {}) {
  const where: Record<string, unknown> = {};

  if (search?.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { nameEn: { contains: term, mode: 'insensitive' } },
      { nameFr: { contains: term, mode: 'insensitive' } },
      { code: { contains: term, mode: 'insensitive' } },
      { nameHasbro: { contains: term, mode: 'insensitive' } },
    ];
  }

  if (productLine && productLine !== 'ALL') {
    where.productLine = productLine;
  }

  if (productType && productType !== 'ALL') {
    where.productType = productType;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        beyblades: {
          include: {
            blade: true,
            ratchet: true,
            bit: true,
          },
        },
      },
      orderBy: [{ releaseDate: 'desc' }, { code: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getProductByCode(code: string) {
  return prisma.product.findUnique({
    where: { code },
    include: {
      beyblades: {
        include: {
          blade: true,
          ratchet: true,
          bit: true,
        },
      },
    },
  });
}
