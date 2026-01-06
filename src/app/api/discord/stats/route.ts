import { NextResponse } from 'next/server'
import { getBotStatus } from '@/lib/bot'

// MIGRATED: Removed export const dynamic = 'force-dynamic' - dynamic by default with Cache Components

export async function GET() {
  try {
    const status = await getBotStatus()
    if (!status) {
      return NextResponse.json({ 
        onlineCount: 0, 
        memberCount: 0 
      })
    }
    
    // Only return public stats
    return NextResponse.json({
      onlineCount: status.onlineCount,
      memberCount: status.memberCount
    })
  } catch (error) {
    return NextResponse.json({ 
      onlineCount: 0, 
      memberCount: 0 
    })
  }
}
