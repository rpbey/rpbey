'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    role?: string;
    banned?: boolean;
    banReason?: string;
  },
) {
  await requireAdmin();

  const validRoles = ['user', 'moderator', 'staff', 'admin'];
  if (data.role && !validRoles.includes(data.role)) {
    throw new Error('Rôle invalide');
  }

  await prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.banned !== undefined && { banned: data.banned }),
      ...(data.banReason !== undefined && { banReason: data.banReason }),
      ...(!data.banned && { banReason: null, banExpires: null }),
    },
  });
  revalidatePath('/admin/users');
}

export async function updateUserRole(id: string, role: string) {
  await requireAdmin();
  await prisma.user.update({
    where: { id },
    data: { role },
  });
  revalidatePath('/admin/users');
}

export async function deleteUser(id: string) {
  await requireAdmin();
  await prisma.user.delete({
    where: { id },
  });
  revalidatePath('/admin/users');
}
