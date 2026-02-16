'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import type { Tournament } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TournamentCardGrid } from '@/components/cards/TournamentCard';
import { PageHeader, type TournamentStatus } from '@/components/ui';
import { Button, Stack, Paper } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import { TrophyIcon } from '@/components/ui/Icons';

export default function TournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTournaments() {
      try {
        const res = await fetch('/api/tournaments');
        const json = await res.json();
        setTournaments(json.data || []);
      } catch (error) {
        console.error('Failed to fetch tournaments:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTournaments();
  }, []);

  const handleTournamentClick = (id: string) => {
    router.push(`/tournaments/${id}`);
  };

  const handleRegister = (id: string) => {
    router.push(`/tournaments/${id}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <PageHeader
        title="Tournois"
        description="Découvrez et inscrivez-vous aux prochains tournois Beyblade X."
      />

      {/* BBT / SATR Featured Section */}
      <Paper 
        elevation={0}
        sx={{ 
            mb: 8, 
            p: { xs: 3, md: 5 },
            borderRadius: 6, 
            background: 'radial-gradient(circle at 0% 0%, rgba(251, 191, 36, 0.15) 0%, rgba(0,0,0,0) 50%), linear-gradient(145deg, #1a1a1a 0%, #050505 100%)',
            border: '1px solid',
            borderColor: 'rgba(251, 191, 36, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: 4
        }}
      >
          {/* Decorative background logo */}
          <Box sx={{ 
              position: 'absolute', 
              right: -50, 
              bottom: -50, 
              opacity: 0.03, 
              transform: 'rotate(-15deg)',
              pointerEvents: 'none',
              color: '#fbbf24'
          }}>
              <TrophyIcon size={400} />
          </Box>

          <Box sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Box sx={{ color: '#fbbf24', display: 'flex' }}>
                      <TrophyIcon size={20} />
                  </Box>
                  <Typography variant="overline" sx={{ fontWeight: 900, color: '#fbbf24', letterSpacing: 2 }}>
                      Série Officielle
                  </Typography>
              </Stack>
              <Typography variant="h3" fontWeight="900" sx={{ mb: 2, letterSpacing: -1 }}>
                  Beyblade Battle <span style={{ color: '#fbbf24' }}>Tournament</span>
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', maxWidth: 500, lineHeight: 1.7 }}>
                  La série de tournois de référence de la communauté SATR. 
                  Affrontez les meilleurs bladers de France et grimpez dans le classement historique.
              </Typography>
              <Stack direction="row" spacing={2}>
                  <Button 
                    variant="contained" 
                    color="warning" 
                    component={Link} 
                    href="/tournaments/satr"
                    sx={{ 
                        borderRadius: 2, 
                        fontWeight: 900, 
                        px: 4, 
                        py: 1.5,
                        bgcolor: '#fbbf24',
                        color: '#000',
                        '&:hover': { bgcolor: '#f59e0b' }
                    }}
                  >
                      Voir les classements
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    component="a"
                    href="https://challonge.com/communities/sunafterthereign"
                    target="_blank"
                    sx={{ 
                        borderRadius: 2, 
                        fontWeight: 900, 
                        px: 4, 
                        borderColor: 'rgba(255,255,255,0.2)',
                        '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.05)' }
                    }}
                  >
                      Communauté
                  </Button>
              </Stack>
          </Box>

          <Box sx={{ 
              position: 'relative', 
              width: { xs: '100%', md: 350 }, 
              height: { xs: 150, md: 200 },
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
          }}>
              <Image 
                src="/satr-logo.webp" 
                alt="SATR Logo" 
                fill 
                style={{ objectFit: 'contain', mixBlendMode: 'screen', filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.2))' }} 
              />
          </Box>
      </Paper>

      <Typography variant="h5" fontWeight="900" sx={{ mb: 4, letterSpacing: -0.5 }}>
          Tous les <span style={{ color: '#dc2626' }}>Tournois</span>
      </Typography>

      {loading ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: '1fr 1fr 1fr',
            },
            gap: 3,
          }}
        >
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={200}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Box>
      ) : tournaments.length > 0 ? (
        <TournamentCardGrid
          tournaments={tournaments.map((t) => ({
            ...t,
            startDate: t.date,
            status: t.status.toLowerCase() as TournamentStatus,
          }))}
          onTournamentClick={handleTournamentClick}
          onRegister={handleRegister}
        />
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h6" color="text.secondary">
            Aucun tournoi n'est prévu pour le moment.
          </Typography>
        </Box>
      )}
    </Container>
  );
}
