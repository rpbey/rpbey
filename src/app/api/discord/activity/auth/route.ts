import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { code } = await request.json();

  const client_id = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const client_secret = process.env.DISCORD_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return NextResponse.json(
      { error: 'Missing Discord credentials' },
      { status: 500 },
    );
  }

  // Exchange code for access token
  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id,
      client_secret,
      grant_type: 'authorization_code',
      code,
    }),
  });

  const data = await response.json();

  return NextResponse.json(data);
}
