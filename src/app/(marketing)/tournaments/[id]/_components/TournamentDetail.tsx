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
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ md: 'center' }}
          spacing={4}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <TournamentStatusChip status={(tournament.status || '').toLowerCase() as TournamentStatus} />
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
                  icon={<FiberManualRecord sx={{ fontSize: 10, animation: 'pulse 1.5s infinite' }} />}
                  label="LIVE"
                  size="small"
                  sx={{ bgcolor: '#dc2626', color: 'white', fontWeight: 900, px: 1 }}
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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }} sx={{ color: isBTS ? 'grey.400' : 'text.secondary' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarMonth sx={{ fontSize: 24, color: 'error.main' }} />
                <Typography variant="h6" fontWeight={700}>{formattedDate}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocationOn sx={{ fontSize: 24, color: 'error.main' }} />
                <Typography variant="h6" fontWeight={700}>{tournament.location}</Typography>
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
                '&:hover': { transform: 'translateY(-4px)', bgcolor: '#b91c1c' },
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
        {/* SIDEBAR (Top on Mobile, Right on Desktop) */}
        <Grid size={{ xs: 12, lg: 3 }} sx={{ order: { xs: 1, lg: 2 } }}>
          <Stack spacing={{ xs: 2, md: 4 }} sx={{ position: { lg: 'sticky' }, top: { lg: 100 } }}>
            {/* Poster */}
            <Box
              sx={{
                width: '100%',
                borderRadius: { xs: 4, md: 6 },
                overflow: 'hidden',
                border: '1px solid',
                borderColor: isBTS ? 'rgba(255,255,255,0.1)' : 'divider',
                aspectRatio: '1040/1467',
                bgcolor: '#000',
                position: 'relative',
                boxShadow: isBTS ? '0 25px 50px rgba(0,0,0,0.5)' : 'none'
              }}
            >
              <Image src={posterUrl} alt={tournament.name} fill unoptimized={isBTS3} style={{ objectFit: 'cover' }} priority />
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 3, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase' }}>ÉVÉNEMENT OFFICIEL</Typography>
              </Box>
            </Box>

            {/* Participation Card */}
            <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 6, border: '1px solid', borderColor: isBTS ? alpha('#dc2626', 0.4) : 'divider', background: isBTS ? 'linear-gradient(135deg, #1a0a0a 0%, #0a0a0a 100%)' : 'background.paper' }}>
              <Typography variant="h6" fontWeight="900" sx={{ mb: 3, letterSpacing: 1 }}>PARTICIPATION</Typography>
              <Stack spacing={2}>
                {session && (
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {profileData?.challongeUsername ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box component="img" src="https://challonge.com/favicon.ico" sx={{ width: 16, height: 16 }} />
                        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 900 }}>LIÉ : {profileData.challongeUsername}</Typography>
                      </Stack>
                    ) : (
                      <Button fullWidth size="small" variant="outlined" component={Link} href={`/api/auth/challonge?returnTo=/tournaments/${tournament.id}`} sx={{ color: '#fbbf24', borderColor: '#fbbf24', fontWeight: 900 }}>LIER MON CHALLONGE</Button>
                    )}
                  </Box>
                )}
                {tournament.challongeUrl && (
                  <Button variant="contained" fullWidth href={tournament.challongeUrl} target="_blank" sx={{ py: 1.5, fontWeight: 900, bgcolor: '#dc2626' }}>S&apos;INSCRIRE</Button>
                )}
                <Button variant="outlined" fullWidth href="https://discord.gg/rpb" target="_blank" sx={{ color: isBTS ? 'white' : 'text.primary', borderColor: isBTS ? 'rgba(255,255,255,0.2)' : 'divider' }}>DISCORD</Button>
                <DownloadBracketButton targetId="tournament-view" fileName={tournament.id} />
              </Stack>
            </Paper>

            {/* Map */}
            <Paper elevation={0} sx={{ height: 300, borderRadius: 6, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <TournamentMap position={mapPosition} popupText={tournament.location || 'Lieu'} />
            </Paper>
          </Stack>
        </Grid>

        {/* MAIN CONTENT AREA */}
        <Grid size={{ xs: 12, lg: 9 }} sx={{ order: { xs: 2, lg: 1 } }}>
          {/* Live Stadiums */}
          {isLive && stations.length > 0 && (
            <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 6, border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.6), backdropFilter: 'blur(10px)' }}>
              <Typography variant="h5" fontWeight="900" sx={{ mb: 4 }}>STADIUMS EN DIRECT</Typography>
              <Grid container spacing={3}>
                {stations.filter(s => s.status === 'active').map(station => (
                  <Grid key={station.stationId} size={{ xs: 12, sm: 6, xl: 3 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                      <Typography variant="caption" fontWeight="900" color="primary" sx={{ display: 'block', mb: 2 }}>{station.name}</Typography>
                      {station.currentMatch ? (
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight="900" noWrap sx={{ maxWidth: '40%' }}>{station.currentMatch.player1}</Typography>
                          <Typography variant="caption" fontWeight="900" sx={{ px: 1, py: 0.5, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>{station.currentMatch.scores || 'VS'}</Typography>
                          <Typography variant="body2" fontWeight="900" noWrap sx={{ maxWidth: '40%' }} textAlign="right">{station.currentMatch.player2}</Typography>
                        </Stack>
                      ) : <Typography variant="body2" color="text.disabled">Libre</Typography>}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* About Section */}
          <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, mb: 4, borderRadius: 6, border: '1px solid', borderColor: isBTS ? alpha('#fbbf24', 0.3) : 'divider', background: isBTS ? 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)' : 'background.paper' }}>
            <Typography variant="h5" fontWeight="900" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, color: isBTS ? '#fbbf24' : 'primary.main' }}><Info /> À PROPOS</Typography>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => {
                  const content = String(children);
                  if (content.includes('🥇') || content.includes('🥈') || content.includes('🥉')) {
                    return <Box sx={{ my: 2, p: 2, bgcolor: 'rgba(251, 191, 36, 0.08)', borderRadius: 3, borderLeft: '6px solid #fbbf24' }}><Typography variant="h6" fontWeight="900" sx={{ color: '#fff', m: 0 }}>{children}</Typography></Box>;
                  }
                  if (content.includes('⚠️')) {
                    return <Box sx={{ my: 3, p: 3, bgcolor: 'rgba(239, 68, 68, 0.15)', borderRadius: 4, border: '2px solid rgba(239, 68, 68, 0.3)' }}><Typography variant="body1" fontWeight="800" sx={{ color: '#ef4444', m: 0 }}>{children}</Typography></Box>;
                  }
                  return <Typography variant="body1" sx={{ mb: 2, lineHeight: 2, fontSize: '1.1rem', color: isBTS ? 'grey.300' : 'text.primary' }}>{children}</Typography>;
                },
                strong: ({ children }) => <Box component="span" sx={{ fontWeight: 900, color: isBTS ? '#fff' : 'text.primary' }}>{children}</Box>,
                a: ({ href, children }) => <Box component="a" href={href} target="_blank" sx={{ color: 'error.main', textDecoration: 'none', fontWeight: 700 }}>{children}</Box>
              }}
            >
              {tournament.description || ''}
            </ReactMarkdown>
          </Paper>

          {/* Info Keys */}
          <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 6, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="900" sx={{ mb: 3 }}><CalendarMonth /> INFOS CLÉS</Typography>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={900} sx={{ display: 'block', mb: 1 }}>DATE & HEURE</Typography>
                <Typography variant="h6" fontWeight={900}>{formattedDate}</Typography>
                <Typography variant="subtitle2" color="error.main" fontWeight={900}>Check-in : {isBTS3 || isBTS2 ? '13h00' : '14h00'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={900} sx={{ display: 'block', mb: 1 }}>LIEU</Typography>
                <Typography variant="body1" fontWeight={800}>{tournament.location}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={900} sx={{ display: 'block', mb: 1 }}>FORMAT</Typography>
                <Typography variant="body1" fontWeight={800}>{tournament.format}</Typography>
                <Chip label={`Max ${tournament.maxPlayers} bladers`} size="small" sx={{ mt: 1, fontWeight: 900 }} />
              </Grid>
            </Grid>
          </Paper>

          {/* Tabs */}
          <Paper id="tournament-view" elevation={0} sx={{ borderRadius: 8, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth" sx={{ bgcolor: 'rgba(0,0,0,0.02)', '& .MuiTab-root': { fontWeight: 900 } }}>
              <Tab icon={<Trophy />} label="TABLEAU" />
              <Tab icon={<Leaderboard />} label="CLASSEMENT" />
              {stations.length > 0 && <Tab icon={<Sensors />} label="STADIUMS" />}
              <Tab icon={<History />} label="JOURNAL" />
            </Tabs>
            <Box sx={{ p: { xs: 2, md: 6 } }}>
              {activeTab === 0 && tournament.challongeUrl && <ChallongeBracket challongeUrl={tournament.challongeUrl} title={tournament.name} />}
              {activeTab === 1 && <StandingsPanel standings={standings} />}
              {activeTab === 2 && stations.length > 0 && <StadiumsPanel stations={stations} />}
              {activeTab === (stations.length > 0 ? 3 : 2) && <ActivityLogPanel log={activityLog} />}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────

function StandingsPanel({ standings }: { standings: Standing[] }) {
  return (
    <Stack spacing={1}>
      {standings.map((s) => (
        <Box key={s.rank} sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 2, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: s.rank <= 3 ? '#fbbf24' : 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{s.rank}</Box>
          <Typography variant="body1" fontWeight={800} sx={{ flex: 1 }}>{s.name}</Typography>
          <Typography variant="body2" fontWeight={900}>{s.stats?.wins ?? s.wins}W - {s.stats?.losses ?? s.losses}L</Typography>
          {s.challongeProfileUrl && <Button size="small" variant="outlined" href={s.challongeProfileUrl} target="_blank">Profil</Button>}
        </Box>
      ))}
    </Stack>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────

function StandingsPanel({ standings }: { standings: Standing[] }) {
  return (
    <Stack spacing={1}>
      {standings.map((s) => (
        <Box key={s.rank} sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 2, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: s.rank <= 3 ? '#fbbf24' : 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{s.rank}</Box>
          <Typography variant="body1" fontWeight={800} sx={{ flex: 1 }}>{s.name}</Typography>
          <Typography variant="body2" fontWeight={900}>{s.stats?.wins ?? s.wins}W - {s.stats?.losses ?? s.losses}L</Typography>
          {s.challongeProfileUrl && <Button size="small" variant="outlined" href={s.challongeProfileUrl} target="_blank">Profil</Button>}
        </Box>
      ))}
    </Stack>
  );
}

function StadiumsPanel({ stations }: { stations: Station[] }) {
  return (
    <Grid container spacing={3}>
      {stations.map((station) => (
        <Grid item key={station.stationId} xs={12} sm={6}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: station.status === 'active' ? 'error.main' : 'divider' }}>
            <Typography variant="subtitle1" fontWeight={900}>{station.name}</Typography>
            {station.currentMatch ? (
              <Typography variant="body2" sx={{ mt: 1 }}>{station.currentMatch.player1} vs {station.currentMatch.player2}</Typography>
            ) : <Typography variant="body2" color="text.disabled">Libre</Typography>}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

function ActivityLogPanel({ log }: { log: LogEntry[] }) {
  return (
    <Stack spacing={2}>
      {log.slice(0, 20).map((entry, i) => (
        <Box key={i} sx={{ p: 2, borderRadius: 3, bgcolor: 'action.hover', borderLeft: '4px solid', borderColor: 'divider' }}>
          <Typography variant="caption" fontWeight={900} sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase' }}>{entry.type}</Typography>
          <Typography variant="body2" fontWeight={600}>{entry.message}</Typography>
        </Box>
      ))}
    </Stack>
  );
}
