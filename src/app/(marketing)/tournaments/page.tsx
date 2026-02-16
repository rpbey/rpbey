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
import { Button, Paper } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';

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

      {/* Simplified BBT / SATR Section */}
      <Paper 
        elevation={0}
        sx={{ 
            mb: 8, 
            p: { xs: 3, md: 4 },
            borderRadius: 4, 
            background: 'linear-gradient(145deg, #111 0%, #050505 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 3, md: 8 }
        }}
      >
          <Box sx={{ 
              position: 'relative', 
              width: { xs: 180, md: 240 }, 
              height: { xs: 100, md: 130 },
              flexShrink: 0
          }}>
              <Image 
                src="/satr-logo.webp" 
                alt="SATR Logo" 
                fill 
                style={{ objectFit: 'contain', mixBlendMode: 'screen', filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.15))' }} 
              />
          </Box>

          <Button 
            variant="contained" 
            color="warning" 
            component={Link} 
            href="/tournaments/satr"
            sx={{ 
                borderRadius: 2, 
                fontWeight: 900, 
                px: 6, 
                py: 2,
                bgcolor: '#fbbf24',
                color: '#000',
                fontSize: '1rem',
                letterSpacing: 1,
                boxShadow: '0 0 20px rgba(251, 191, 36, 0.2)',
                '&:hover': { 
                    bgcolor: '#f59e0b',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 5px 25px rgba(251, 191, 36, 0.3)',
                },
                transition: 'all 0.3s ease'
            }}
          >
              VOIR LES TOURNOIS SATR
          </Button>
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
