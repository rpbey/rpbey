import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { loadJsonSafe } from '@/lib/data-cache';
import { prisma } from '@/lib/prisma';
import { generateBreadcrumbJsonLd, generateEventJsonLd } from '@/lib/seo-utils';
import TournamentDetail, {
  type TournamentData,
} from './_components/TournamentDetail';

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

const BTS_META: Record<
  string,
  { file: string; name: string; desc: string; date: string }
> = {
  bts1: {
    file: 'B_TS1.json',
    name: 'Bey-Tamashii Séries #1',
    desc: 'Première édition des Bey-Tamashii Séries au Dernier Bar avant la Fin du Monde.',
    date: '2026-01-11',
  },
  bts2: {
    file: 'B_TS2.json',
    name: 'Bey-Tamashii Séries #2',
    desc: 'Deuxième édition des Bey-Tamashii Séries.',
    date: '2026-02-08',
  },
  bts3: {
    file: 'B_TS3.json',
    name: 'Bey-Tamashii Séries #3',
    desc: 'Troisième édition des Bey-Tamashii Séries au Dernier Bar avant la Fin du Monde.',
    date: '2026-03-01',
  },
};

async function getScrapedTournament(id: string) {
  const meta = BTS_META[id];
  if (!meta) return null;

  const data = await loadJsonSafe<{
    url?: string;
    participants: { rank: number; name: string }[];
    scrapedAt: string;
  }>(`data/exports/${meta.file}`);
  if (!data) return null;

  return {
    id,
    name: meta.name,
    status: 'COMPLETE',
    description: meta.desc,
    date: new Date(meta.date),
    location: 'Dernier Bar avant la Fin du Monde, Paris',
    format: '3on3 Double Elimination',
    maxPlayers: 128,
    challongeId: id,
    challongeUrl: data.url ?? null,
    standings: data.participants
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
          { url: '/banner.webp', width: 1200, height: 630, alt: scraped.name },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${scraped.name} | RPB`,
        description,
        images: ['/banner.webp'],
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
    keywords: [
      tournament.name,
      'tournoi Beyblade X',
      'RPB',
      'compétition',
      'classement',
      tournament.location ?? 'France',
    ].filter(Boolean) as string[],
    alternates: {
      canonical: `https://rpbey.fr/tournaments/${id}`,
    },
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      url: `https://rpbey.fr/tournaments/${id}`,
      siteName: 'RPB - République Populaire du Beyblade',
      title: `${tournament.name} | RPB`,
      description,
      images: [
        { url: '/banner.webp', width: 1200, height: 630, alt: tournament.name },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tournament.name} | RPB`,
      description,
      images: ['/banner.webp'],
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

  const statusMap: Record<
    string,
    'upcoming' | 'active' | 'complete' | 'cancelled'
  > = {
    UPCOMING: 'upcoming',
    PENDING: 'upcoming',
    ACTIVE: 'active',
    COMPLETE: 'complete',
    CANCELLED: 'cancelled',
  };

  return (
    <>
      <JsonLd
        data={generateEventJsonLd({
          name: tournament.name,
          description: tournament.description ?? undefined,
          date: tournament.date.toISOString(),
          location: tournament.location ?? undefined,
          url: `/tournaments/${tournament.id}`,
          maxAttendees: tournament.maxPlayers,
          status: statusMap[tournament.status] ?? 'upcoming',
        })}
      />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Accueil', item: '/' },
          { name: 'Tournois', item: '/tournaments' },
          { name: tournament.name, item: `/tournaments/${tournament.id}` },
        ])}
      />
      <TournamentDetail
        tournament={tournamentData}
        formattedDate={formattedDate}
        initialLiveData={initialLiveData}
      />
    </>
  );
}
