'use server';

import { exec } from 'child_process';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { promisify } from 'util';
import { auth } from '@/lib/auth';
import {
  getMembersByRole as getBotMembersByRole,
  getDiscordRoles as getBotRoles,
} from '@/lib/bot';
import { prisma } from '@/lib/prisma';

const execAsync = promisify(exec);

export type StaffMemberInput = {
  name: string;
  role: string;
  teamId: string;
  imageUrl?: string;
  discordId?: string;
  displayIndex?: number;
  isActive?: boolean;
};

async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userRole = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (userRole !== 'admin' && userRole !== 'superadmin')) {
    throw new Error('Non autorisé');
  }
  return session;
}

export async function getStaffMembers() {
  await checkAdmin();
  return await prisma.staffMember.findMany({
    orderBy: [{ role: 'asc' }, { displayIndex: 'asc' }],
  });
}

export async function createStaffMember(data: StaffMemberInput) {
  await checkAdmin();

  const member = await prisma.staffMember.create({
    data,
  });

  revalidatePath('/admin/staff');
  revalidatePath('/notre-equipe');
  return member;
}

export async function updateStaffMember(
  id: string,
  data: Partial<StaffMemberInput>,
) {
  await checkAdmin();

  const member = await prisma.staffMember.update({
    where: { id },
    data,
  });

  revalidatePath('/admin/staff');
  revalidatePath('/notre-equipe');
  return member;
}

export async function deleteStaffMember(id: string) {
  await checkAdmin();

  await prisma.staffMember.delete({
    where: { id },
  });

  revalidatePath('/admin/staff');
  revalidatePath('/notre-equipe');
  return { success: true };
}

export async function syncStaffFromDiscord() {
  await checkAdmin();

  console.log('[SyncStaff] Triggering sync script...');

  try {
    const { stdout, stderr } = await execAsync(
      'npx tsx scripts/sync-staff-db.ts',
    );

    console.log('[SyncStaff] Script output:', stdout);
    if (stderr) console.error('[SyncStaff] Script stderr:', stderr);

    const addedMatch = stdout.match(/Added: (\d+)/);
    const updatedMatch = stdout.match(/Updated: (\d+)/);

    revalidatePath('/admin/staff');
    revalidatePath('/notre-equipe');

    return {
      added: addedMatch?.[1] ? parseInt(addedMatch[1]) : 0,
      updated: updatedMatch?.[1] ? parseInt(updatedMatch[1]) : 0,
      success: true,
    };
  } catch (error) {
    console.error('[SyncStaff] Execution failed:', error);
    throw new Error('Failed to run sync script');
  }
}

export async function getDiscordRoles() {
  await checkAdmin();
  return getBotRoles();
}

export async function getMembersByRole(roleId: string) {
  await checkAdmin();
  return getBotMembersByRole(roleId);
}
