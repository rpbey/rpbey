import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { botClient } from '@/lib/bot'

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
    const data = await botClient.get<any>('/api/config', {
      cache: 'no-store',
    })

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
