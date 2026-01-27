import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          include: {
            tournaments: {
              include: {
                tournament: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      bladerName,
      favoriteType,
      experience,
      bio,
      challongeUsername,
      deckBoxImage,
    } = body;

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        bladerName,
        favoriteType,
        experience,
        bio,
        challongeUsername,
        deckBoxImage,
      },
      create: {
        userId: session.user.id,
        bladerName: bladerName ?? session.user.name,
        favoriteType,
        experience,
        bio,
        challongeUsername,
        deckBoxImage,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 },
    );
  }
}
