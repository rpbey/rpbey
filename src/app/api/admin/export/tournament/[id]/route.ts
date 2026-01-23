import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateTournamentExport } from '@/lib/csv-export';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: { include: { profile: true } },
          },
          orderBy: { finalPlacement: 'asc' },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const csv = generateTournamentExport(tournament);

    // Nettoyage du nom pour le fichier
    const filename = `RPB_Export_${tournament.name.replace(/[^a-z0-9]/gi, '_')}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
