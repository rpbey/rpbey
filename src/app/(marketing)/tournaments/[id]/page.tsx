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

const TournamentMap = dynamic<{ position: [number, number]; popupText: string; height?: string | number }>(
  () => import('@/components/ui/Map'),
  {
    ssr: false,
    loading: () => <Skeleton variant="rectangular" height="100%" />,
  }
);

// ─── Types ──────────────────────────────────────────────────────────────────

interface Standing {
  rank: number;
  name: string;
  challongeUsername?: string;
  challongeProfileUrl?: string;
  wins: number;
  losses: number;
  stats?: {
     wins: number;
     losses: number;
  };
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

  const isBTS2 = tournament.name.includes('BEY-TAMASHII SERIES #2') || tournament.name.includes('Bey-Tamashii');
  const isBTS1 = tournament.name.includes('BEY-TAMASHII SERIES #1');
  const isLive = tournament.status === 'UNDERWAY' || tournament.status === 'CHECKIN';

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

  const hasLiveData = standings.length > 0 || stations.length > 0 || activityLog.length > 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* --- HERO SECTION --- */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: { xs: 3, md: 5 },
          borderRadius: 6,
          position: 'relative',
          overflow: 'hidden',
          background: isBTS2 
            ? 'linear-gradient(135deg, #1a1a1a 0%, #2d1a1a 100%)' 
            : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid',
          borderColor: isBTS2 ? alpha('#fbbf24', 0.2) : 'divider',
        }}
      >
        {isBTS2 && (
          <Box
            sx={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, rgba(220, 38, 38, 0.15) 0%, transparent 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />
        )}
        
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ md: 'center' }}
          spacing={3}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <TournamentStatusChip
                status={(tournament.status || '').toLowerCase() as TournamentStatus}
              />
              {isLive && (
                <Chip
                  icon={<FiberManualRecord sx={{ fontSize: 10, animation: 'pulse 1.5s infinite' }} />}
                  label="LIVE"
                  size="small"
                  sx={{ 
                    bgcolor: 'error.main', 
                    color: 'white', 
                    fontWeight: 900,
                    px: 1,
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.4 },
                      '100%': { opacity: 1 },
                    }
                  }}
                />
              )}
            </Stack>
            <Typography
              variant="h2"
              fontWeight="900"
              sx={{ 
                letterSpacing: '-0.04em',
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                color: isBTS2 ? '#fff' : 'text.primary',
                textShadow: isBTS2 ? '0 2px 10px rgba(0,0,0,0.5)' : 'none',
                mb: 1
              }}
            >
              {tournament.name}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ color: isBTS2 ? 'grey.400' : 'text.secondary' }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <CalendarMonth sx={{ fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight={600}>{formattedDate}</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <LocationOn sx={{ fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight={600}>{tournament.location}</Typography>
              </Stack>
            </Stack>
          </Box>
          
          <Box sx={{ minWidth: { md: 200 } }}>
             <Button
                variant="contained"
                fullWidth
                href={tournament.challongeUrl || '#'}
                target="_blank"
                startIcon={<OpenInNew />}
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  fontWeight: 900,
                  fontSize: '1rem',
                  bgcolor: '#dc2626',
                  '&:hover': { bgcolor: '#b91c1c' },
                  boxShadow: '0 8px 20px rgba(220, 38, 38, 0.3)',
                }}
              >
                TABLEAU OFFICIEL
              </Button>
          </Box>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {/* Main Content Area */}
        <Grid size={{ xs: 12, md: 8 }}>
          
          {/* --- TWITCH PLAYER --- */}
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              borderRadius: 5,
              overflow: 'hidden',
              bgcolor: 'black',
              border: '1px solid',
              borderColor: alpha('#9146ff', 0.3),
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}
          >
            <Box sx={{ p: 2, bgcolor: alpha('#9146ff', 0.1), display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Sensors sx={{ color: '#9146ff' }} />
                <Typography variant="subtitle2" fontWeight={900} sx={{ color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  DIFFUSION EN DIRECT
                </Typography>
              </Stack>
              <Chip 
                label="LIVE" 
                size="small" 
                sx={{ 
                  bgcolor: '#9146ff', 
                  color: 'white', 
                  fontWeight: 900, 
                  fontSize: '0.65rem',
                  height: 20
                }} 
              />
            </Box>
            <Box sx={{ position: 'relative', pt: '56.25%', width: '100%' }}>
              <iframe
                src="https://player.twitch.tv/?channel=tv_rpb&parent=rpbey.fr&parent=localhost&parent=46.224.145.55&autoplay=true"
                title="Twitch Player"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allowFullScreen
              />
            </Box>
          </Paper>

          {/* Live Stadiums Section */}
          {isLive && stations.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: 'blur(10px)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 10, height: 10, bgcolor: 'error.main', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                  <Typography variant="h6" fontWeight="900" sx={{ letterSpacing: '0.05em' }}>
                    STADIUMS ACTIFS
                  </Typography>
                </Stack>
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  {stations.filter(s => s.status === 'active').length} Matchs en cours
                </Typography>
              </Stack>
              
              <Grid container spacing={2}>
                {stations.filter(s => s.status === 'active').slice(0, 4).map((station) => (
                  <Grid key={station.stationId} size={{ xs: 12, sm: 6 }}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        borderRadius: 4, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-2px)' }
                      }}
                    >
                      <Typography variant="caption" fontWeight={900} color="primary" sx={{ mb: 1, display: 'block', textTransform: 'uppercase' }}>
                        {station.name}
                      </Typography>
                      {station.currentMatch ? (
                        <Stack spacing={1.5}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1" fontWeight={800} sx={{ maxWidth: '40%' }} noWrap>
                              {station.currentMatch.player1 ?? '???'}
                            </Typography>
                            <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'action.selected', fontWeight: 900, color: 'primary.main', fontSize: '0.9rem' }}>
                              {station.currentMatch.scores || 'VS'}
                            </Box>
                            <Typography variant="body1" fontWeight={800} sx={{ maxWidth: '40%' }} noWrap textAlign="right">
                              {station.currentMatch.player2 ?? '???'}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary" textAlign="center" fontWeight={600}>
                            Match {station.currentMatch.identifier} • Round {station.currentMatch.round}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ py: 1 }}>
                          Prêt pour le prochain combat...
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
                {stations.filter(s => s.status === 'active').length === 0 && (
                  <Grid size={12}>
                    <Box sx={{ py: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 4 }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Les bladers se préparent pour les prochains rounds...
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {/* Info Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 5,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h6" fontWeight="900" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info fontSize="small" color="primary" /> À PROPOS
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                >
                  {tournament.description || 'Aucune description fournie.'}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}
              >
                <Typography variant="h6" fontWeight="900" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonth fontSize="small" color="primary" /> INFOS
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={800}>DATE & HEURE</Typography>
                    <Typography variant="body2" fontWeight={700}>{formattedDate} à {isBTS2 ? '13h00' : '14h00'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={800}>STRUCTURE</Typography>
                    <Typography variant="body2" fontWeight={700}>{tournament.format} • Max {tournament.maxPlayers} joueurs</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Tabs Content */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 6,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: 2,
                pt: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '& .MuiTab-root': { 
                  fontWeight: 900, 
                  fontSize: '0.9rem',
                  minHeight: 60,
                  color: 'text.secondary'
                },
                '& .Mui-selected': { color: 'primary.main' },
                '& .MuiTabs-indicator': { height: 4, borderRadius: '4px 4px 0 0' }
              }}
            >
              <Tab icon={<Trophy sx={{ fontSize: 20 }} />} iconPosition="start" label="TABLEAU" />
              <Tab icon={<Leaderboard sx={{ fontSize: 20 }} />} iconPosition="start" label="CLASSEMENT" />
              {stations.length > 0 && (
                <Tab icon={<Sensors sx={{ fontSize: 20 }} />} iconPosition="start" label="STADIUMS" />
              )}
              <Tab icon={<History sx={{ fontSize: 20 }} />} iconPosition="start" label="JOURNAL" />
            </Tabs>

            <Box sx={{ p: { xs: 2, md: 4 } }}>
              {activeTab === 0 && tournament.challongeUrl && (
                <ChallongeBracket
                  challongeUrl={tournament.challongeUrl}
                  title={`Arbre: ${tournament.name}`}
                  svgPath={isBTS1 ? '/tournaments/B_TS1.svg' : undefined}
                />
              )}

              {activeTab === 1 && <StandingsPanel standings={standings} />}

              {activeTab === 2 && stations.length > 0 && (
                <StadiumsPanel stations={stations} isLive={isLive} />
              )}

              {activeTab === (stations.length > 0 ? 3 : 2) && (
                <ActivityLogPanel log={activityLog} />
              )}
            </Box>

            {liveData?.lastUpdated && (
              <Box sx={{ px: 4, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.4) }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FiberManualRecord sx={{ fontSize: 8, color: isLive ? 'success.main' : 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Mise à jour : {new Date(liveData.lastUpdated).toLocaleTimeString('fr-FR')} 
                    {isLive && ' • Rafraîchissement automatique actif (30s)'}
                  </Typography>
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3} sx={{ position: 'sticky', top: 80 }}>
            {/* Visual Poster */}
            <Box
              sx={{
                width: '100%',
                borderRadius: 5,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                aspectRatio: '1/1',
                bgcolor: '#000',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              }}
            >
              <Box
                component="img"
                src={isBTS2 ? '/tournaments/BTS2_min.png' : isBTS1 ? '/tournaments/B_TS1.svg' : '/logo.png'}
                alt={tournament.name}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: isBTS2 ? 'cover' : 'contain',
                  p: isBTS2 ? 0 : 4,
                  filter: isBTS1 ? 'invert(1) brightness(0.9)' : 'none'
                }}
              />
            </Box>

            {/* Inscription Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 5,
                border: '1px solid',
                borderColor: 'divider',
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(12px)',
              }}
            >
              <Typography variant="subtitle2" fontWeight="900" gutterBottom sx={{ textTransform: 'uppercase' }}>
                PARTICIPATION
              </Typography>
              <Stack spacing={2}>
                {tournament.challongeUrl && (
                  <Button
                    variant="contained"
                    fullWidth
                    href={tournament.challongeUrl}
                    target="_blank"
                    rel="noopener"
                    sx={{
                      borderRadius: 3,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                      color: '#fff',
                      fontWeight: 900,
                    }}
                  >
                    S&apos;INSCRIRE
                  </Button>
                )}
                <Button
                  variant="outlined"
                  fullWidth
                  href="https://discord.gg/rpb"
                  target="_blank"
                  sx={{ borderRadius: 3, py: 1.5, fontWeight: 800, borderColor: 'divider' }}
                >
                  REJOINDRE LE DISCORD
                </Button>
              </Stack>
            </Paper>

            {/* Quick Standings Sidebar */}
            {standings.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 5,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="subtitle2" fontWeight="900" sx={{ mb: 2 }}>TOP PLAYERS</Typography>
                <Stack spacing={1.5}>
                  {standings.slice(0, 5).map((s, i) => {
                    const colors = ['#fbbf24', '#94a3b8', '#d97706'];
                    const isPodium = i < 3;
                    const color = colors[i] || '#cbd5e1';
                    return (
                      <Box
                        key={s.rank}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 3,
                          bgcolor: isPodium ? alpha(color, 0.08) : 'transparent',
                        }}
                      >
                        <Typography variant="body2" fontWeight={900} sx={{ width: 20, color: isPodium ? color : 'text.disabled' }}>
                          {s.rank}
                        </Typography>
                        <Typography variant="body2" fontWeight={800} sx={{ flex: 1 }} noWrap>
                          {s.name}
                        </Typography>
                        <Typography variant="caption" fontWeight={900} color="success.main">{s.wins}W</Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            )}

            <Paper
              elevation={0}
              sx={{
                height: 250,
                borderRadius: 5,
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
      <Stack spacing={1}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 120px 100px',
            gap: 2,
            px: 3,
            py: 1.5,
            bgcolor: 'action.hover',
            borderRadius: 3,
          }}
        >
          <Typography variant="caption" fontWeight={900} color="text.secondary">RANK</Typography>
          <Typography variant="caption" fontWeight={900} color="text.secondary">BLADER</Typography>
          <Typography variant="caption" fontWeight={900} color="text.secondary" textAlign="center">SCORE / WR</Typography>
          <Typography variant="caption" fontWeight={900} color="text.secondary" textAlign="right">CHALLONGE</Typography>
        </Box>

        {standings.map((s) => {
          const isTop3 = s.rank <= 3;
          const rankColors = ['#fbbf24', '#94a3b8', '#d97706'];
          const rankColor = (isTop3 ? rankColors[s.rank - 1] : undefined) || 'transparent';
          
          const wins = s.stats?.wins ?? s.wins;
          const losses = s.stats?.losses ?? s.losses;
          const totalGames = wins + losses;
          const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

          return (
            <Box
              key={s.rank}
              sx={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 120px 100px',
                gap: 2,
                px: 3,
                py: 2,
                borderRadius: 4,
                alignItems: 'center',
                bgcolor: isTop3 ? alpha(rankColor, 0.04) : 'transparent',
                border: '1px solid',
                borderColor: isTop3 ? alpha(rankColor, 0.15) : alpha(theme.palette.divider, 0.5),
                transition: 'all 0.2s',
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  bgcolor: isTop3 ? rankColor : 'action.selected',
                  color: s.rank === 1 ? 'black' : isTop3 ? 'white' : 'text.primary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                }}
              >
                {s.rank}
              </Box>

              <Box>
                <Typography variant="body1" fontWeight={800}>{s.name}</Typography>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" fontWeight={900}>
                  <Box component="span" sx={{ color: 'success.main' }}>{wins}</Box>
                  <Box component="span" sx={{ mx: 0.5, color: 'text.disabled' }}>-</Box>
                  <Box component="span" sx={{ color: 'error.main' }}>{losses}</Box>
                </Typography>
                <Typography variant="caption" fontWeight={800} color="text.secondary">
                  {winRate}% WR
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                {s.challongeProfileUrl && (
                  <Button
                    size="small"
                    variant="outlined"
                    href={s.challongeProfileUrl}
                    target="_blank"
                    sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.7rem' }}
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

function StadiumsPanel({ stations, isLive }: { stations: Station[]; isLive: boolean }) {
  const theme = useTheme();

  return (
    <Box>
      <Grid container spacing={3}>
        {stations.map((station) => {
          const isActive = station.status === 'active';
          return (
            <Grid key={station.stationId} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 5,
                  border: '2px solid',
                  borderColor: isActive ? 'error.main' : 'divider',
                  bgcolor: isActive ? alpha(theme.palette.error.main, 0.02) : 'background.paper',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                  <Typography variant="subtitle1" fontWeight={900}>{station.name}</Typography>
                  <Chip
                    label={isActive ? 'LIVE' : 'IDLE'}
                    size="small"
                    sx={{ 
                      fontWeight: 900, 
                      bgcolor: isActive ? 'error.main' : 'action.selected',
                      color: isActive ? 'white' : 'text.secondary'
                    }}
                  />
                </Stack>

                {station.currentMatch ? (
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight={800} sx={{ maxWidth: '40%' }} noWrap>{station.currentMatch.player1 ?? '???'}</Typography>
                      <Typography variant="caption" fontWeight={900} color="primary">VS</Typography>
                      <Typography variant="body2" fontWeight={800} sx={{ maxWidth: '40%' }} noWrap textAlign="right">{station.currentMatch.player2 ?? '???'}</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} textAlign="center" sx={{ display: 'block' }}>
                      {station.currentMatch.scores || 'En combat'}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                     <Typography variant="body2" color="text.disabled" fontWeight={600}>Libre</Typography>
                  </Box>
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
  const displayedLog = showAll ? log : log.slice(0, 30);

  return (
    <Box>
      <Stack spacing={2}>
        {displayedLog.map((entry, i) => {
          const isMatch = entry.type?.includes('match');
          return (
            <Box
              key={i}
              sx={{
                display: 'flex',
                gap: 2.5,
                p: 2,
                borderRadius: 3,
                borderLeft: '4px solid',
                borderColor: isMatch ? 'primary.main' : 'divider',
                bgcolor: alpha(theme.palette.background.default, 0.4),
              }}
            >
              <Box sx={{ pt: 0.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: isMatch ? alpha(theme.palette.primary.main, 0.1) : 'action.selected',
                    color: isMatch ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {isMatch ? <Trophy fontSize="small" /> : <Info fontSize="small" />}
                </Box>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                   <Typography variant="caption" fontWeight={900} sx={{ textTransform: 'uppercase' }}>{entry.type}</Typography>
                   <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {formatLogTimestamp(entry.timestamp)}
                   </Typography>
                </Stack>
                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.5 }}>{entry.message}</Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
      {log.length > 30 && !showAll && (
        <Button fullWidth variant="outlined" onClick={() => setShowAll(true)} sx={{ mt: 3, py: 1.5, borderRadius: 3, fontWeight: 800 }}>
          VOIR TOUT
        </Button>
      )}
    </Box>
  );
}

function formatLogTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return ts;
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ts; }
}