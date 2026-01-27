import crypto from 'node:crypto';
import { headers } from 'next/headers';
import { connection, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getChallongeService } from '@/lib/challonge';

export async function GET(request: Request) {
  await connection();
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/dashboard/profile/edit';

    const challonge = getChallongeService();
    // Generate a random state for security
    const state = Buffer.from(
      JSON.stringify({
        userId: session.user.id,
        nonce: crypto.randomBytes(16).toString('hex'),
        returnTo,
      }),
    ).toString('base64');

    const authUrl = challonge.getAuthorizationUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Challonge OAuth initiation failed:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
