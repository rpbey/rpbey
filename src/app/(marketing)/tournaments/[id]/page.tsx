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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

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

  const tournament =
    (await prisma.tournament.findUnique({
      where: { id },
      select: tournamentSelect,
    })) ??
    (await prisma.tournament.findFirst({
      where: {
        OR: [{ challongeId: id }, { challongeUrl: { contains: id } }],
      },
      select: tournamentSelect,
    }));

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
