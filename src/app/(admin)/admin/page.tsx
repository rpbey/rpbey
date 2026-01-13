import {
  CheckCircle,
  Dns,
  Error as ErrorIcon,
  Event,
  History,
  People,
  SmartToy,
  Visibility,
} from '@mui/icons-material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { headers } from 'next/headers';
import Link from 'next/link';
import { QuickActions } from '@/components/admin/QuickActions';
import { TrophyIcon } from '@/components/ui/Icons';
import { getBotStatus } from '@/lib/bot';
import prisma from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';

export default async function AdminDashboardPage() {
  await headers();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Current Counts & Next Tournament
  const [
    userCount,
    activeTournamentCount,
    profileCount,
    botStatus,
    usersLastMonth,
    profilesLastMonth,
    nextTournament,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.tournament.count({
      where: {
        status: {
          in: ['REGISTRATION_OPEN', 'UNDERWAY', 'CHECKIN'],
        },
      },
    }),
    prisma.profile.count(),
    getBotStatus(),
    prisma.user.count({ where: { createdAt: { lte: thirtyDaysAgo } } }),
    prisma.profile.count({ where: { createdAt: { lte: thirtyDaysAgo } } }),
    prisma.tournament.findFirst({
      where: { status: { in: ['UPCOMING', 'REGISTRATION_OPEN'] } },
      orderBy: { date: 'asc' },
      include: { _count: { select: { participants: true } } },
    }),
  ]);

  // Calculate Trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const diff = current - previous;
    const percent = ((diff / previous) * 100).toFixed(1);
    return `${diff >= 0 ? '+' : ''}${percent}%`;
  };

  const userTrend = calculateTrend(userCount, usersLastMonth);
  const profileTrend = calculateTrend(profileCount, profilesLastMonth);

  const stats = [
    {
      label: 'Utilisateurs',
      value: userCount.toLocaleString(),
      change: `${userTrend} (30j)`,
      icon: People,
      color: '#3b82f6',
      trendColor: userCount >= usersLastMonth ? 'success.main' : 'error.main',
    },
    {
      label: 'Tournois actifs',
      value: activeTournamentCount.toString(),
      change: 'En cours',
      icon: TrophyIcon,
      color: '#fbbf24',
      trendColor: 'text.secondary',
    },
    {
      label: 'Membres Discord',
      value: botStatus?.memberCount?.toLocaleString() || '---',
      change: botStatus ? 'En ligne' : 'Hors ligne',
      icon: SmartToy,
      color: '#5865F2',
      trendColor: botStatus ? 'success.main' : 'error.main',
    },
    {
      label: 'Profils Bladers',
      value: profileCount.toLocaleString(),
      change: `${profileTrend} (30j)`,
      icon: Visibility,
      color: '#dc2626',
      trendColor:
        profileCount >= profilesLastMonth ? 'success.main' : 'error.main',
    },
  ];

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { name: true, createdAt: true },
  });

  const recentTournaments = await prisma.tournament.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { name: true, createdAt: true },
  });

  const recentActivity = [
    ...recentUsers.map((u) => ({
      type: 'user',
      message: `Nouvel utilisateur inscrit: ${u.name || 'Anonyme'}`,
      date: u.createdAt,
    })),
    ...recentTournaments.map((t) => ({
      type: 'tournament',
      message: `Tournoi "${t.name}" créé`,
      date: t.createdAt,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);

  return (
    <Box component="main" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            gutterBottom
          >
            Vue d'ensemble
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bienvenue sur le panel d'administration RPB
          </Typography>
        </Box>
        <Chip
          icon={botStatus ? <CheckCircle /> : <ErrorIcon />}
          label={botStatus ? 'Systèmes Opérationnels' : 'Bot Hors Ligne'}
          color={botStatus ? 'success' : 'error'}
          variant="outlined"
        />
      </Box>

      {/* Stats Grid */}
      <Grid
        container
        spacing={3}
        sx={{ mb: 4 }}
        role="list"
        aria-label="Statistiques clés"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Grid
              key={stat.label}
              size={{ xs: 12, sm: 6, lg: 3 }}
              role="listitem"
            >
              <Card
                variant="filled"
                sx={{
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
                role="article"
                aria-label={`Statistique: ${stat.label}`}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {stat.label}
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {stat.value}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mt: 1,
                        }}
                      >
                        <Typography variant="caption" color={stat.trendColor}>
                          {stat.change}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: `${stat.color}20`,
                      }}
                      aria-hidden="true"
                    >
                      <Icon sx={{ color: stat.color }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card
            variant="elevated"
            sx={{ height: '100%' }}
            role="region"
            aria-labelledby="recent-activity-title"
          >
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}
                id="recent-activity-title"
                component="h2"
              >
                <History aria-hidden="true" /> Activité récente
              </Typography>
              <Box
                component="ul"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  p: 0,
                  m: 0,
                  listStyle: 'none',
                }}
              >
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <Box
                      component="li"
                      key={`${activity.type}-${index}`}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'background.default',
                      }}
                    >
                      <Typography variant="body2">
                        {activity.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(activity.date)}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Box component="li">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ p: 2, textAlign: 'center' }}
                    >
                      Aucune activité récente
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Next Tournament & Quick Actions */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Next Tournament Card */}
            {nextTournament && (
              <Card
                variant="outlined"
                sx={{ borderColor: 'primary.main', borderWidth: 2 }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <Event color="primary" /> Prochain Tournoi
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    noWrap
                    title={nextTournament.name}
                  >
                    {nextTournament.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2, mb: 2 }}>
                    <Chip
                      label={nextTournament.status}
                      size="small"
                      color={
                        nextTournament.status === 'REGISTRATION_OPEN'
                          ? 'success'
                          : 'default'
                      }
                    />
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(nextTournament.date)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2">
                      <strong>{nextTournament._count.participants}</strong>{' '}
                      participants
                    </Typography>
                    <Link
                      href={`/admin/tournaments/${nextTournament.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Button size="small" variant="contained">
                        Gérer
                      </Button>
                    </Link>
                  </Box>
                </CardContent>
              </Card>
            )}

            <Card
              variant="elevated"
              role="region"
              aria-labelledby="quick-actions-title"
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ mb: 3 }}
                  id="quick-actions-title"
                  component="h2"
                >
                  Actions rapides
                </Typography>
                <QuickActions />
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Dns fontSize="small" /> État des Services
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: 1,
                  }}
                >
                  <Typography variant="caption">Database</Typography>
                  <Typography variant="caption" color="success.main">
                    Connecté
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">Bot Discord</Typography>
                  <Typography
                    variant="caption"
                    color={botStatus ? 'success.main' : 'error.main'}
                  >
                    {botStatus ? `${botStatus.ping}ms` : 'Offline'}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">Gemini Agent</Typography>
                  <Typography variant="caption" color="success.main">
                    Actif
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
