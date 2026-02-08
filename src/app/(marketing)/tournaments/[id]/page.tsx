'use client';

import {
  CalendarMonth,
  FiberManualRecord,
  History,
  Info,
  Leaderboard,
  LocationOn,
  OpenInNew,
  Sensors,
  EmojiEvents as Trophy,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import type { Tournament } from '@prisma/client';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ChallongeBracket } from '@/components/tournaments';
import { type TournamentStatus, TournamentStatusChip } from '@/components/ui';

const TournamentMap = dynamic(() => import('@/components/ui/Map'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height="100%" />,
});

// ─── Types ──────────────────────────────────────────────────────────────────

interface Standing {
  rank: number;
  name: string;
  challongeUsername?: string;
  challongeProfileUrl?: string;
  wins: number;
  losses: number;
}

interface Station {
  stationId: number | string;
  name: string;
  currentMatch?: {
    matchId: number;
    identifier: string;
    round: number;
    player1: string | null;
    player2: string | null;
    scores: string;
    state: string;
  } | null;
  status: 'idle' | 'active' | 'paused';
}

interface LogEntry {
  timestamp: string;
  type: string;
  message: string;
}

interface LiveData {
  standings: Standing[];
  stations: Station[];
  activityLog: LogEntry[];
  lastUpdated: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TournamentDetailPage() {
  const { id } = useParams();
  const theme = useTheme();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [activeTab, setActiveTab] = useState(0);

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

  const fetchLiveData = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${id}/live`);
      if (res.ok) {
        const response = await res.json();
        setLiveData(response.data);
      }
    } catch {
      // Silently fail for live data
    }
  }, [id]);

  // Fetch live data on mount and auto-refresh for active tournaments
  useEffect(() => {
    if (!tournament) return;
    fetchLiveData();

    const isLive =
      tournament.status === 'UNDERWAY' || tournament.status === 'CHECKIN';
    if (isLive) {
      const interval = setInterval(fetchLiveData, 30000); // 30s refresh
      return () => clearInterval(interval);
    }
  }, [tournament, fetchLiveData]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Skeleton variant="text" width="60%" height={60} sx={{ mb: 4 }} />
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton
              variant="rounded"
              height={400}
              sx={{ borderRadius: 4 }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton
              variant="rounded"
              height={300}
              sx={{ borderRadius: 4 }}
            />
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

  const isBTS2 = tournament.name.includes('BEY-TAMASHII SERIES #2') || tournament.name.includes('Bey-Tamashii');
  const isBTS1 = tournament.name.includes('BEY-TAMASHII SERIES #1');
  const isLive =
    tournament.status === 'UNDERWAY' || tournament.status === 'CHECKIN';

  const mapPosition: [number, number] = [48.85785, 2.34623];

  const formattedDate = new Date(tournament.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const standings = (liveData?.standings ?? []) as Standing[];
  const stations = (liveData?.stations ?? []) as Station[];
  const activityLog = (liveData?.activityLog ?? []) as LogEntry[];

  const hasLiveData =
    standings.length > 0 || stations.length > 0 || activityLog.length > 0;

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
          <Stack direction="row" spacing={1} alignItems="center">
            {isLive && (
              <Chip
                icon={<FiberManualRecord sx={{ fontSize: 10 }} />}
                label="EN DIRECT"
                size="small"
                color="error"
                sx={{ fontWeight: 800, animation: 'pulse 2s infinite' }}
              />
            )}
            <TournamentStatusChip
              status={
                (tournament.status || '').toLowerCase() as TournamentStatus
              }
            />
          </Stack>
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
                <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
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

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
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

                <Grid size={{ xs: 12, sm: 6, lg: 5 }}>
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
                      <Typography variant="body2" fontWeight="bold">
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

          {/* Tabs: Bracket + Live Data */}
          {hasLiveData ? (
            <>
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
                <Tabs
                  value={activeTab}
                  onChange={(_, v) => setActiveTab(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '& .MuiTab-root': { fontWeight: 700 },
                  }}
                >
                  <Tab
                    icon={<Trophy sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label="Bracket"
                  />
                  <Tab
                    icon={<Leaderboard sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label={`Classement (${standings.length})`}
                  />
                  {stations.length > 0 && (
                    <Tab
                      icon={<Sensors sx={{ fontSize: 18 }} />}
                      iconPosition="start"
                      label={`Stadiums (${stations.length})`}
                    />
                  )}
                  <Tab
                    icon={<History sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label={`Journal (${activityLog.length})`}
                  />
                </Tabs>

                <Box sx={{ p: 3 }}>
                  {/* Bracket Tab */}
                  {activeTab === 0 && tournament.challongeUrl && (
                    <ChallongeBracket
                      challongeUrl={tournament.challongeUrl}
                      title={`Arbre: ${tournament.name}`}
                      svgPath={isBTS1 ? '/tournaments/B_TS1.svg' : undefined}
                    />
                  )}

                  {/* Standings Tab */}
                  {activeTab === 1 && (
                    <StandingsPanel standings={standings} />
                  )}

                  {/* Stadiums Tab */}
                  {stations.length > 0 && activeTab === 2 && (
                    <StadiumsPanel stations={stations} isLive={isLive} />
                  )}

                  {/* Activity Log Tab */}
                  {activeTab === (stations.length > 0 ? 3 : 2) && (
                    <ActivityLogPanel log={activityLog} />
                  )}
                </Box>

                {/* Last updated footer */}
                {liveData?.lastUpdated && (
                  <Box
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Dernière mise à jour :{' '}
                      {new Date(liveData.lastUpdated).toLocaleString('fr-FR')}
                      {isLive && ' — Rafraîchissement auto toutes les 30s'}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </>
          ) : (
            // No live data — show bracket directly
            tournament.challongeUrl && (
              <ChallongeBracket
                challongeUrl={tournament.challongeUrl}
                title={`Arbre: ${tournament.name}`}
                svgPath={isBTS1 ? '/tournaments/B_TS1.svg' : undefined}
              />
            )
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
                background: alpha(theme.palette.background.paper, 0.8),
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

            {/* Quick Standings (top 5) in sidebar */}
            {standings.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="900"
                  gutterBottom
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  Top 5
                </Typography>
                <Stack spacing={1}>
                  {standings.slice(0, 5).map((s, i) => {
                    const rankColor =
                      i === 0
                        ? '#FFD700'
                        : i === 1
                          ? '#C0C0C0'
                          : i === 2
                            ? '#CD7F32'
                            : 'transparent';
                    return (
                      <Box
                        key={s.rank}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1,
                          borderRadius: 2,
                          bgcolor:
                            i < 3
                              ? alpha(rankColor, 0.08)
                              : 'transparent',
                        }}
                      >
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: i < 3 ? rankColor : 'action.selected',
                            color: i === 0 ? 'black' : 'text.primary',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '0.75rem',
                            flexShrink: 0,
                          }}
                        >
                          {s.rank}
                        </Box>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ flex: 1, minWidth: 0 }}
                          noWrap
                        >
                          {s.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          {s.wins}W-{s.losses}L
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}

// ─── Standings Panel ────────────────────────────────────────────────────────

function StandingsPanel({ standings }: { standings: Standing[] }) {
  const theme = useTheme();

  return (
    <Box>
      <Stack spacing={0.5}>
        {/* Header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '50px 1fr 100px 80px',
            gap: 1,
            px: 2,
            py: 1,
            borderBottom: '2px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" fontWeight={800} color="text.secondary">
            #
          </Typography>
          <Typography variant="caption" fontWeight={800} color="text.secondary">
            JOUEUR
          </Typography>
          <Typography
            variant="caption"
            fontWeight={800}
            color="text.secondary"
            textAlign="center"
          >
            W / L
          </Typography>
          <Typography
            variant="caption"
            fontWeight={800}
            color="text.secondary"
            textAlign="right"
          >
            PROFIL
          </Typography>
        </Box>

        {/* Rows */}
        {standings.map((s) => {
          const isTop3 = s.rank <= 3;
          const rankColor =
            s.rank === 1
              ? '#FFD700'
              : s.rank === 2
                ? '#C0C0C0'
                : s.rank === 3
                  ? '#CD7F32'
                  : 'transparent';

          return (
            <Box
              key={s.rank}
              sx={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr 100px 80px',
                gap: 1,
                px: 2,
                py: 1.5,
                borderRadius: 2,
                alignItems: 'center',
                bgcolor: isTop3
                  ? alpha(rankColor, 0.06)
                  : 'transparent',
                transition: 'background-color 0.2s',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              {/* Rank */}
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: isTop3 ? rankColor : 'action.selected',
                  color: s.rank === 1 ? 'black' : 'text.primary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.8rem',
                }}
              >
                {s.rank}
              </Box>

              {/* Name */}
              <Typography variant="body2" fontWeight={700}>
                {s.name}
                {s.challongeUsername && (
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    @{s.challongeUsername}
                  </Typography>
                )}
              </Typography>

              {/* W/L */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography component="span" variant="body2" fontWeight={800} color="success.main">
                  {s.wins}
                </Typography>
                <Typography component="span" variant="body2" color="text.secondary" sx={{ mx: 0.5 }}>
                  /
                </Typography>
                <Typography component="span" variant="body2" fontWeight={800} color="error.main">
                  {s.losses}
                </Typography>
              </Box>

              {/* Profile Link */}
              <Box sx={{ textAlign: 'right' }}>
                {s.challongeProfileUrl && (
                  <Button
                    size="small"
                    endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                    href={s.challongeProfileUrl}
                    target="_blank"
                    rel="noopener"
                    sx={{ fontSize: '0.7rem', minWidth: 0, textTransform: 'none' }}
                  >
                    Profil
                  </Button>
                )}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

// ─── Stadiums Panel ─────────────────────────────────────────────────────────

function StadiumsPanel({
  stations,
  isLive,
}: {
  stations: Station[];
  isLive: boolean;
}) {
  const theme = useTheme();

  return (
    <Box>
      {isLive && (
        <Chip
          icon={<FiberManualRecord sx={{ fontSize: 8 }} />}
          label="Données en direct"
          size="small"
          color="error"
          variant="outlined"
          sx={{ mb: 2, fontWeight: 700 }}
        />
      )}

      <Grid container spacing={2}>
        {stations.map((station) => {
          const isActive = station.status === 'active';
          const isPaused = station.status === 'paused';

          return (
            <Grid key={station.stationId} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '2px solid',
                  borderColor: isActive
                    ? 'success.main'
                    : isPaused
                      ? 'warning.main'
                      : alpha(theme.palette.divider, 0.3),
                  bgcolor: isActive
                    ? alpha(theme.palette.success.main, 0.04)
                    : isPaused
                      ? alpha(theme.palette.warning.main, 0.04)
                      : 'transparent',
                  transition: 'all 0.3s',
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1.5 }}
                >
                  <Typography variant="subtitle2" fontWeight={800}>
                    {station.name}
                  </Typography>
                  <Chip
                    icon={
                      <FiberManualRecord
                        sx={{
                          fontSize: 8,
                          color: isActive
                            ? 'success.main'
                            : isPaused
                              ? 'warning.main'
                              : 'text.disabled',
                        }}
                      />
                    }
                    label={
                      isActive ? 'En cours' : isPaused ? 'Pause' : 'Libre'
                    }
                    size="small"
                    variant="outlined"
                    color={
                      isActive ? 'success' : isPaused ? 'warning' : 'default'
                    }
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                  />
                </Stack>

                {station.currentMatch ? (
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.background.default, 0.6),
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: '40%' }}>
                        {station.currentMatch.player1 ?? '???'}
                      </Typography>
                      <Chip
                        label={station.currentMatch.scores || 'VS'}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 900, minWidth: 50 }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        noWrap
                        textAlign="right"
                        sx={{ maxWidth: '40%' }}
                      >
                        {station.currentMatch.player2 ?? '???'}
                      </Typography>
                    </Stack>
                    {station.currentMatch.round !== 0 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        textAlign="center"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        Round {station.currentMatch.round}
                        {station.currentMatch.identifier &&
                          ` — Match ${station.currentMatch.identifier}`}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ py: 2 }}
                  >
                    Aucun match en cours
                  </Typography>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

// ─── Activity Log Panel ─────────────────────────────────────────────────────

function ActivityLogPanel({ log }: { log: LogEntry[] }) {
  const theme = useTheme();
  const [showAll, setShowAll] = useState(false);
  const displayedLog = showAll ? log : log.slice(0, 20);

  return (
    <Box>
      <Stack spacing={0}>
        {displayedLog.map((entry, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              gap: 2,
              py: 1.5,
              px: 2,
              borderBottom:
                i < displayedLog.length - 1
                  ? `1px solid ${alpha(theme.palette.divider, 0.3)}`
                  : 'none',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              },
            }}
          >
            {/* Timestamp */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ minWidth: 70, flexShrink: 0, pt: 0.25 }}
            >
              {entry.timestamp
                ? formatLogTimestamp(entry.timestamp)
                : '—'}
            </Typography>

            {/* Type badge */}
            <Chip
              label={entry.type}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.65rem',
                height: 20,
                fontWeight: 700,
                flexShrink: 0,
              }}
            />

            {/* Message */}
            <Typography variant="body2" color="text.primary" sx={{ flex: 1 }}>
              {entry.message}
            </Typography>
          </Box>
        ))}
      </Stack>

      {log.length > 20 && !showAll && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            size="small"
            onClick={() => setShowAll(true)}
            sx={{ fontWeight: 700 }}
          >
            Voir les {log.length - 20} entrées restantes
          </Button>
        </Box>
      )}
    </Box>
  );
}

function formatLogTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return ts;
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}
