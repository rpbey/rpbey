'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

import { DiscordRoleMapping } from '@/lib/role-colors'

export type StaffMemberInput = {
  name: string
  role: string
  teamId: string
  imageUrl?: string
  discordId?: string
  displayIndex?: number
  isActive?: boolean
}

export interface DiscordMember {
  id: string
  username: string
  displayName?: string
  avatar?: string
}

export interface DiscordRole {
  id: string
  name: string
  color: string
}

async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const userRole = (session?.user as { role?: string } | undefined)?.role
  if (!session || (userRole !== 'admin' && userRole !== 'superadmin')) {
    throw new Error('Non autorisé')
  }
  return session
}

export async function getStaffMembers() {
  return await prisma.staffMember.findMany({
    orderBy: [
      { teamId: 'asc' },
      { displayIndex: 'asc' },
    ],
  })
}

export async function createStaffMember(data: StaffMemberInput) {
  await checkAdmin()

  const member = await prisma.staffMember.create({
    data,
  })

  revalidatePath('/admin/staff')
  revalidatePath('/notre-equipe')
  return member
}

export async function updateStaffMember(id: string, data: Partial<StaffMemberInput>) {
  await checkAdmin()

  const member = await prisma.staffMember.update({
    where: { id },
    data,
  })

  revalidatePath('/admin/staff')
  revalidatePath('/notre-equipe')
  return member
}

export async function deleteStaffMember(id: string) {
  await checkAdmin()

  await prisma.staffMember.delete({
    where: { id },
  })

  revalidatePath('/admin/staff')
  revalidatePath('/notre-equipe')
  return { success: true }
}

export async function getDiscordRoles(): Promise<DiscordRole[]> {
  await checkAdmin()
  const botUrl = process.env.BOT_API_URL || 'http://localhost:3001'
  const apiKey = process.env.BOT_API_KEY

  try {
    const response = await fetch(`${botUrl}/api/roles`, {
      headers: { 'x-api-key': apiKey || '' },
      cache: 'no-store',
    })
    if (!response.ok) return []
    const data = await response.json()
    return (data.roles as DiscordRole[]) || []
  } catch (error) {
    console.error('Failed to fetch roles:', error)
    return []
  }
}

export async function getMembersByRole(roleId: string): Promise<DiscordMember[]> {
  await checkAdmin()
  const botUrl = process.env.BOT_API_URL || 'http://localhost:3001'
  const apiKey = process.env.BOT_API_KEY

  try {
    const response = await fetch(`${botUrl}/api/members-by-role?roleId=${roleId}`, {
      headers: { 'x-api-key': apiKey || '' },
      cache: 'no-store',
    })
    if (!response.ok) return []
    const data = await response.json()
    return (data.members as DiscordMember[]) || []
  } catch (error) {
    console.error('Failed to fetch members by role:', error)
    return []
  }
}

export async function syncStaffFromDiscord() {
  await checkAdmin()
  
  const results = {
    added: 0,
    updated: 0,
    errors: 0
  }

  // Priority definition (Higher number = Higher priority)
  const ROLE_PRIORITY: Record<string, number> = {
    'ADMIN': 4,
    'RH': 3,
    'MODO': 2,
    'STAFF': 1
  }

  const staffMap = new Map<string, {
    member: DiscordMember,
    roleType: string,
    priority: number
  }>()

  // 1. Collect all members from all mapped roles
  for (const [roleId, roleType] of Object.entries(DiscordRoleMapping)) {
    try {
      const members = await getMembersByRole(roleId)
      const priority = ROLE_PRIORITY[roleType] || 0

      for (const member of members) {
        const existing = staffMap.get(member.id)
        
        // If user not seen yet, or this role has higher priority, update map
        if (!existing || priority > existing.priority) {
          staffMap.set(member.id, {
            member,
            roleType,
            priority
          })
        }
      }
    } catch (e) {
      console.error(`Failed to fetch members for role ${roleType} (${roleId}):`, e)
      results.errors++
    }
  }

  // 2. Upsert unique users with their highest role
  for (const [discordId, { member, roleType }] of staffMap.entries()) {
    try {
      const teamId = roleType.toLowerCase()
      const existing = await prisma.staffMember.findFirst({
        where: { discordId }
      })

      const data = {
        name: member.displayName || member.username,
        role: roleType,
        teamId: teamId,
        imageUrl: member.avatar,
        discordId: member.id,
        isActive: true
      }

      if (existing) {
        await prisma.staffMember.update({
          where: { id: existing.id },
          data
        })
        results.updated++
      } else {
        await prisma.staffMember.create({ data })
        results.added++
      }
    } catch (e) {
      console.error('Sync error for member:', discordId, e)
      results.errors++
    }
  }

  revalidatePath('/admin/staff')
  revalidatePath('/notre-equipe')
  return results
}
