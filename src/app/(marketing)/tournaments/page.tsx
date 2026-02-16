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
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { Button, Stack, Card, CardContent } from '@mui/material';
import Link from 'next/link';

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
        description="Découvrez et inscrivez-vous aux prochains tournois Beyblade X. Lots et concours de qualité grâce à notre sponsor officiel FeedMy !"
      />

      <Card 
        sx={{ 
            mb: 6, 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(0,0,0,0) 100%)',
            border: '1px solid',
            borderColor: 'rgba(251, 191, 36, 0.2)'
        }}
      >
          <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 3, p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
                      <WorkspacePremiumIcon fontSize="large" />
                  </Box>
                  <Box>
                      <Typography variant="h6" fontWeight="bold">SATR</Typography>
                      <Typography variant="body2" color="text.secondary">Consultez les classements de la saison 2 et l'historique des bladers.</Typography>
                  </Box>
              </Box>
              <Button 
                variant="contained" 
                color="warning" 
                component={Link} 
                href="/tournaments/satr"
                sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none', px: 4 }}
              >
                  Voir les classements
              </Button>
          </CardContent>
      </Card>

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
