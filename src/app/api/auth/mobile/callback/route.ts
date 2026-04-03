/**
 * POST /api/auth/mobile/callback
 * Exchange Discord OAuth code for a session token (mobile app)
 */

import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, redirectUri } = body as {
      code?: string;
      redirectUri?: string;
    };

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: 'code and redirectUri required' },
        { status: 400 },
      );
    }

    // Exchange code for Discord token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID || '',
        client_secret: process.env.DISCORD_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: 'Discord token exchange failed' },
        { status: 400 },
      );
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };

    // Get Discord user info
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Discord user' },
        { status: 400 },
      );
    }

    const discordUser = (await userRes.json()) as {
      id: string;
      username: string;
      discriminator: string;
      avatar: string | null;
      global_name: string | null;
    };

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { discordId: discordUser.id },
    });

    const discordTag =
      discordUser.discriminator === '0'
        ? discordUser.username
        : `${discordUser.username}#${discordUser.discriminator}`;

    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : null;

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `${discordUser.id}@discord.rpbey.fr`,
          name: discordUser.username,
          discordId: discordUser.id,
          discordTag,
          image: avatarUrl,
          globalName: discordUser.global_name,
          emailVerified: true,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          discordTag,
          image: avatarUrl,
          globalName: discordUser.global_name,
        },
      });
    }

    // Ensure profile exists
    await prisma.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, bladerName: discordUser.username },
      update: {},
    });

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt,
        ipAddress: request.headers.get('x-forwarded-for') ?? 'mobile',
        userAgent: request.headers.get('user-agent') ?? 'RPB TCG Mobile',
      },
    });

    return NextResponse.json({
      token: sessionToken,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        discordTag: user.discordTag,
      },
    });
  } catch (error) {
    console.error('Mobile auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 },
    );
  }
}
