'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

import { DiscordRoleMapping } from '@/lib/role-colors';
import type { BotMember } from '@/types';

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
  return await prisma.staffMember.findMany({
    orderBy: [{ teamId: 'asc' }, { displayIndex: 'asc' }],
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

export async function getDiscordRoles() {
  await checkAdmin();
  const { getDiscordRoles } = await import('@/lib/bot');
  return await getDiscordRoles();
}

export async function getMembersByRole(roleId: string) {
  await checkAdmin();
  const { getMembersByRole } = await import('@/lib/bot');
  return await getMembersByRole(roleId);
}

import { getBotApiUrl } from '@/lib/bot-config';

// ... (existing imports)

export async function syncStaffFromDiscord() {
  await checkAdmin();

  console.log(`[SyncStaff] Starting sync using Bot URL: ${getBotApiUrl()}`);

  const results = {
    added: 0,
    updated: 0,
    errors: 0,
  };

  // ... (existing priority definition)

  // 1. Collect all members from all mapped roles
  for (const [roleId, roleType] of Object.entries(DiscordRoleMapping)) {
    try {
      console.log(`[SyncStaff] Fetching role ${roleType} (${roleId})...`);
      const members = await getMembersByRole(roleId);
      console.log(`[SyncStaff] Found ${members.length} members for ${roleType}`);
      
      const priority = ROLE_PRIORITY[roleType] || 0;

      for (const member of members) {
        // ... (existing map logic)
      }
    } catch (e) {
      console.error(
        `[SyncStaff] Failed to fetch members for role ${roleType} (${roleId}):`,
        e,
      );
      results.errors++;
    }
  }

  // 2. Upsert unique users with their highest role
  for (const [discordId, { member, roleType }] of staffMap.entries()) {
    try {
      // ... (existing upsert logic)
    } catch (e) {
      console.error('[SyncStaff] Sync error for member:', discordId, e);
      results.errors++;
    }
  }
  
  console.log('[SyncStaff] Sync complete:', results);

  revalidatePath('/admin/staff');
  revalidatePath('/notre-equipe');
  return results;
}
