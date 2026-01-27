import { NextResponse } from 'next/server';
import { getChallongeService } from '@/lib/challonge';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateBase64 = searchParams.get('state');

  if (!code || !stateBase64) {
    return new NextResponse('Invalid request', { status: 400 });
  }

  try {
    const state = JSON.parse(Buffer.from(stateBase64, 'base64').toString());
    const userId = state.userId;
    const returnTo = state.returnTo || '/admin/settings';

    const challonge = getChallongeService();
    const tokenData = await challonge.exchangeCodeForToken(code);

    // Fetch Challonge User Info
    const challongeUser = await challonge.getCurrentUser(
      tokenData.access_token,
    );

    // Store in Account table for API access
    await prisma.account.upsert({
      where: {
        providerId_accountId: {
          providerId: 'challonge',
          accountId: challongeUser.id,
        },
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        accessTokenExpiresAt: new Date(
          Date.now() + tokenData.expires_in * 1000,
        ),
      },
      create: {
        userId: userId,
        providerId: 'challonge',
        accountId: challongeUser.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        accessTokenExpiresAt: new Date(
          Date.now() + tokenData.expires_in * 1000,
        ),
      },
    });

    // Update Profile with verified username
    await prisma.profile.update({
      where: { userId },
      data: { challongeUsername: challongeUser.username },
    });

    // Redirect back with success
    const separator = returnTo.includes('?') ? '&' : '?';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${returnTo}${separator}challonge=success`,
    );
  } catch (error) {
    console.error('Challonge OAuth callback failed:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile/edit?challonge=error`,
    );
  }
}
