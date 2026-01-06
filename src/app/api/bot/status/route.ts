import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { botClient } from '@/lib/bot'

interface BotStatus {
  status: 'running' | 'starting' | 'offline'
  uptime: number
  uptimeFormatted: string
  guilds: number
  users: number
  ping: number
  memoryUsage: string
  nodeVersion: string
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const data = await botClient.get<BotStatus>('/api/status', {
      cache: 'no-store',
    })
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching status:', error)
    
    // Bot is offline or unreachable
    return NextResponse.json({
      status: 'offline',
      uptime: 0,
      uptimeFormatted: 'Hors ligne',
      guilds: 0,
      users: 0,
      ping: 0,
      memoryUsage: 'N/A',
      nodeVersion: 'N/A',
      error: String(error),
    })
  }
}
