import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3001'
const BOT_API_KEY = process.env.BOT_API_KEY || ''

interface BotConfig {
  env: Record<string, string>
  constants: {
    RPB: Record<string, string>
    Colors: Record<string, string>
    Channels: Record<string, string>
    Roles: Record<string, string>
  }
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const response = await fetch(`${BOT_API_URL}/api/config`, {
      headers: {
        'x-api-key': BOT_API_KEY,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Bot API responded with status ${response.status}`)
    }

    const data = await response.json()

    // Transform the response to match the expected format
    const config: BotConfig = {
      env: data.env || {},
      constants: {
        RPB: data.constants?.RPB || {},
        Colors: data.constants?.Colors || {},
        Channels: data.constants?.Channels || {},
        Roles: data.constants?.Roles || {},
      },
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching config from bot API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch config', details: String(error) },
      { status: 500 }
    )
  }
}
