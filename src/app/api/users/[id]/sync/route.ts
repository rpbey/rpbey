import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getBotMember } from '@/lib/bot';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    // 1. Verify Authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow syncing own profile or admin
    if (session.user.id !== params.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = params.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { discordId: true },
    });

    if (!user || !user.discordId) {
      return NextResponse.json(
        { error: 'User not connected to Discord' },
        { status: 400 },
      );
    }

    // 2. Fetch from Bot
    const botMember = await getBotMember(user.discordId);

    if (!botMember) {
      return NextResponse.json(
        { error: 'Member not found in Discord server' },
        { status: 404 },
      );
    }

    // 3. Update User in DB
    // Use extended fields
    await prisma.user.update({
      where: { id: userId },
      data: {
        nickname: botMember.nickname,
        serverAvatar: botMember.serverAvatar,
        globalName: botMember.globalName,
        roles: botMember.roles,
        // Also update standard fields if possible (avatar?)
        // image: botMember.avatar ?? undefined, // Maybe keep original auth image?
      },
    });

    // 4. Also update Staff Member if exists?
    // Determine highest role
    // Logic for staff update is in actions.ts, we can skip for now or reuse

    return NextResponse.json({ success: true, data: botMember });
  } catch (error) {
    console.error('Sync Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
