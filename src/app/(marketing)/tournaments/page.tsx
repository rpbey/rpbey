import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import EventIcon from '@mui/icons-material/Event';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import { TournamentCardGrid } from '@/components/cards/TournamentCard';
import { PageHeader } from '@/components/ui';
import type { TournamentStatus } from '@/components/ui/StatusChip';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tournois | RPB',
  description:
    'Découvrez les tournois Beyblade X organisés par la République Populaire du Beyblade. Inscrivez-vous et participez !',
  openGraph: {
    title: 'Tournois Beyblade X | RPB',
    description:
      'Résultats, classements et inscriptions aux tournois officiels RPB.',
  },
};

// Map DB status to TournamentCard status
function mapDbStatus(status: string): TournamentStatus {
  const mapping: Record<string, TournamentStatus> = {
    UPCOMING: 'upcoming',
    PENDING: 'pending',
    ACTIVE: 'underway',
    UNDERWAY: 'underway',
    COMPLETE: 'complete',
    ARCHIVED: 'complete',
    CANCELLED: 'cancelled',
  };
  return mapping[status] || 'pending';
}

export default async function TournamentsPage() {
  // 1. Load DB tournaments
  const dbTournaments = await prisma.tournament.findMany({
    orderBy: { date: 'desc' },
    include: {
      _count: {
        select: { participants: true },
      },
    },
  });

  // 2. Load scraped JSON tournaments
  const exportDir = join(process.cwd(), 'data/exports');
  let scrapedTournaments: Array<{
    id: string;
    name: string;
    description: string;
    startDate: string;
    status: TournamentStatus;
    currentParticipants: number;
    maxParticipants: number;
  }> = [];

  try {
    const bts2 = JSON.parse(
      readFileSync(join(exportDir, 'B_TS2.json'), 'utf-8'),
    );
    const bts3 = JSON.parse(
      readFileSync(join(exportDir, 'B_TS3.json'), 'utf-8'),
    );

    scrapedTournaments = [
      {
        id: 'bts3',
        name: 'Bey-Tamashii Séries #3',
        description:
          'Troisième édition des Bey-Tamashii Séries au Dernier Bar avant la Fin du Monde.',
        startDate: '2026-03-01',
        status: 'complete' as TournamentStatus,
        currentParticipants: bts3.participantsCount || 73,
        maxParticipants: 128,
      },
      {
        id: 'bts2',
        name: 'Bey-Tamashii Séries #2',
        description: 'Deuxième édition des Bey-Tamashii Séries.',
        startDate: '2026-02-08',
        status: 'complete' as TournamentStatus,
        currentParticipants: bts2.participantsCount || 60,
        maxParticipants: 128,
      },
    ];
  } catch (error) {
    console.error('Failed to load scraped tournaments:', error);
  }

  // 3. Convert DB tournaments to card format
  const dbScrapedIds = new Set(['bts2', 'bts3']);
  const dbCards = dbTournaments
    .filter((t) => !dbScrapedIds.has(t.id))
    .map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      startDate: t.date.toISOString(),
      status: mapDbStatus(t.status),
      currentParticipants: t._count.participants,
      maxParticipants: t.maxPlayers,
    }));

  // 4. Categorize
  const upcoming = dbCards.filter(
    (t) =>
      t.status === 'upcoming' ||
      t.status === 'pending' ||
      t.status === 'registration_open',
  );
  const live = dbCards.filter(
    (t) => t.status === 'underway' || t.status === 'in_progress',
  );
  const completed = [
    ...dbCards.filter((t) => t.status === 'complete'),
    ...scrapedTournaments,
  ];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <PageHeader
        title="Tournois"
        description="Participez aux tournois Beyblade X organisés par la communauté RPB."
      />

      {/* Live Tournaments */}
      {live.length > 0 && (
        <Box sx={{ mb: 8 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Typography
              variant="h5"
              fontWeight="900"
              sx={{ letterSpacing: -0.5 }}
            >
              En <span style={{ color: '#dc2626' }}>Direct</span>
            </Typography>
            <Chip
              label="LIVE"
              color="error"
              size="small"
              sx={{
                fontWeight: 900,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.6 },
                },
              }}
            />
          </Box>
          <TournamentCardGrid tournaments={live} />
        </Box>
      )}

      {/* Upcoming Tournaments */}
      {upcoming.length > 0 && (
        <Box sx={{ mb: 8 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            <EventIcon sx={{ color: 'primary.main' }} />
            <Typography
              variant="h5"
              fontWeight="900"
              sx={{ letterSpacing: -0.5 }}
            >
              Prochains <span style={{ color: '#dc2626' }}>Tournois</span>
            </Typography>
          </Box>
          <TournamentCardGrid tournaments={upcoming} />
        </Box>
      )}

      {/* No upcoming tournaments message */}
      {upcoming.length === 0 && live.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            mb: 8,
            bgcolor: 'rgba(255,255,255,0.02)',
            borderRadius: 4,
            border: '1px dashed rgba(255,255,255,0.1)',
          }}
        >
          <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">
            Aucun tournoi à venir pour le moment
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            Rejoignez notre Discord pour être informé des prochains événements.
          </Typography>
        </Box>
      )}

      {/* Completed Tournaments */}
      <Box sx={{ mb: 10 }}>
        <Typography
          variant="h5"
          fontWeight="900"
          sx={{ mb: 4, letterSpacing: -0.5 }}
        >
          Tournois <span style={{ color: '#dc2626' }}>Terminés</span>
        </Typography>

        {completed.length > 0 ? (
          <TournamentCardGrid tournaments={completed} />
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              bgcolor: 'rgba(255,255,255,0.02)',
              borderRadius: 4,
              border: '1px dashed rgba(255,255,255,0.1)',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Aucun tournoi terminé.
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
}
