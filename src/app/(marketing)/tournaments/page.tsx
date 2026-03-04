import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import Link from 'next/link';
import { TournamentCardGrid } from '@/components/cards/TournamentCard';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default function TournamentsPage() {
  const exportDir = join(process.cwd(), 'data/exports');

  let tournaments: any[] = [];

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

      <Divider sx={{ mb: 8, opacity: 0.1 }} />

      {/* Section 2: Nos Partenaires */}
      <Box>
        <Typography
          variant="h5"
          fontWeight="900"
          sx={{ mb: 4, letterSpacing: -0.5 }}
        >
          Nos <span style={{ color: '#fbbf24' }}>Partenaires</span>
        </Typography>

        <Stack spacing={3}>
          {/* SATR Card */}
          <Card
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                width: '100%',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: { xs: 100, md: 140 },
                  height: { xs: 50, md: 70 },
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/satr-logo.webp"
                  alt="SATR Logo"
                  fill
                  style={{ objectFit: 'contain', mixBlendMode: 'screen' }}
                />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Sun After The Reign
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  La série de tournois Beyblade Battle Tournament et ses
                  classements officiels.
                </Typography>
              </Box>
            </Box>

            <Link href="/tournaments/satr" passHref style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                color="warning"
                sx={{
                  borderRadius: 2,
                  fontWeight: 900,
                  px: 4,
                  py: 1.2,
                  bgcolor: '#fbbf24',
                  color: '#000',
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#f59e0b' },
                }}
              >
                VOIR LE CLASSEMENT
              </Button>
            </Link>
          </Card>
        </Stack>
      </Box>
    </Container>
  );
}
