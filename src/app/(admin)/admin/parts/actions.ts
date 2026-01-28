'use server';

import type { Part } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role;
  if (role !== 'admin' && role !== 'superadmin')
    throw new Error('Unauthorized');
}

export async function getParts(search?: string, page = 1) {
  await checkAdmin();
  const take = 50;
  const skip = (page - 1) * take;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { externalId: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [parts, total] = await Promise.all([
    prisma.part.findMany({ where, take, skip, orderBy: { name: 'asc' } }),
    prisma.part.count({ where }),
  ]);

  return { parts, total, totalPages: Math.ceil(total / take) };
}

export async function upsertPart(data: Partial<Part>) {
  await checkAdmin();

  if (!data.name || !data.type) throw new Error('Name and Type are required');

  // Generate externalId if not provided, or update it if name changes (optional, but good for consistency)
  const generatedId = `${data.type}-${data.name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  
  const externalId = data.externalId || generatedId;

  if (data.id) {
    // Update existing
    await prisma.part.update({
      where: { id: data.id },
      data: {
        name: data.name,
        type: data.type,
        externalId: data.externalId, // Allow manual override or keep existing
        weight: data.weight,
        system: data.system,
        spinDirection: data.spinDirection,
        imageUrl: data.imageUrl,
        beyType: data.beyType,
        attack: data.attack,
        defense: data.defense,
        stamina: data.stamina,
        dash: data.dash,
        burst: data.burst,
      },
    });
  } else {
    // Create new
    await prisma.part.create({
      data: {
        externalId, // Use generated or provided
        name: data.name,
        type: data.type,
        weight: data.weight,
        system: data.system || 'BX',
        spinDirection: data.spinDirection,
        imageUrl: data.imageUrl,
        beyType: data.beyType,
        attack: data.attack,
        defense: data.defense,
        stamina: data.stamina,
        dash: data.dash,
        burst: data.burst,
      },
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
