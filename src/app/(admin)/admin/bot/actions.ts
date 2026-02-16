'use server';

import { revalidatePath } from 'next/cache';
import { botClient } from '@/lib/bot';
import { prisma } from '@/lib/prisma';

export type BotCommandInput = {
  name: string;
  description: string;
  response: string;
  enabled: boolean;
  aliases?: string[];
  cooldown?: number;
  allowedRoles?: string[];
};

export async function getBotCommands() {
  return await prisma.botCommand.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createBotCommand(data: BotCommandInput) {
  await prisma.botCommand.create({
    data,
  });
  revalidatePath('/admin/bot/commands');
}

export async function updateBotCommand(id: string, data: BotCommandInput) {
  await prisma.botCommand.update({
    where: { id },
    data,
  });
  revalidatePath('/admin/bot/commands');
}

export async function deleteBotCommand(id: string) {
  await prisma.botCommand.delete({
    where: { id },
  });
  revalidatePath('/admin/bot/commands');
}

export async function syncBotCommands() {
  try {
    await botClient.post('/api/sync-commands');
    return { success: true };
  } catch (error) {
    console.error('Failed to sync bot commands:', error);
    return { success: false, error: 'Failed to sync with bot' };
  }
}
