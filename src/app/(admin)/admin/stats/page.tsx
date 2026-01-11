import {
  AccountCircle,
  EmojiEvents,
  People,
  PlayCircle,
} from '@mui/icons-material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { headers } from 'next/headers';
import { StatsCharts } from '@/components/admin/StatsCharts';
import prisma from '@/lib/prisma';

export default async function AdminStatsPage() {
  await headers();

  // Basic Counts
  const [userCount, profileCount, tournamentCount, matchCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.profile.count(),
      prisma.tournament.count(),
      prisma.tournamentMatch.count({ where: { state: 'complete' } }),
    ]);

  // Aggregate Data (Last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1); // Start of month

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  const tournaments = await prisma.tournament.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  const matches = await prisma.tournamentMatch.findMany({
    select: { state: true },
  });

  // Helper to group by month
  const groupByMonth = (dates: { createdAt: Date }[]) => {
    const counts: Record<string, number> = {};
    // Init last 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('fr-FR', { month: 'short' });
      counts[key] = 0;
    }

    dates.forEach((item) => {
      const key = item.createdAt.toLocaleString('fr-FR', { month: 'short' });
      if (counts[key] !== undefined) counts[key]++;
    });

    return Object.entries(counts)
      .map(([month, count]) => ({ month, count }))
      .reverse(); // Chronological order
  };

  const registrationsData = groupByMonth(users);
  const tournamentsData = groupByMonth(tournaments);

  // Matches Status
  const matchStatusCounts = matches.reduce(
    (acc, match) => {
      const status =
        match.state === 'complete'
          ? 'Terminé'
          : match.state === 'pending'
            ? 'En attente'
            : 'En cours';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const matchesStatusData = Object.entries(matchStatusCounts).map(
    ([status, count]) => ({
      status,
      count,
    }),
  );

  const stats = [
    {
      label: 'Utilisateurs total',
      value: userCount,
      icon: People,
      color: '#3b82f6', // Blue
      bgColor: '#eff6ff',
    },
    {
      label: 'Profils Bladers',
      value: profileCount,
      icon: AccountCircle,
      color: '#dc2626', // RPB Red
      bgColor: '#fef2f2',
    },
    {
      label: 'Tournois organisés',
      value: tournamentCount,
      icon: EmojiEvents,
      color: '#fbbf24', // RPB Gold
      bgColor: '#fffbeb',
    },
    {
      label: 'Matchs joués',
      value: matchCount,
      icon: PlayCircle,
      color: '#22c55e', // Green
      bgColor: '#f0fdf4',
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={1} sx={{ mb: 5 }}>
        <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: -0.5 }}>
          Statistiques
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Analytics et métriques réelles de la plateforme RPB
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: stat.bgColor,
                        display: 'flex',
                        boxShadow: '0 4px 6px -4px rgba(0,0,0,0.1)',
                      }}
                    >
                      <Icon sx={{ color: stat.color, fontSize: 32 }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="800">
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight="500"
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <StatsCharts
        registrations={registrationsData}
        tournaments={tournamentsData}
        matchesStatus={matchesStatusData}
      />
    </Container>
  );
}
