'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function getContent(slug: string) {
  const block = await prisma.contentBlock.findUnique({
    where: { slug },
  });
  return block;
}

export async function upsertContent(
  slug: string,
  content: string,
  title?: string,
) {
  await prisma.contentBlock.upsert({
    where: { slug },
    update: { content, title, type: 'markdown' },
    create: { slug, content, title, type: 'markdown' },
  });
  revalidatePath('/');
  revalidatePath(`/${slug}`);
  return { success: true };
}
