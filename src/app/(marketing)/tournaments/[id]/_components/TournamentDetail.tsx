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
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useSWR from 'swr';
import { ChallongeBracket } from '@/components/tournaments';
import { DownloadBracketButton } from '@/components/tournaments/DownloadBracketButton';
import { type TournamentStatus, TournamentStatusChip } from '@/components/ui';
import { useSession } from '@/lib/auth-client';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const TournamentMap = dynamic<{
  position: [number, number];
  popupText: string;
  height?: string | number;
}>(() => import('@/components/ui/Map'), {
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

interface InitialLiveData {
  standings: unknown[];
  stations: unknown[];
  activityLog: unknown[];
  lastUpdated: string;
}

export interface TournamentData {
  id: string;
  name: string;
  status: string;
  description: string | null;
  date: string;
  location: string | null;
  format: string;
  maxPlayers: number;
  challongeId: string | null;
  challongeUrl: string | null;
  updatedAt: string;
}

interface TournamentDetailProps {
  tournament: TournamentData;
  formattedDate: string;
  initialLiveData: InitialLiveData;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TournamentDetail({
  tournament,
  formattedDate,
  initialLiveData,
}: TournamentDetailProps) {
  const theme = useTheme();
  const { data: session } = useSession();
  const { data: profileData } = useSWR(session ? '/api/profile' : null, fetcher);
  
  const [liveData, setLiveData] = useState<LiveData>(
    initialLiveData as LiveData,
  );
  const [activeTab, setActiveTab] = useState(0);

  const isLive =
    tournament.status === 'UNDERWAY' || tournament.status === 'CHECKIN';

  const fetchLiveData = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/live`);
      if (res.ok) {
        const response = await res.json();
        setLiveData(response.data);
      }
    } catch {
      // Silently fail for live data
    }
  }, [tournament.id]);

  // Auto-refresh only for active tournaments
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, [isLive, fetchLiveData]);

  const isBTS = tournament.name.toLowerCase().includes('bey-tamashii');
  const isBTS2 = tournament.name.includes('#2');
  const isBTS3 = tournament.name.includes('#3') || tournament.id === 'cm-bts3-auto-imported';
  const isBTS1 = tournament.name.includes('#1');

  const mapPosition: [number, number] = [48.85785, 2.34623];

  const standings = (liveData?.standings || []) as Standing[];
  const stations = (liveData?.stations || []) as Station[];
  const activityLog = (liveData?.activityLog || []) as LogEntry[];

  const posterUrl = isBTS3 
    ? "https://media.discordapp.net/attachments/1448476446724063252/1474480761846628382/IMG_2626.gif?ex=699fef78&is=699e9df8&hm=4375b7173367198be08ca1e798a3a5d2ac3a5462dfdc8c4881670ff40bf3e1ab&=&width=1040&height=1467"
    : isBTS2
      ? '/tournaments/BTS2_optimized.webp'
      : isBTS1
        ? '/tournaments/B_TS1.svg'
        : '/logo.png';

  return (
    <Box sx={{ width: '100%', py: { xs: 2, md: 4 }, px: { xs: 2, md: 4, lg: 6 } }}>
      {/* --- HERO SECTION --- */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: { xs: 3, md: 6 },
          borderRadius: { xs: 4, md: 8 },
          position: 'relative',
          overflow: 'hidden',
          background: isBTS
            ? 'linear-gradient(135deg, #0f0f0f 0%, #1a0505 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid',
          borderColor: isBTS ? alpha('#dc2626', 0.3) : 'divider',
          boxShadow: isBTS ? '0 20px 40px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        {isBTS && (
          <>
            <Box
              sx={{
                position: 'absolute',
                top: -150,
                right: -150,
                width: 400,
                height: 400,
                background: 'radial-gradient(circle, rgba(220, 38, 38, 0.2) 0%, transparent 70%)',
                filter: 'blur(60px)',
                pointerEvents: 'none',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -100,
                left: -100,
                width: 300,
                height: 300,
                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)',
                filter: 'blur(50px)',
                pointerEvents: 'none',
              }}
            />
          </>
        )}

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ md: 'center' }}
          spacing={4}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Box sx={{ flex: 1 }}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <TournamentStatusChip
                status={
                  (tournament.status || '').toLowerCase() as TournamentStatus
                }
              />
              {isBTS && (
                <Chip
                  label="SERIES"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(251, 191, 36, 0.15)',
                    color: '#fbbf24',
                    fontWeight: 900,
                    fontSize: '0.65rem',
                    letterSpacing: 1,
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                  }}
                />
              )}
              {isLive && (
                <Chip
                  icon={
                    <FiberManualRecord
                      sx={{ fontSize: 10, animation: 'pulse 1.5s infinite' }}
                    />
                  }
                  label="LIVE"
                  size="small"
                  sx={{
                    bgcolor: '#dc2626',
                    color: 'white',
                    fontWeight: 900,
                    px: 1,
                  }}
                />
              )}
            </Stack>
            <Typography
              variant="h1"
              fontWeight="900"
              sx={{
                letterSpacing: '-0.05em',
                fontSize: { xs: '2.2rem', sm: '3rem', md: '4rem', lg: '5rem' },
                color: isBTS ? '#fff' : 'text.primary',
                textShadow: isBTS ? '0 4px 20px rgba(0,0,0,0.6)' : 'none',
                lineHeight: 1,
                mb: 2,
              }}
            >
              {tournament.name}
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1, sm: 3 }}
              sx={{ color: isBTS ? 'grey.400' : 'text.secondary' }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarMonth sx={{ fontSize: 24, color: 'error.main' }} />
                <Typography variant="h6" fontWeight={700}>
                  {formattedDate}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocationOn sx={{ fontSize: 24, color: 'error.main' }} />
                <Typography variant="h6" fontWeight={700}>
                  {tournament.location}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ minWidth: { md: 300 } }}>
            <Button
              variant="contained"
              fullWidth
              href={tournament.challongeUrl || '#'}
              target="_blank"
              size="large"
              startIcon={<OpenInNew />}
              sx={{
                py: 2.5,
                px: 6,
                borderRadius: 4,
                fontWeight: 900,
                fontSize: '1.25rem',
                bgcolor: '#dc2626',
                '&:hover': { 
                  bgcolor: '#b91c1c',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 15px 35px rgba(220, 38, 38, 0.6)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 8px 25px rgba(220, 38, 38, 0.4)',
              }}
            >
              S&apos;INSCRIRE MAINTENANT
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Grid container spacing={{ xs: 2, md: 4 }}>
        {/* Sidebar - Visible at top on Mobile, right on Desktop */}
        <Grid size={{ xs: 12, lg: 3 }} sx={{ order: { xs: 1, lg: 2 } }}>
          <Stack spacing={{ xs: 2, md: 4 }} sx={{ position: { lg: 'sticky' }, top: { lg: 100 } }}>
            {/* Visual Poster */}
            <Box
              sx={{
                width: '100%',
                borderRadius: { xs: 4, md: 6 },
                overflow: 'hidden',
                border: '1px solid',
                borderColor: isBTS ? 'rgba(255,255,255,0.1)' : 'divider',
                aspectRatio: '1040/1467',
                bgcolor: '#000',
                boxShadow: isBTS ? '0 25px 50px rgba(0,0,0,0.5)' : '0 15px 35px rgba(0,0,0,0.1)',
                position: 'relative',
              }}
            >
              <Image
                src={posterUrl}
                alt={tournament.name}
                fill
                unoptimized={isBTS3}
                sizes="(max-width: 900px) 100vw, 25vw"
                style={{
                  objectFit: 'cover',
                  padding: 0,
                }}
                priority={true}
              />
              <Box sx={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                p: { xs: 2, md: 3 }, 
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5
              }}>
                <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', fontSize: { xs: '0.6rem', md: '0.75rem' } }}>
                  ÉVÉNEMENT OFFICIEL
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 800, opacity: 0.8, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                  RÉPUBLIQUE POPULAIRE DU BEYBLADE
                </Typography>
              </Box>
            </Box>

            {/* Inscription Card */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 4 },
                borderRadius: { xs: 4, md: 6 },
                border: '1px solid',
                borderColor: isBTS ? alpha('#dc2626', 0.4) : 'divider',
                background: isBTS ? 'linear-gradient(135deg, #1a0a0a 0%, #0a0a0a 100%)' : alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(12px)',
                boxShadow: isBTS ? '0 15px 35px rgba(220, 38, 38, 0.15)' : 'none'
              }}
            >
              <Typography
                variant="h6"
                fontWeight="900"
                gutterBottom
                sx={{ textTransform: 'uppercase', letterSpacing: 2, color: isBTS ? 'white' : 'text.primary', mb: 3, display: { xs: 'none', md: 'block' } }}
              >
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
                      py: { xs: 1.5, md: 2 },
                      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      boxShadow: '0 8px 20px rgba(220, 38, 38, 0.4)',
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
                  sx={{
                    borderRadius: 3,
                    py: 1.5,
                    fontWeight: 800,
                    borderColor: isBTS ? alpha('#fff', 0.2) : 'divider',
                    color: isBTS ? 'white' : 'text.primary',
                  }}
                >
                  DISCORD
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* Main Content Area */}
        <Grid size={{ xs: 12, lg: 9 }} sx={{ order: { xs: 2, lg: 1 } }}>
          {/* Live Stadiums Section */}
          {isLive && stations.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                mb: 4,
                borderRadius: 6,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: 'blur(10px)',
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 4 }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 12,
                      height: 10,
                      bgcolor: 'error.main',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite',
                    }}
                  />
                  <Typography
                    variant="h5"
                    fontWeight="900"
                    sx={{ letterSpacing: '0.05em' }}
                  >
                    STADIUMS EN DIRECT
                  </Typography>
                </Stack>
                <Chip 
                  label={`${stations.filter((s) => s.status === 'active').length} Matchs actifs`}
                  variant="outlined"
                  sx={{ fontWeight: 800 }}
                />
              </Stack>

              <Grid container spacing={3}>
                {stations
                  .filter((s) => s.status === 'active')
                  .map((station) => (
                    <Grid key={station.stationId} size={{ xs: 12, sm: 6, xl: 3 }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          borderRadius: 4,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          transition: 'all 0.2s ease',
                          '&:hover': { 
                            transform: 'translateY(-4px)',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                            borderColor: 'error.main'
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={900}
                          color="primary"
                          sx={{
                            mb: 2,
                            display: 'block',
                            textTransform: 'uppercase',
                            letterSpacing: 1
                          }}
                        >
                          {station.name}
                        </Typography>
                        {station.currentMatch ? (
                          <Stack spacing={2}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography
                                variant="body1"
                                fontWeight={900}
                                sx={{ maxWidth: '42%' }}
                                noWrap
                              >
                                {station.currentMatch.player1 ?? '???'}
                              </Typography>
                              <Box
                                sx={{
                                  px: 2,
                                  py: 0.75,
                                  borderRadius: 2,
                                  bgcolor: 'error.main',
                                  fontWeight: 900,
                                  color: 'white',
                                  fontSize: '0.85rem',
                                  boxShadow: '0 4px 10px rgba(220, 38, 38, 0.3)'
                                }}
                              >
                                {station.currentMatch.scores || 'VS'}
                              </Box>
                              <Typography
                                variant="body1"
                                fontWeight={900}
                                sx={{ maxWidth: '42%' }}
                                noWrap
                                textAlign="right"
                              >
                                {station.currentMatch.player2 ?? '???'}
                              </Typography>
                            </Stack>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              textAlign="center"
                              fontWeight={700}
                            >
                              Match {station.currentMatch.identifier} • Round{' '}
                              {station.currentMatch.round}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography
                            variant="body2"
                            color="text.disabled"
                            textAlign="center"
                            sx={{ py: 1 }}
                          >
                            Prêt pour le combat...
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
              </Grid>
            </Paper>
          )}

          {/* Info Cards */}
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, xl: 8 }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 5 },
                  height: '100%',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: isBTS ? alpha('#fbbf24', 0.3) : 'divider',
                  background: isBTS 
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)' 
                    : 'background.paper',
                  position: 'relative'
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight="900"
                  gutterBottom
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    color: isBTS ? '#fbbf24' : 'primary.main',
                    mb: 4,
                    letterSpacing: 1.5
                  }}
                >
                  <Info fontSize="large" /> À PROPOS DU TOURNOI
                </Typography>
                
                <Box sx={{ position: 'relative' }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => {
                        const content = String(children);
                        if (content.includes('🥇') || content.includes('🥈') || content.includes('🥉')) {
                          return (
                            <Box sx={{ 
                              my: 2, 
                              p: 2, 
                              bgcolor: 'rgba(251, 191, 36, 0.08)', 
                              borderRadius: 3,
                              borderLeft: '6px solid #fbbf24',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2.5,
                              transition: 'transform 0.2s',
                              '&:hover': { transform: 'scale(1.01)', bgcolor: 'rgba(251, 191, 36, 0.12)' }
                            }}>
                              <Typography variant="h6" fontWeight="900" sx={{ color: '#fff', m: 0 }}>{children}</Typography>
                            </Box>
                          );
                        }
                        if (content.includes('⚠️')) {
                          return (
                            <Box sx={{ 
                              my: 3, 
                              p: 3, 
                              bgcolor: 'rgba(239, 68, 68, 0.15)', 
                              borderRadius: 4,
                              border: '2px solid rgba(239, 68, 68, 0.3)',
                              boxShadow: '0 10px 30px rgba(239, 68, 68, 0.1)'
                            }}>
                              <Typography variant="body1" fontWeight="800" sx={{ color: '#ef4444', lineHeight: 1.6, m: 0 }}>{children}</Typography>
                            </Box>
                          );
                        }
                        return (
                          <Typography variant="body1" sx={{ 
                            mb: 2, 
                            lineHeight: 2, 
                            fontSize: '1.1rem',
                            fontWeight: 500,
                            color: isBTS ? 'grey.300' : 'text.primary'
                          }}>
                            {children}
                          </Typography>
                        );
                      },
                      strong: ({ children }) => (
                        <Box component="span" sx={{ fontWeight: 900, color: isBTS ? '#fff' : 'text.primary' }}>{children}</Box>
                      ),
                      em: ({ children }) => (
                        <Box component="span" sx={{ fontStyle: 'italic', opacity: 0.9 }}>{children}</Box>
                      ),
                      a: ({ href, children }) => (
                        <Box component="a" href={href} target="_blank" rel="noopener" sx={{ 
                          color: 'error.main', 
                          textDecoration: 'none', 
                          fontWeight: 700,
                          '&:hover': { textDecoration: 'underline' }
                        }}>
                          {children}
                        </Box>
                      )
                    }}
                  >
                    {tournament.description || 'Aucune description fournie.'}
                  </ReactMarkdown>
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, xl: 4 }}>
              <Stack spacing={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: isBTS ? 'rgba(255,255,255,0.03)' : 'background.paper',
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight="900"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: isBTS ? '#fbbf24' : 'primary.main', mb: 3 }}
                  >
                    <CalendarMonth /> INFOS CLÉS
                  </Typography>
                  <Stack spacing={4}>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={900}
                        sx={{ letterSpacing: 2, display: 'block', mb: 1 }}
                      >
                        DATE & HEURE
                      </Typography>
                      <Typography variant="h5" fontWeight={900} color={isBTS ? '#fff' : 'text.primary'}>
                        {formattedDate}
                      </Typography>
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(239, 68, 68, 0.1)', borderRadius: 1.5, display: 'inline-block' }}>
                        <Typography variant="subtitle2" fontWeight={900} color="error.main">
                          Check-in : {isBTS3 || isBTS2 ? '13h00' : '14h00'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={900}
                        sx={{ letterSpacing: 2, display: 'block', mb: 1 }}
                      >
                        LIEU DU COMBAT
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color={isBTS ? '#fff' : 'text.primary'} sx={{ lineHeight: 1.4 }}>
                        {tournament.location}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={900}
                        sx={{ letterSpacing: 2, display: 'block', mb: 1 }}
                      >
                        FORMAT & CAPACITÉ
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color={isBTS ? '#fff' : 'text.primary'}>
                        {tournament.format}
                      </Typography>
                      <Chip 
                        label={`Max ${tournament.maxPlayers} bladers`} 
                        size="small" 
                        sx={{ mt: 1, fontWeight: 900, bgcolor: 'action.selected' }} 
                      />
                    </Box>
                  </Stack>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    height: 300,
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
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

          {/* Tabs Content */}
          <Paper
            id="tournament-view"
            elevation={0}
            sx={{
              borderRadius: 8,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              bgcolor: 'background.paper',
              boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="fullWidth"
              sx={{
                bgcolor: 'rgba(0,0,0,0.02)',
                borderBottom: '1px solid',
                borderColor: 'divider',
                '& .MuiTab-root': {
                  fontWeight: 900,
                  fontSize: '1rem',
                  minHeight: 70,
                  color: 'text.secondary',
                  letterSpacing: 1
                },
                '& .Mui-selected': { color: 'error.main', bgcolor: 'rgba(220, 38, 38, 0.02)' },
                '& .MuiTabs-indicator': {
                  height: 4,
                  bgcolor: 'error.main',
                  borderRadius: '4px 4px 0 0',
                },
              }}
            >
              <Tab
                icon={<Trophy sx={{ fontSize: 22 }} />}
                iconPosition="start"
                label="TABLEAU"
              />
              <Tab
                icon={<Leaderboard sx={{ fontSize: 22 }} />}
                iconPosition="start"
                label="CLASSEMENT"
              />
              {stations.length > 0 && (
                <Tab
                  icon={<Sensors sx={{ fontSize: 22 }} />}
                  iconPosition="start"
                  label="STADIUMS"
                />
              )}
              <Tab
                icon={<History sx={{ fontSize: 22 }} />}
                iconPosition="start"
                label="JOURNAL"
              />
            </Tabs>

            <Box sx={{ p: { xs: 2, md: 6 } }}>
              {activeTab === 0 && tournament.challongeUrl && (
                <ChallongeBracket
                  challongeUrl={tournament.challongeUrl}
                  title={`Arbre: ${tournament.name}`}
                  svgPath={isBTS1 ? '/tournaments/B_TS1.svg' : undefined}
                />
              )}

              {activeTab === 1 && <StandingsPanel standings={standings} />}

              {activeTab === 2 && stations.length > 0 && (
                <StadiumsPanel stations={stations} />
              )}

              {activeTab === (stations.length > 0 ? 3 : 2) && (
                <ActivityLogPanel log={activityLog} />
              )}
            </Box>

            {liveData?.lastUpdated && (
              <Box
                sx={{
                  px: 4,
                  py: 2,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: alpha(theme.palette.background.default, 0.4),
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <FiberManualRecord
                    sx={{
                      fontSize: 8,
                      color: isLive ? 'success.main' : 'text.disabled',
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    Mise à jour :{' '}
                    {new Date(liveData.lastUpdated).toLocaleTimeString('fr-FR')}
                    {isLive && ' • Rafraîchissement automatique actif (30s)'}
                  </Typography>
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack spacing={4} sx={{ position: 'sticky', top: 100 }}>
            {/* Visual Poster */}
            <Box
              sx={{
                width: '100%',
                borderRadius: 6,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: isBTS ? 'rgba(255,255,255,0.1)' : 'divider',
                aspectRatio: '1040/1467',
                bgcolor: '#000',
                boxShadow: isBTS ? '0 25px 50px rgba(0,0,0,0.5)' : '0 15px 35px rgba(0,0,0,0.1)',
                position: 'relative',
              }}
            >
              <Image
                src={posterUrl}
                alt={tournament.name}
                fill
                unoptimized={isBTS3}
                sizes="(max-width: 900px) 100vw, 25vw"
                style={{
                  objectFit: 'cover',
                  padding: 0,
                }}
                priority={true}
              />
              <Box sx={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                p: 3, 
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1
              }}>
                <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' }}>
                  ÉVÉNEMENT OFFICIEL
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 800, opacity: 0.8 }}>
                  RÉPUBLIQUE POPULAIRE DU BEYBLADE
                </Typography>
              </Box>
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
              <Typography
                variant="subtitle2"
                fontWeight="900"
                gutterBottom
                sx={{ textTransform: 'uppercase' }}
              >
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
                      background:
                        'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
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
                  sx={{
                    borderRadius: 3,
                    py: 1.5,
                    fontWeight: 800,
                    borderColor: 'divider',
                  }}
                >
                  REJOINDRE LE DISCORD
                </Button>
                <DownloadBracketButton
                  targetId="tournament-view"
                  fileName={tournament.id || 'tournoi-rpb'}
                />
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
                <Typography variant="subtitle2" fontWeight="900" sx={{ mb: 2 }}>
                  TOP PLAYERS
                </Typography>
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
                          bgcolor: isPodium
                            ? alpha(color, 0.08)
                            : 'transparent',
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={900}
                          sx={{
                            width: 20,
                            color: isPodium ? color : 'text.disabled',
                          }}
                        >
                          {s.rank}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          sx={{ flex: 1 }}
                          noWrap
                        >
                          {s.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={900}
                          color="success.main"
                        >
                          {s.wins}W
                        </Typography>
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
    </Box>
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
          <Typography variant="caption" fontWeight={900} color="text.secondary">
            RANK
          </Typography>
          <Typography variant="caption" fontWeight={900} color="text.secondary">
            BLADER
          </Typography>
          <Typography
            variant="caption"
            fontWeight={900}
            color="text.secondary"
            textAlign="center"
          >
            SCORE / WR
          </Typography>
          <Typography
            variant="caption"
            fontWeight={900}
            color="text.secondary"
            textAlign="right"
          >
            CHALLONGE
          </Typography>
        </Box>

        {standings.map((s) => {
          const isTop3 = s.rank <= 3;
          const rankColors = ['#fbbf24', '#94a3b8', '#d97706'];
          const rankColor =
            (isTop3 ? rankColors[s.rank - 1] : undefined) || 'transparent';

          const wins = s.stats?.wins ?? s.wins;
          const losses = s.stats?.losses ?? s.losses;
          const totalGames = wins + losses;
          const winRate =
            totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

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
                borderColor: isTop3
                  ? alpha(rankColor, 0.15)
                  : alpha(theme.palette.divider, 0.5),
                transition: 'all 0.2s',
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  bgcolor: isTop3 ? rankColor : 'action.selected',
                  color:
                    s.rank === 1 ? 'black' : isTop3 ? 'white' : 'text.primary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                }}
              >
                {s.rank}
              </Box>

              <Box>
                <Typography variant="body1" fontWeight={800}>
                  {s.name}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" fontWeight={900}>
                  <Box component="span" sx={{ color: 'success.main' }}>
                    {wins}
                  </Box>
                  <Box
                    component="span"
                    sx={{ mx: 0.5, color: 'text.disabled' }}
                  >
                    -
                  </Box>
                  <Box component="span" sx={{ color: 'error.main' }}>
                    {losses}
                  </Box>
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={800}
                  color="text.secondary"
                >
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
                    sx={{
                      borderRadius: 2,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                    }}
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

function StadiumsPanel({ stations }: { stations: Station[] }) {
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
                  bgcolor: isActive
                    ? alpha(theme.palette.error.main, 0.02)
                    : 'background.paper',
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2.5 }}
                >
                  <Typography variant="subtitle1" fontWeight={900}>
                    {station.name}
                  </Typography>
                  <Chip
                    label={isActive ? 'LIVE' : 'IDLE'}
                    size="small"
                    sx={{
                      fontWeight: 900,
                      bgcolor: isActive ? 'error.main' : 'action.selected',
                      color: isActive ? 'white' : 'text.secondary',
                    }}
                  />
                </Stack>

                {station.currentMatch ? (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: 'action.hover',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={800}
                        sx={{ maxWidth: '40%' }}
                        noWrap
                      >
                        {station.currentMatch.player1 ?? '???'}
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight={900}
                        color="primary"
                      >
                        VS
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={800}
                        sx={{ maxWidth: '40%' }}
                        noWrap
                        textAlign="right"
                      >
                        {station.currentMatch.player2 ?? '???'}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={700}
                      textAlign="center"
                      sx={{ display: 'block' }}
                    >
                      {station.currentMatch.scores || 'En combat'}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography
                      variant="body2"
                      color="text.disabled"
                      fontWeight={600}
                    >
                      Libre
                    </Typography>
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
                    bgcolor: isMatch
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'action.selected',
                    color: isMatch ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {isMatch ? (
                    <Trophy fontSize="small" />
                  ) : (
                    <Info fontSize="small" />
                  )}
                </Box>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={900}
                    sx={{ textTransform: 'uppercase' }}
                  >
                    {entry.type}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    {formatLogTimestamp(entry.timestamp)}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ lineHeight: 1.5 }}
                >
                  {entry.message}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
      {log.length > 30 && !showAll && (
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setShowAll(true)}
          sx={{ mt: 3, py: 1.5, borderRadius: 3, fontWeight: 800 }}
        >
          VOIR TOUT
        </Button>
      )}
    </Box>
  );
}

function formatLogTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return ts;
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}
