import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getChallongeService } from '@/lib/challonge'
import crypto from 'node:crypto'

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const challonge = getChallongeService()
    // Generate a random state for security
    const state = Buffer.from(JSON.stringify({ userId: session.user.id, nonce: crypto.randomBytes(16).toString('hex') })).toString('base64')
    
    const authUrl = challonge.getAuthorizationUrl(state)

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Challonge OAuth initiation failed:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
