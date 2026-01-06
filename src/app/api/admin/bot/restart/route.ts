import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const botUrl = process.env.BOT_API_URL || 'http://localhost:3001'
  const apiKey = process.env.BOT_API_KEY

  try {
    const response = await fetch(`${botUrl}/api/restart`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey || '',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to restart bot' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to restart bot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
