import { getBotStatus } from '@/lib/bot';
import prisma from '@/lib/prisma';
import { DiscordRoleMapping, type RoleType } from '@/lib/role-colors';
import type { BotMember } from '@/types';

const DISCORD_INVITE_CODE = 'twdVfesrRj';
const DISCORD_INVITE_URL = `https://discord.com/api/v9/invites/${DISCORD_INVITE_CODE}?with_counts=true`;

export interface DiscordStats {
  onlineCount: number;
  memberCount: number;
  serverName: string;
}

export interface TeamGroup {
  roleId: string;
  roleType: RoleType;
  members: BotMember[];
}

export async function getDiscordStats(): Promise<DiscordStats> {
  const fallbackName = 'République Populaire du Beyblade';
  let serverName = fallbackName;
  let onlineCount = 0;
  let memberCount = 0;

  try {
    // 1. Fetch Invite API for accurate server name and fallback counts
    const inviteRes = await fetch(DISCORD_INVITE_URL, {
      next: { revalidate: 60 },
    });
    if (inviteRes.ok) {
      const inviteData = await inviteRes.json();
      serverName = inviteData.guild?.name || fallbackName;
      onlineCount = inviteData.approximate_presence_count || 0;
      memberCount = inviteData.approximate_member_count || 0;
    }

    // 2. Try internal bot API for potentially more accurate realtime counts
    // (Only if available, avoiding critical failure if bot is ratelimited)
    try {
      const status = await getBotStatus();
      if (status && status.memberCount > 0) {
        onlineCount = status.onlineCount;
        memberCount = status.memberCount;
      }
    } catch {
      // Ignore bot status error
    }
  } catch (error) {
    console.error('Failed to fetch Discord stats:', error);
  }

  return {
    onlineCount,
    memberCount,
    serverName,
  };
}

export async function getDiscordTeam(): Promise<TeamGroup[]> {
  try {
    // Fetch from Database (Source of Truth via /sync command)
    const staffMembers = await prisma.staffMember.findMany({
      where: { isActive: true },
      orderBy: [{ displayIndex: 'asc' }, { createdAt: 'desc' }],
    });

    const roles = Object.entries(DiscordRoleMapping);

    // Group by Role
    const teamData = roles.map(([roleId, roleType]) => {
      // Filter members who have this role assigned in DB
      // Note: member.role in DB is the RoleType key (e.g. "ADMIN")
      const members = staffMembers
        .filter((m) => m.role === roleType)
        .map((m) => {
          // Map Prisma model to BotMember interface
          return {
            id: m.discordId || m.id,
            username: m.name,
            displayName: m.nickname || m.name,
            avatar: m.imageUrl,
            nickname: m.nickname || undefined,
            joinedAt: m.joinedAt?.toISOString(),
            premiumSince: m.premiumSince?.toISOString() || null,
            roles: (m.roles as unknown[]) || [],
            status: m.status || undefined,
            activities: (m.activities as unknown[]) || [],
            serverAvatar: m.serverAvatar || null,
            globalName: m.globalName || null,
            createdAt: m.accountCreatedAt?.toISOString(),
          } as BotMember;
        });

      return {
        roleId,
        roleType: roleType as RoleType,
        members,
      };
    });

    // Sort order: ADMIN -> RH -> ARBITRE -> STAFF -> Others
    const sortOrder: RoleType[] = ['ADMIN', 'RH', 'ARBITRE', 'STAFF'];
    
    return teamData
      .filter((t) => t.members.length > 0)
      .sort((a, b) => {
        const indexA = sortOrder.indexOf(a.roleType);
        const indexB = sortOrder.indexOf(b.roleType);
        
        // Items in sortOrder come first
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        // Fallback to alphabetical or defined order
        return 0;
      });
  } catch (error) {
    console.error('Failed to fetch Discord team:', error);
    return [];
  }
}
