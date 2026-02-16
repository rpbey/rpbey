'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import type { Tournament } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TournamentCardGrid } from '@/components/cards/TournamentCard';
import { PageHeader, type TournamentStatus } from '@/components/ui';
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

      {/* Section 1: Nos Tournois */}
      <Box sx={{ mb: 10 }}>
        <Typography variant="h5" fontWeight="900" sx={{ mb: 4, letterSpacing: -0.5 }}>
            Nos <span style={{ color: '#dc2626' }}>Tournois</span>
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
            <Box sx={{ textAlign: 'center', py: 6, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 4, border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Typography variant="h6" color="text.secondary">
                Aucun tournoi n'est prévu pour le moment.
            </Typography>
            </Box>
        )}
      </Box>

      <Divider sx={{ mb: 8, opacity: 0.1 }} />

      {/* Section 2: Nos Partenaires */}
      <Box>
        <Typography variant="h5" fontWeight="900" sx={{ mb: 4, letterSpacing: -0.5 }}>
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
                    gap: 3
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                    <Box sx={{ 
                        position: 'relative', 
                        width: { xs: 100, md: 140 }, 
                        height: { xs: 50, md: 70 },
                        flexShrink: 0
                    }}>
                        <Image 
                            src="/satr-logo.webp" 
                            alt="SATR Logo" 
                            fill 
                            style={{ objectFit: 'contain', mixBlendMode: 'screen' }} 
                        />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Sun After The Reign</Typography>
                        <Typography variant="body2" color="text.secondary">La série de tournois Beyblade Battle Tournament et ses classements officiels.</Typography>
                    </Box>
                </Box>

                <Button 
                    variant="contained" 
                    color="warning" 
                    component={Link} 
                    href="/tournaments/satr"
                    sx={{ 
                        borderRadius: 2, 
                        fontWeight: 900, 
                        px: 4, 
                        py: 1.2,
                        bgcolor: '#fbbf24',
                        color: '#000',
                        whiteSpace: 'nowrap',
                        '&:hover': { bgcolor: '#f59e0b' }
                    }}
                >
                    VOIR LE CLASSEMENT
                </Button>
            </Card>

            {/* FeedMy Card */}
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
                    gap: 3
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                    <Box sx={{ 
                        position: 'relative', 
                        width: { xs: 100, md: 140 }, 
                        height: { xs: 50, md: 70 },
                        flexShrink: 0,
                        bgcolor: '#fff',
                        borderRadius: 2,
                        p: 1
                    }}>
                        <Image 
                            src="/partners/feedmy-announcement.png" 
                            alt="FeedMy Logo" 
                            fill 
                            style={{ objectFit: 'contain', padding: '4px' }} 
                        />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="bold">FeedMy</Typography>
                        <Typography variant="body2" color="text.secondary">Sponsor officiel de la RPB. Des lots et concours exclusifs pour nos bladers.</Typography>
                    </Box>
                </Box>

                <Button 
                    variant="outlined" 
                    color="inherit" 
                    component="a"
                    href="https://www.tiktok.com/@feedmy.fr"
                    target="_blank"
                    sx={{ 
                        borderRadius: 2, 
                        fontWeight: 900, 
                        px: 4, 
                        py: 1.2,
                        whiteSpace: 'nowrap',
                        borderColor: 'rgba(255,255,255,0.2)',
                        '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.05)' }
                    }}
                >
                    VOIR LE PARTENAIRE
                </Button>
            </Card>
        </Stack>
      </Box>
    </Container>
  );
}
