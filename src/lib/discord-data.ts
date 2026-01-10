import { getBotStatus, getMembersByRole } from '@/lib/bot';
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
    const status = await getBotStatus();
    if (status && status.memberCount > 0) {
      onlineCount = status.onlineCount;
      memberCount = status.memberCount;
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
    const roles = Object.keys(DiscordRoleMapping);
    const teamData = await Promise.all(
      roles.map(async (roleId) => {
        const members = await getMembersByRole(roleId);
        return {
          roleId,
          roleType: DiscordRoleMapping[roleId] || 'DEFAULT',
          members: members.slice(0, 5),
        };
      }),
    );
    return teamData.filter((t) => t.members.length > 0);
  } catch (error) {
    console.error('Failed to fetch Discord team:', error);
    return [];
  }
}
