import { NextResponse } from 'next/server'
import { getBotStatus } from '@/lib/bot'

// Discord Invite API (public, gives approximate counts)
const DISCORD_INVITE_CODE = 'twdVfesrRj'
const DISCORD_INVITE_URL = `https://discord.com/api/v9/invites/${DISCORD_INVITE_CODE}?with_counts=true`

// MIGRATED: Removed export const dynamic = 'force-dynamic' - dynamic by default with Cache Components

export async function GET() {
  try {
    // 1. Try internal bot API first
    const status = await getBotStatus()
    if (status && status.memberCount > 0) {
      return NextResponse.json({
        onlineCount: status.onlineCount,
        memberCount: status.memberCount
      })
    }

    // 2. Fallback to Discord Invite API
    const inviteRes = await fetch(DISCORD_INVITE_URL, { next: { revalidate: 60 } })
    if (inviteRes.ok) {
      const inviteData = await inviteRes.json()
      return NextResponse.json({
        onlineCount: inviteData.approximate_presence_count || 0,
        memberCount: inviteData.approximate_member_count || 0
      })
    }
    
    return NextResponse.json({ 
      onlineCount: 0, 
      memberCount: 0 
    })
  } catch (error) {
    console.error('Discord stats error:', error)
    return NextResponse.json({ 
      onlineCount: 0, 
      memberCount: 0 
    })
  }
}
