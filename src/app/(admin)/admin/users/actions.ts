'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

export async function getUsers(page = 1, pageSize = 10, search = '') {
  const skip = (page - 1) * pageSize;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { tournaments: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function updateUserRole(id: string, role: string) {
  await prisma.user.update({
    where: { id },
    data: { role },
  });
  revalidatePath('/admin/users');
}

export async function deleteUser(id: string) {
  // Use caution when deleting users
  await prisma.user.delete({
    where: { id },
  });
  revalidatePath('/admin/users');
}
