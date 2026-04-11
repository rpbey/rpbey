import { BOT_API_KEY, getBotApiUrl } from '@/lib/bot-config';
import { prisma } from '@/lib/prisma';
import { DiscordRoleMapping, type RoleType } from '@/lib/role-colors';
import type { BotMember } from '@/types';

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

  try {
    // Fetch from bot API + Discord invite API in parallel
    const [botRes, inviteRes] = await Promise.all([
      fetch(`${getBotApiUrl()}/api/status`, {
        headers: { 'x-api-key': BOT_API_KEY },
        next: { revalidate: 60 },
      }).catch(() => null),
      fetch('https://discord.com/api/v9/invites/rpb?with_counts=true', {
        next: { revalidate: 60 },
      }).catch(() => null),
    ]);

    const botData = botRes?.ok ? await botRes.json() : null;
    const inviteData = inviteRes?.ok ? await inviteRes.json() : null;

    return {
      serverName: inviteData?.guild?.name || fallbackName,
      memberCount:
        botData?.memberCount || inviteData?.approximate_member_count || 0,
      onlineCount:
        inviteData?.approximate_presence_count || botData?.onlineCount || 0,
    };
  } catch (error) {
    console.error('Failed to fetch Discord stats:', error);
  }

  return { onlineCount: 0, memberCount: 0, serverName: fallbackName };
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
