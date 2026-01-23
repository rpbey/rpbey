import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // Suppose une lib auth standard
import { prisma } from '@/lib/prisma';
import { RankingService } from '@/lib/ranking-service';

export async function GET() {
  try {
    // Vérification Auth (optionnelle ici si gérée par middleware, mais recommandée)
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rules = await prisma.rankingSystem.findFirst();
    return NextResponse.json(rules || {});
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      participation,
      matchWin,
      firstPlace,
      secondPlace,
      thirdPlace,
      top8,
    } = body;

    // Mise à jour ou Création (upsert like behavior but ensuring single row)
    const existing = await prisma.rankingSystem.findFirst();

    if (existing) {
      await prisma.rankingSystem.update({
        where: { id: existing.id },
        data: {
          participation,
          matchWin,
          firstPlace,
          secondPlace,
          thirdPlace,
          top8,
        },
      });
    } else {
      await prisma.rankingSystem.create({
        data: {
          participation,
          matchWin,
          firstPlace,
          secondPlace,
          thirdPlace,
          top8,
        },
      });
    }

    // Déclenchement du recalcul
    await RankingService.recalculateAll();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update rules' },
      { status: 500 },
    );
  }
}
