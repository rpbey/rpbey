import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { TournamentData } from './_components/TournamentDetail';
import TournamentDetail from './_components/TournamentDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

const tournamentSelect = {
  id: true,
  name: true,
  status: true,
  description: true,
  date: true,
  location: true,
  format: true,
  maxPlayers: true,
  challongeId: true,
  challongeUrl: true,
  standings: true,
  stations: true,
  activityLog: true,
  updatedAt: true,
} as const;

async function getScrapedTournament(id: string) {
  if (id !== 'bts2' && id !== 'bts3') return null;

  const fileName = id === 'bts2' ? 'B_TS2.json' : 'B_TS3.json';
  const filePath = join(process.cwd(), 'data/exports', fileName);

  if (!existsSync(filePath)) return null;

  const data = JSON.parse(readFileSync(filePath, 'utf-8'));

  return {
    id,
    name: id === 'bts2' ? 'Bey-Tamashii Séries #2' : 'Bey-Tamashii Séries #3',
    status: 'COMPLETE',
    description:
      id === 'bts2'
        ? 'Deuxième édition des Bey-Tamashii Séries.'
        : 'Troisième édition des Bey-Tamashii Séries au Dernier Bar avant la Fin du Monde.',
    date: new Date(id === 'bts2' ? '2026-02-08' : '2026-03-01'),
    location: 'Dernier Bar avant la Fin du Monde, Paris',
    format: '3on3 Double Elimination',
    maxPlayers: 128,
    challongeId: id,
    challongeUrl: data.url,
    standings: (data.participants as Array<{ rank: number; name: string }>)
      .filter((p) => p.rank > 0)
      .sort((a, b) => a.rank - b.rank),
    stations: [],
    activityLog: [],
    updatedAt: new Date(data.scrapedAt),
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  const scraped = await getScrapedTournament(id);
  if (scraped) {
    return {
      title: scraped.name,
      description: scraped.description,
    };
  }

  const tournament =
    (await prisma.tournament.findUnique({
      where: { id },
      select: { name: true, description: true },
    })) ??
    (await prisma.tournament.findFirst({
      where: { OR: [{ challongeId: id }, { challongeUrl: { contains: id } }] },
      select: { name: true, description: true },
    }));

  if (!tournament) return { title: 'Tournoi non trouvé' };

  return {
    title: tournament.name,
    description: tournament.description || `Tournoi ${tournament.name} - RPB`,
  };
}

export default async function TournamentDetailPage({ params }: PageProps) {
  const { id } = await params;

  const scraped = await getScrapedTournament(id);

  const dbResult = scraped
    ? null
    : ((await prisma.tournament.findUnique({
        where: { id },
        select: tournamentSelect,
      })) ??
      (await prisma.tournament.findFirst({
        where: {
          OR: [{ challongeId: id }, { challongeUrl: { contains: id } }],
        },
        select: tournamentSelect,
      })));

  const tournament = scraped ?? dbResult;

  if (!tournament) notFound();

  const formattedDate = tournament.date
    ? new Date(tournament.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Date non définie';

  const tournamentData: TournamentData = {
    id: tournament.id,
    name: tournament.name,
    status: tournament.status,
    description: tournament.description,
    date: tournament.date.toISOString(),
    location: tournament.location,
    format: tournament.format,
    maxPlayers: tournament.maxPlayers,
    challongeId: tournament.challongeId,
    challongeUrl: tournament.challongeUrl,
    updatedAt: tournament.updatedAt.toISOString(),
  };

  const initialLiveData = {
    standings: (tournament.standings ?? []) as unknown[],
    stations: (tournament.stations ?? []) as unknown[],
    activityLog: (tournament.activityLog ?? []) as unknown[],
    lastUpdated: tournament.updatedAt.toISOString(),
  };

  return (
    <TournamentDetail
      tournament={tournamentData}
      formattedDate={formattedDate}
      initialLiveData={initialLiveData}
    />
  );
}
