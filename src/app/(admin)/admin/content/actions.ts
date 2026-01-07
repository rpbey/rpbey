'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type ContentBlockInput = {
  slug: string
  title: string
  type: string
  content: string
}

export async function getContentBlocks() {
  return await prisma.contentBlock.findMany({
    orderBy: { slug: 'asc' },
  })
}

export async function updateContentBlock(id: string, data: ContentBlockInput) {
  const { slug, title, type, content } = data
  
  await prisma.contentBlock.update({
    where: { id },
    data: {
      slug,
      title,
      type,
      content,
    },
  })

  revalidatePath('/admin/content')
  revalidatePath('/') // Revalidate potentially everything since content can be anywhere
}

export async function createContentBlock(data: ContentBlockInput) {
  const { slug, title, type, content } = data
  
  await prisma.contentBlock.create({
    data: {
      slug,
      title,
      type,
      content,
    },
  })

  revalidatePath('/admin/content')
}

export async function deleteContentBlock(id: string) {
  await prisma.contentBlock.delete({
    where: { id },
  })

  revalidatePath('/admin/content')
}
