'use client';

import {
  CalendarMonth,
  Info,
  LocationOn,
  EmojiEvents as Trophy,
} from '@mui/icons-material';
import {
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

  // Coordinates for "Dernier Bar Avant la Fin du Monde" (Default for now)
  const mapPosition: [number, number] = [48.85785, 2.34623];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          spacing={2}
        >
          <Typography variant="h3" fontWeight="bold">
            {tournament.name}
          </Typography>
          <TournamentStatusChip
            status={(tournament.status || '').toLowerCase() as TournamentStatus}
          />
        </Stack>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Main Info & Map */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              mb: 4,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Informations Clés
              </Typography>

              <Stack spacing={3} sx={{ mt: 3 }}>
                <Stack direction="row" spacing={2}>
                  <CalendarMonth color="primary" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Date
                    </Typography>
                    <Typography variant="body1">
                      Dimanche 11 janvier 2026
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <Info color="primary" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Heure
                    </Typography>
                    <Typography variant="body1">
                      Début à 14h00 (Ouverture des inscriptions/check-in à
                      13h00)
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <LocationOn color="primary" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Lieu
                    </Typography>
                    <Typography variant="body1">
                      Dernier Bar Avant la Fin du Monde, 19 Avenue Victoria,
                      75001 Paris
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <Trophy color="primary" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Format
                    </Typography>
                    <Typography variant="body1">
                      3on3 classique en Double éliminations (pas de Ban-list ou
                      de limited-list pour le moment)
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Box>

            {/* Map */}
            <Box
              sx={{
                height: 400,
                width: '100%',
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <TournamentMap
                position={mapPosition}
                popupText={tournament.location || 'Lieu du tournoi'}
              />
            </Box>
          </Paper>

          {/* Description */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              mb: 4,
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Description
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              paragraph
              sx={{ whiteSpace: 'pre-wrap' }}
            >
              {tournament.description || 'Aucune description fournie.'}
            </Typography>
          </Paper>

          {/* Challonge Bracket */}
          {tournament.challongeUrl && (
            <ChallongeBracket
              challongeUrl={tournament.challongeUrl}
              title={`Arbre: ${tournament.name}`}
              svgPath={tournament.name.includes('BEY-TAMASHII SERIES #1') ? '/tournaments/B_TS1.svg' : undefined}
            />
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          {/* Actions Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              position: 'sticky',
              top: 100,
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Inscription
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Pour participer, assure-toi d'être inscrit sur Challonge et
              d'avoir rejoint notre serveur Discord.
            </Typography>

            <Stack spacing={2}>
              {tournament.challongeUrl && (
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  href={tournament.challongeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<Trophy />}
                  sx={{ borderRadius: 2 }}
                >
                  S'inscrire sur Challonge
                </Button>
              )}

              <Button
                variant="outlined"
                fullWidth
                size="large"
                href="https://discord.gg/twdVfesrRj"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ borderRadius: 2 }}
              >
                Rejoindre le Discord
              </Button>
            </Stack>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">
                * Les places sont limitées à {tournament.maxPlayers} joueurs.
                Veuillez arriver 30 minutes avant le début pour le check-in.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
