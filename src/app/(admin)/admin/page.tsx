import {
  BarChart as BarChartIcon,
  Dns,
  History,
  People,
  Visibility,
} from '@mui/icons-material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { headers } from 'next/headers';
import { QuickActions } from '@/components/admin/QuickActions';
import { StatsCharts } from '@/components/admin/StatsCharts';
import { FadeIn } from '@/components/ui/FadeIn';
import { TrophyIcon } from '@/components/ui/Icons';
import { getDiscordStats } from '@/lib/discord-data';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import AdminOverviewIntegrations from './_components/AdminOverviewIntegrations';

export default async function AdminDashboardPage() {
  await headers();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Stats for charts (Last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  // Fetch all necessary data in parallel
  const [
    userCount,
    activeTournamentCount,
    profileCount,
    discordStats,
    usersLastMonth,
    profilesLastMonth,
    recentUsers,
    recentTournaments,
    chartUsers,
    chartTournaments,
    chartMatches,
    tournamentTotalCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.tournament.count({
      where: { status: { in: ['REGISTRATION_OPEN', 'UNDERWAY', 'CHECKIN'] } },
    }),
    prisma.profile.count(),
    getDiscordStats(),
    prisma.user.count({ where: { createdAt: { lte: thirtyDaysAgo } } }),
    prisma.profile.count({ where: { createdAt: { lte: thirtyDaysAgo } } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { name: true, createdAt: true },
    }),
    prisma.tournament.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { name: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.tournament.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.tournamentMatch.findMany({
      select: { state: true },
    }),
    prisma.tournament.count(),
  ]);

  // Helper to group by month
  const groupByMonth = (dates: { createdAt: Date }[]) => {
    const counts: Record<string, number> = {};
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
      .reverse();
  };

  const registrationsData = groupByMonth(chartUsers);
  const tournamentsData = groupByMonth(chartTournaments);
  const matchStatusCounts = chartMatches.reduce(
    (acc, m) => {
      const s =
        m.state === 'complete'
          ? 'Terminé'
          : m.state === 'pending'
            ? 'En attente'
            : 'En cours';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const matchesStatusData = Object.entries(matchStatusCounts).map(
    ([status, count]) => ({ status, count }),
  );

  // Trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const diff = current - previous;
    return `${diff >= 0 ? '+' : ''}${((diff / previous) * 100).toFixed(1)}%`;
  };

  const stats = [
    {
      label: 'Utilisateurs',
      value: userCount.toLocaleString(),
      change: `${calculateTrend(userCount, usersLastMonth)} (30j)`,
      icon: People,
      color: '#3b82f6',
    },
    {
      label: 'Tournois organisés',
      value: tournamentTotalCount.toString(),
      change: `${activeTournamentCount} actifs`,
      icon: TrophyIcon,
      color: '#fbbf24',
    },
    {
      label: 'Membres Discord',
      value: discordStats.memberCount.toLocaleString(),
      change: `${discordStats.onlineCount} En ligne`,
      icon: People,
      color: '#5865F2',
    },
    {
      label: 'Profils Bladers',
      value: profileCount.toLocaleString(),
      change: `${calculateTrend(profileCount, profilesLastMonth)} (30j)`,
      icon: Visibility,
      color: '#dc2626',
    },
  ];

  const recentActivity = [
    ...recentUsers.map((u) => ({
      message: `Nouveau blader: ${u.name || 'Anonyme'}`,
      date: u.createdAt,
    })),
    ...recentTournaments.map((t) => ({
      message: `Tournoi "${t.name}" créé`,
      date: t.createdAt,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6);

  return (
    <Box sx={{ py: 4 }}>
      <FadeIn>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Vue d'ensemble
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Bienvenue sur le panel d'administration RPB
            </Typography>
          </Box>
        </Box>
      </FadeIn>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              variant="outlined"
              sx={{ borderLeft: `4px solid ${stat.color}` }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight="bold"
                >
                  {stat.label}
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stat.value}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight="bold"
                >
                  {stat.change}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            {/* Analytics Section */}
            <Card variant="outlined">
              <CardHeader
                title={
                  <Stack direction="row" spacing={1}>
                    <BarChartIcon />{' '}
                    <Typography variant="h6">Analytiques</Typography>
                  </Stack>
                }
              />
              <CardContent>
                <StatsCharts
                  registrations={registrationsData}
                  tournaments={tournamentsData}
                  matchesStatus={matchesStatusData}
                />
              </CardContent>
            </Card>

            {/* Integrations Section */}
            <AdminOverviewIntegrations
              env={{
                TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID ? 'set' : '',
              }}
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Card variant="elevated">
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ mb: 2 }}
                >
                  <History /> Activité
                </Typography>
                <List dense>
                  {recentActivity.map((a, i) => (
                    <ListItem key={i} divider={i !== recentActivity.length - 1}>
                      <ListItemText
                        primary={a.message}
                        secondary={formatDateTime(a.date)}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Actions rapides
                </Typography>
                <QuickActions />
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  <Dns fontSize="small" /> État des Services
                </Typography>
                <Stack spacing={1}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="caption">Database</Typography>
                    <Typography variant="caption" color="success.main">
                      Connecté
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
