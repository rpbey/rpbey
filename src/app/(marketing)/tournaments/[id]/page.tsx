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
    const formattedDate = scraped.date
      ? new Date(scraped.date).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null;
    const participantCount = scraped.standings?.length ?? 0;
    const description = buildMetaDescription(
      scraped.name,
      scraped.description ?? null,
      formattedDate,
      participantCount,
    );

    return {
      title: scraped.name,
      description,
      openGraph: {
        type: 'website',
        locale: 'fr_FR',
        url: `https://rpbey.fr/tournaments/${id}`,
        siteName: 'RPB - République Populaire du Beyblade',
        title: `${scraped.name} | RPB`,
        description,
        images: [
          { url: '/banner.png', width: 1200, height: 630, alt: scraped.name },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${scraped.name} | RPB`,
        description,
        images: ['/banner.png'],
      },
    };
  }

  const metaSelect = {
    name: true,
    description: true,
    date: true,
    location: true,
    format: true,
    _count: { select: { participants: true } },
  } as const;

  const tournament =
    (await prisma.tournament.findUnique({
      where: { id },
      select: metaSelect,
    })) ??
    (await prisma.tournament.findFirst({
      where: { OR: [{ challongeId: id }, { challongeUrl: { contains: id } }] },
      select: metaSelect,
    }));

  if (!tournament) {
    return {
      title: 'Tournoi non trouvé',
      description: 'Ce tournoi est introuvable ou a été supprimé.',
    };
  }

  const formattedDate = tournament.date
    ? new Date(tournament.date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;
  const participantCount = tournament._count?.participants ?? 0;
  const description = buildMetaDescription(
    tournament.name,
    tournament.description ?? null,
    formattedDate,
    participantCount,
  );

  return {
    title: tournament.name,
    description,
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      url: `https://rpbey.fr/tournaments/${id}`,
      siteName: 'RPB - République Populaire du Beyblade',
      title: `${tournament.name} | RPB`,
      description,
      images: [
        { url: '/banner.png', width: 1200, height: 630, alt: tournament.name },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tournament.name} | RPB`,
      description,
      images: ['/banner.png'],
    },
  };
}

function buildMetaDescription(
  name: string,
  description: string | null,
  formattedDate: string | null,
  participantCount: number,
): string {
  if (description) return description;

  const parts = [`Tournoi ${name}`];
  if (formattedDate) parts.push(`le ${formattedDate}`);
  if (participantCount > 0)
    parts.push(
      `${participantCount} participant${participantCount > 1 ? 's' : ''}`,
    );
  parts.push('organisé par la RPB');

  return `${parts.join(' - ')}.`;
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
