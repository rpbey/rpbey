import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getChallongeService } from '@/lib/challonge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const stateBase64 = searchParams.get('state')

  if (!code || !stateBase64) {
    return new NextResponse('Invalid request', { status: 400 })
  }

  try {
    const state = JSON.parse(Buffer.from(stateBase64, 'base64').toString())
    const userId = state.userId

    const challonge = getChallongeService()
    const tokenData = await challonge.exchangeCodeForToken(code)

    // Store in Account table
    await prisma.account.upsert({
      where: {
        providerId_accountId: {
          providerId: 'challonge',
          accountId: userId, // We can use userId or something from Challonge if available
        }
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        accessTokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      },
      create: {
        userId: userId,
        providerId: 'challonge',
        accountId: userId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        accessTokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      }
    })

    // Redirect back to settings with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?challonge=success`)
  } catch (error) {
    console.error('Challonge OAuth callback failed:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?challonge=error`)
  }
}
