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
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <PageHeader
        title="Tournois"
        description="Découvrez et inscrivez-vous aux prochains tournois Beyblade X."
      />

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
