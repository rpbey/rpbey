'use server';

import type { Part, PartType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)
    throw new Error('Non connecté — veuillez vous identifier');

  // Try role from session first (set by session callback)
  const sessionRole = (session.user as { role?: string }).role;
  if (sessionRole === 'admin' || sessionRole === 'superadmin') return;

  // Fallback: check role directly in the database
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (dbUser?.role === 'admin' || dbUser?.role === 'superadmin') return;

  throw new Error('Accès réservé aux administrateurs');
}

export async function getPartsStats() {
  const [total, byType, bySystem, byBeyType, missingImage, recentlyUpdated] =
    await Promise.all([
      prisma.part.count(),
      prisma.part.groupBy({ by: ['type'], _count: true }),
      prisma.part.groupBy({
        by: ['system'],
        _count: true,
        where: { system: { not: null } },
      }),
      prisma.part.groupBy({
        by: ['beyType'],
        _count: true,
        where: { beyType: { not: null } },
      }),
      prisma.part.count({ where: { imageUrl: null } }),
      prisma.part.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

  return {
    total,
    byType: byType.map((t) => ({ type: t.type, count: t._count })),
    bySystem: bySystem.map((s) => ({
      system: s.system ?? 'N/A',
      count: s._count,
    })),
    byBeyType: byBeyType.map((b) => ({
      beyType: b.beyType ?? 'N/A',
      count: b._count,
    })),
    missingImage,
    recentlyUpdated,
  };
}

export async function getParts(
  search?: string,
  page = 1,
  filters?: {
    type?: PartType;
    system?: string;
    beyType?: string;
    missingImage?: boolean;
  },
) {
  const take = 100;
  const skip = (page - 1) * take;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { externalId: { contains: search, mode: 'insensitive' } },
      { nameJp: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (filters?.type) where.type = filters.type;
  if (filters?.system) where.system = filters.system;
  if (filters?.beyType) where.beyType = filters.beyType;
  if (filters?.missingImage) where.imageUrl = null;

  const [parts, total] = await Promise.all([
    prisma.part.findMany({ where, take, skip, orderBy: { name: 'asc' } }),
    prisma.part.count({ where }),
  ]);

  return { parts, total, totalPages: Math.ceil(total / take) };
}

export async function upsertPart(data: Partial<Part>) {
  await checkAdmin();

  if (!data.name || !data.type) throw new Error('Name and Type are required');

  const generatedId = `${data.type}-${data.name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  const externalId = data.externalId || generatedId;

  const partData = {
    name: data.name,
    nameJp: data.nameJp,
    type: data.type,
    externalId: data.externalId,
    weight: data.weight,
    system: data.system,
    spinDirection: data.spinDirection,
    imageUrl: data.imageUrl,
    modelUrl: data.modelUrl,
    textureUrl: data.textureUrl,
    beyType: data.beyType,
    attack: data.attack,
    defense: data.defense,
    stamina: data.stamina,
    dash: data.dash,
    burst: data.burst,
    height: data.height,
    protrusions: data.protrusions,
    gearRatio: data.gearRatio,
    shaftWidth: data.shaftWidth,
    tipType: data.tipType,
    rarity: data.rarity,
    releaseDate: data.releaseDate,
  };

  if (data.id) {
    await prisma.part.update({ where: { id: data.id }, data: partData });
  } else {
    await prisma.part.create({
      data: { ...partData, externalId, system: data.system || 'BX' },
    });
  }

  revalidatePath('/admin/parts');
  return { success: true };
}

export async function deletePart(id: string) {
  await checkAdmin();
  await prisma.part.delete({ where: { id } });
  revalidatePath('/admin/parts');
}

export async function bulkImportParts(
  partsData: Partial<Part>[],
): Promise<{ created: number; updated: number; errors: string[] }> {
  await checkAdmin();

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const data of partsData) {
    if (!data.name || !data.type) {
      errors.push(`Ignoré: nom ou type manquant (${data.name ?? 'sans nom'})`);
      continue;
    }

    const externalId =
      data.externalId ||
      `${data.type}-${data.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
      const existing = await prisma.part.findUnique({
        where: { externalId },
      });

      const partData = {
        name: data.name,
        nameJp: data.nameJp ?? null,
        type: data.type,
        weight: data.weight ?? null,
        system: data.system ?? 'BX',
        spinDirection: data.spinDirection ?? null,
        imageUrl: data.imageUrl ?? null,
        beyType: data.beyType ?? null,
        attack: data.attack ?? null,
        defense: data.defense ?? null,
        stamina: data.stamina ?? null,
        dash: data.dash ?? null,
        burst: data.burst ?? null,
        height: data.height ?? null,
        protrusions: data.protrusions ?? null,
        gearRatio: data.gearRatio ?? null,
        shaftWidth: data.shaftWidth ?? null,
        tipType: data.tipType ?? null,
        rarity: data.rarity ?? null,
      };

      if (existing) {
        await prisma.part.update({
          where: { id: existing.id },
          data: partData,
        });
        updated++;
      } else {
        await prisma.part.create({ data: { ...partData, externalId } });
        created++;
      }
    } catch (err) {
      errors.push(`Erreur sur "${data.name}": ${String(err)}`);
    }
  }

  revalidatePath('/admin/parts');
  return { created, updated, errors };
}

export async function duplicatePart(id: string) {
  await checkAdmin();
  const original = await prisma.part.findUniqueOrThrow({ where: { id } });
  const newName = `${original.name} (copie)`;
  const externalId = `${original.type}-${newName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  await prisma.part.create({
    data: {
      externalId,
      name: newName,
      nameJp: original.nameJp,
      type: original.type,
      weight: original.weight,
      system: original.system,
      spinDirection: original.spinDirection,
      imageUrl: original.imageUrl,
      beyType: original.beyType,
      attack: original.attack,
      defense: original.defense,
      stamina: original.stamina,
      dash: original.dash,
      burst: original.burst,
      height: original.height,
      protrusions: original.protrusions,
      gearRatio: original.gearRatio,
      shaftWidth: original.shaftWidth,
      tipType: original.tipType,
      rarity: original.rarity,
    },
  });

  revalidatePath('/admin/parts');
  return { success: true };
}

// Beyblades management
export async function getBeyblades(search?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  return prisma.beyblade.findMany({
    where,
    include: { blade: true, ratchet: true, bit: true, product: true },
    orderBy: { name: 'asc' },
    take: 200,
  });
}

export async function upsertBeyblade(data: {
  id?: string;
  code: string;
  name: string;
  nameEn?: string;
  nameFr?: string;
  bladeId: string;
  ratchetId: string;
  bitId: string;
  beyType?: string;
  imageUrl?: string;
}) {
  await checkAdmin();

  // Calculate aggregated stats
  const [blade, ratchet, bit] = await Promise.all([
    prisma.part.findUniqueOrThrow({ where: { id: data.bladeId } }),
    prisma.part.findUniqueOrThrow({ where: { id: data.ratchetId } }),
    prisma.part.findUniqueOrThrow({ where: { id: data.bitId } }),
  ]);

  const sum = (a?: string | null, b?: string | null, c?: string | null) =>
    (parseInt(a ?? '0', 10) || 0) +
    (parseInt(b ?? '0', 10) || 0) +
    (parseInt(c ?? '0', 10) || 0);

  const beyData = {
    code: data.code,
    name: data.name,
    nameEn: data.nameEn,
    nameFr: data.nameFr,
    bladeId: data.bladeId,
    ratchetId: data.ratchetId,
    bitId: data.bitId,
    beyType:
      (data.beyType as 'ATTACK' | 'DEFENSE' | 'STAMINA' | 'BALANCE') ??
      blade.beyType,
    imageUrl: data.imageUrl,
    totalAttack: sum(blade.attack, ratchet.attack, bit.attack),
    totalDefense: sum(blade.defense, ratchet.defense, bit.defense),
    totalStamina: sum(blade.stamina, ratchet.stamina, bit.stamina),
    totalBurst: sum(blade.burst, ratchet.burst, bit.burst),
    totalDash: sum(blade.dash, ratchet.dash, bit.dash),
    totalWeight:
      (blade.weight ?? 0) + (ratchet.weight ?? 0) + (bit.weight ?? 0),
  };

  if (data.id) {
    await prisma.beyblade.update({ where: { id: data.id }, data: beyData });
  } else {
    await prisma.beyblade.create({ data: beyData });
  }

  revalidatePath('/admin/parts');
  return { success: true };
}

export async function deleteBeyblade(id: string) {
  await checkAdmin();
  await prisma.beyblade.delete({ where: { id } });
  revalidatePath('/admin/parts');
}

// Products management
export async function getProducts(search?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  return prisma.product.findMany({
    where,
    include: { beyblades: true },
    orderBy: { name: 'asc' },
    take: 200,
  });
}
