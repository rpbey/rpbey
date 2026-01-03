import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const BOT_API_URL = process.env.BOT_API_URL || 'http://bot.rpbey.fr:3001'
const BOT_API_KEY = process.env.BOT_API_KEY

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
    const response = await fetch(`${BOT_API_URL}/api/status`, {
      headers: {
        'X-API-Key': BOT_API_KEY || '',
      },
      cache: 'no-store',
    })
    
    if (!response.ok) {
      // Bot is offline
      return NextResponse.json({
        status: 'offline',
        uptime: 0,
        uptimeFormatted: 'Hors ligne',
        guilds: 0,
        users: 0,
        ping: 0,
        memoryUsage: 'N/A',
        nodeVersion: 'N/A',
      } as BotStatus)
    }
    
    const data = await response.json()
    
    return NextResponse.json(data as BotStatus)
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
