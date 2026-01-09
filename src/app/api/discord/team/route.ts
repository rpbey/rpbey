import { NextResponse } from 'next/server'
import { getMembersByRole } from '@/lib/bot'
import { DiscordRoleMapping } from '@/lib/role-colors'

export async function GET() {
  try {
    const roles = Object.keys(DiscordRoleMapping)
    const teamData = await Promise.all(
      roles.map(async (roleId) => {
        const members = await getMembersByRole(roleId)
        return {
          roleId,
          roleType: DiscordRoleMapping[roleId],
          members: members.slice(0, 5), // Limit to top 5 members per role for space
        }
      })
    )

    return NextResponse.json({
      team: teamData.filter(t => t.members.length > 0)
    })
  } catch (error) {
    console.error('Discord team API error:', error)
    return NextResponse.json({ team: [] })
  }
}
