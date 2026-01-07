'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { tournaments: true }
      }
    }
  })
}

export async function updateUserRole(id: string, role: string) {
  await prisma.user.update({
    where: { id },
    data: { role },
  })
  revalidatePath('/admin/users')
}

export async function deleteUser(id: string) {
  // Use caution when deleting users
  await prisma.user.delete({
    where: { id },
  })
  revalidatePath('/admin/users')
}
