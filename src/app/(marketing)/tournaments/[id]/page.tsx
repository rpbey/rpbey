'use client';

import {
  CalendarMonth,
  Info,
  LocationOn,
  EmojiEvents as Trophy,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import type { Tournament } from '@prisma/client';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChallongeBracket } from '@/components/tournaments';
import { type TournamentStatus, TournamentStatusChip } from '@/components/ui';

const TournamentMap = dynamic(() => import('@/components/ui/Map'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height="100%" />,
});

export default function TournamentDetailPage() {
  const { id } = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTournament() {
      try {
        const res = await fetch(`/api/tournaments/${id}`);
        const response = await res.json();
        setTournament(response.data);
      } catch (error) {
        console.error('Failed to fetch tournament details:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTournament();
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Skeleton variant="text" width="60%" height={60} sx={{ mb: 4 }} />
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!tournament) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4">Tournoi non trouvé</Typography>
      </Container>
    );
  }

  const isBTS2 = tournament.name.includes('BEY-TAMASHII SERIES #2');
  const isBTS1 = tournament.name.includes('BEY-TAMASHII SERIES #1');

  // Coordinates for "Dernier Bar Avant la Fin du Monde" (Default for now)
  const mapPosition: [number, number] = [48.85785, 2.34623];

  const formattedDate = new Date(tournament.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h3"
              fontWeight="900"
              sx={{ letterSpacing: '-0.02em' }}
            >
              {tournament.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {formattedDate} • {tournament.location}
            </Typography>
          </Box>
          <TournamentStatusChip
            status={(tournament.status || '').toLowerCase() as TournamentStatus}
          />
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content Area */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Info Banner */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CalendarMonth color="primary" fontSize="small" />
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', fontWeight: 700 }}
                      >
                        Date
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {new Date(tournament.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Info color="primary" fontSize="small" />
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', fontWeight: 700 }}
                      >
                        Heure
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {isBTS2 ? '13h00 (Check-in)' : '14h00'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <LocationOn color="primary" fontSize="small" />
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', fontWeight: 700 }}
                      >
                        Lieu
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" noWrap>
                        {tournament.location || 'Confirmé'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Trophy color="primary" fontSize="small" />
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', fontWeight: 700 }}
                      >
                        Format
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {tournament.format}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Map & Description split row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Description
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: 'pre-wrap' }}
                >
                  {tournament.description || 'Aucune description fournie.'}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Paper
                elevation={0}
                sx={{
                  height: 280,
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                }}
              >
                <TournamentMap
                  position={mapPosition}
                  popupText={tournament.location || 'Lieu du tournoi'}
                />
              </Paper>
            </Grid>
          </Grid>

          {/* Challonge Bracket */}
          {tournament.challongeUrl && (
            <ChallongeBracket
              challongeUrl={tournament.challongeUrl}
              title={`Arbre: ${tournament.name}`}
              svgPath={isBTS1 ? '/tournaments/B_TS1.svg' : undefined}
            />
          )}
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3} sx={{ position: 'sticky', top: 80 }}>
            {/* Tournament Poster */}
            {(isBTS2 || isBTS1) && (
              <Box
                sx={{
                  width: '100%',
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  aspectRatio: '1/1',
                  bgcolor: 'background.paper',
                }}
              >
                <Box
                  component="img"
                  src={
                    isBTS2
                      ? '/tournaments/BTS2_min.png'
                      : '/tournaments/B_TS1.svg'
                  }
                  alt={tournament.name}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: isBTS2 ? 'none' : 'invert(1) brightness(0.8)',
                  }}
                />
              </Box>
            )}

            {/* Inscription Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                background: (theme) =>
                  alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(12px)',
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight="900"
                gutterBottom
                sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Participer
              </Typography>

              <Stack spacing={2}>
                {tournament.challongeUrl && (
                  <Button
                    variant="contained"
                    fullWidth
                    href={tournament.challongeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      background:
                        'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: '#fff',
                      fontWeight: 800,
                    }}
                  >
                    S&apos;inscrire sur Challonge
                  </Button>
                )}

                <Button
                  variant="outlined"
                  fullWidth
                  href="https://discord.gg/rpb"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ borderRadius: 2, py: 1.5, fontWeight: 700 }}
                >
                  Rejoindre le Discord
                </Button>
              </Stack>

              <Box
                sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', lineHeight: 1.2 }}
                >
                  * Max {tournament.maxPlayers} joueurs.
                  <br />
                  Check-in 30 min avant.
                </Typography>
              </Box>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
