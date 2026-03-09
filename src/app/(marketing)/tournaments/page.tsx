import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { TournamentCardGrid } from '@/components/cards/TournamentCard';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default function TournamentsPage() {
  const exportDir = join(process.cwd(), 'data/exports');

  let tournaments: Array<{
    id: string;
    name: string;
    description: string;
    startDate: string;
    status: 'complete';
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

    tournaments = [
      {
        id: 'bts3',
        name: 'Bey-Tamashii Séries #3',
        description:
          'Troisième édition des Bey-Tamashii Séries au Dernier Bar avant la Fin du Monde.',
        startDate: '2026-03-01', // Date approximative pour l'affichage
        status: 'complete',
        currentParticipants: bts3.participantsCount || 73,
        maxParticipants: 128,
      },
      {
        id: 'bts2',
        name: 'Bey-Tamashii Séries #2',
        description: 'Deuxième édition des Bey-Tamashii Séries.',
        startDate: '2026-02-08',
        status: 'complete',
        currentParticipants: bts2.participantsCount || 60,
        maxParticipants: 128,
      },
    ];
  } catch (error) {
    console.error('Failed to load scraped tournaments:', error);
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <PageHeader
        title="Tournois"
        description="Consultez les résultats de nos derniers tournois Beyblade X."
      />

      {/* Section 1: Nos Tournois */}
      <Box sx={{ mb: 10 }}>
        <Typography
          variant="h5"
          fontWeight="900"
          sx={{ mb: 4, letterSpacing: -0.5 }}
        >
          Nos <span style={{ color: '#dc2626' }}>Tournois</span>
        </Typography>

        {tournaments.length > 0 ? (
          <TournamentCardGrid tournaments={tournaments} />
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
              Aucun tournoi disponible pour le moment.
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
}
