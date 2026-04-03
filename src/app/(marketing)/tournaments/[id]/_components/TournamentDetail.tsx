'use client';

import {
  FiberManualRecord,
  History,
  Info,
  Leaderboard,
  EmojiEvents as Trophy,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Chip,
  Divider,
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
  const { data: profileData } = useSWR(
    session ? '/api/profile' : null,
    fetcher,
  );

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
      // Silently fail
    }
  }, [tournament.id]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, [isLive, fetchLiveData]);

  const isBTS = tournament.name.toLowerCase().includes('bey-tamashii');
  const isBTS3 =
    tournament.name.includes('#3') || tournament.id === 'cm-bts3-auto-imported';
  const isBTS2 = tournament.name.includes('#2');
  const isBTS1 = tournament.name.includes('#1');

  const mapPosition: [number, number] = [48.85785, 2.34623];

  const standings = (liveData?.standings || []) as Standing[];
  const stations = (liveData?.stations || []) as Station[];
  const activityLog = (liveData?.activityLog || []) as LogEntry[];

  const posterUrl = isBTS3
    ? '/tournaments/BTS3_poster.gif'
    : isBTS2
      ? '/tournaments/BTS2_optimized.webp'
      : isBTS1
        ? '/tournaments/B_TS1.svg'
        : '/logo.png';

  return (
    <Box
      sx={{ width: '100%', py: { xs: 2, md: 4 }, px: { xs: 2, md: 4, lg: 6 } }}
    >
      {/* --- HEADER --- */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <TournamentStatusChip
            status={(tournament.status || '').toLowerCase() as TournamentStatus}
          />
          {isBTS && (
            <Chip
              label="OFFICIEL RPB"
              size="small"
              sx={{
                bgcolor: (t) => alpha(t.palette.secondary.main, 0.15),
                color: 'secondary.main',
                fontWeight: 900,
                fontSize: '0.65rem',
                letterSpacing: 1,
                border: (t) =>
                  `1px solid ${alpha(t.palette.secondary.main, 0.3)}`,
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
                bgcolor: 'primary.main',
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
            fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
            lineHeight: 1,
            mb: 2,
            textTransform: 'uppercase',
          }}
        >
          {tournament.name}
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 3, md: 5 }}>
        {/* SIDEBAR (Top on Mobile, Right on Desktop) */}
        <Grid size={{ xs: 12, lg: 4, xl: 3 }} sx={{ order: { xs: 1, lg: 2 } }}>
          <Stack
            spacing={3}
            sx={{ position: { lg: 'sticky' }, top: { lg: 100 } }}
          >
            {/* Main Poster */}
            <Box
              sx={{
                width: '100%',
                borderRadius: 6,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: isBTS ? 'rgba(255,255,255,0.1)' : 'divider',
                aspectRatio: '1040/1467',
                bgcolor: '#000',
                position: 'relative',
                boxShadow: isBTS ? '0 25px 50px rgba(0,0,0,0.5)' : 'none',
              }}
            >
              <Image
                src={posterUrl}
                alt={tournament.name}
                fill
                style={{ objectFit: 'cover' }}
                unoptimized={isBTS3}
                priority
              />
            </Box>

            {/* Practical Info Card & Registration */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 6,
                border: '1px solid',
                borderColor: isBTS
                  ? (t) => alpha(t.palette.primary.main, 0.4)
                  : 'divider',
                background: isBTS
                  ? 'linear-gradient(135deg, #1a0a0a 0%, #0a0a0a 100%)'
                  : 'background.paper',
              }}
            >
              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={900}
                    sx={{ display: 'block', mb: 0.5, letterSpacing: 1 }}
                  >
                    DATE & HEURE
                  </Typography>
                  <Typography variant="h6" fontWeight={900}>
                    {formattedDate}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color="error.main"
                    fontWeight={900}
                  >
                    Check-in : {isBTS3 || isBTS2 ? '13h00' : '14h00'}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={900}
                    sx={{ display: 'block', mb: 0.5, letterSpacing: 1 }}
                  >
                    LIEU
                  </Typography>
                  <Typography variant="body1" fontWeight={800}>
                    {tournament.location}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={900}
                    sx={{ display: 'block', mb: 0.5, letterSpacing: 1 }}
                  >
                    FORMAT
                  </Typography>
                  <Typography variant="body1" fontWeight={800}>
                    {tournament.format}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    fontWeight={700}
                  >
                    Capacité: {tournament.maxPlayers} joueurs
                  </Typography>
                </Box>

                <Divider sx={{ borderStyle: 'dashed' }} />

                {/* Registration Tools */}
                <Stack spacing={2}>
                  {session && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      {profileData?.challongeUsername ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            component="img"
                            src="https://challonge.com/favicon.ico"
                            sx={{ width: 16, height: 16 }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ color: 'success.main', fontWeight: 900 }}
                          >
                            LIÉ : {profileData.challongeUsername}
                          </Typography>
                        </Stack>
                      ) : (
                        <Button
                          fullWidth
                          size="small"
                          variant="outlined"
                          component={Link}
                          href={`/api/auth/challonge?returnTo=/tournaments/${tournament.id}`}
                          sx={{
                            color: 'secondary.main',
                            borderColor: 'secondary.main',
                            fontWeight: 900,
                            fontSize: '0.7rem',
                          }}
                        >
                          LIER MON COMPTE CHALLONGE
                        </Button>
                      )}
                    </Box>
                  )}
                  {tournament.challongeUrl && (
                    <Button
                      variant="contained"
                      fullWidth
                      href={tournament.challongeUrl}
                      target="_blank"
                      sx={{
                        py: 2,
                        fontWeight: 900,
                        bgcolor: 'primary.main',
                        fontSize: '1.1rem',
                      }}
                    >
                      S&apos;INSCRIRE MAINTENANT
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    fullWidth
                    href="https://discord.gg/rpb"
                    target="_blank"
                    sx={{
                      color: isBTS ? 'white' : 'text.primary',
                      borderColor: isBTS ? 'rgba(255,255,255,0.2)' : 'divider',
                    }}
                  >
                    REJOINDRE LE DISCORD
                  </Button>
                  <DownloadBracketButton
                    targetId="tournament-view"
                    fileName={tournament.id}
                  />
                </Stack>
              </Stack>
            </Paper>

            {/* Small Map */}
            <Paper
              elevation={0}
              sx={{
                height: 250,
                borderRadius: 6,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              <TournamentMap
                position={mapPosition}
                popupText={tournament.location || 'Lieu'}
              />
            </Paper>
          </Stack>
        </Grid>

        {/* MAIN CONTENT AREA */}
        <Grid size={{ xs: 12, lg: 8, xl: 9 }} sx={{ order: { xs: 2, lg: 1 } }}>
          {/* Live Stadiums */}
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
              <Typography
                variant="h5"
                fontWeight="900"
                sx={{ mb: 4, letterSpacing: 1 }}
              >
                STADIUMS EN DIRECT
              </Typography>
              <Grid container spacing={3}>
                {stations
                  .filter((s) => s.status === 'active')
                  .map((station) => (
                    <Grid
                      key={station.stationId}
                      size={{ xs: 12, sm: 6, xl: 4 }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          borderRadius: 4,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight="900"
                          color="primary"
                          sx={{
                            display: 'block',
                            mb: 2,
                            textTransform: 'uppercase',
                          }}
                        >
                          {station.name}
                        </Typography>
                        {station.currentMatch ? (
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography
                              variant="body2"
                              fontWeight="900"
                              noWrap
                              sx={{ maxWidth: '40%' }}
                            >
                              {station.currentMatch.player1}
                            </Typography>
                            <Typography
                              variant="caption"
                              fontWeight="900"
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                bgcolor: 'error.main',
                                color: 'white',
                                borderRadius: 1,
                              }}
                            >
                              {station.currentMatch.scores || 'VS'}
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight="900"
                              noWrap
                              sx={{ maxWidth: '40%' }}
                              textAlign="right"
                            >
                              {station.currentMatch.player2}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            Disponible pour combat
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
              </Grid>
            </Paper>
          )}

          {/* About Section */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 6 },
              mb: 4,
              borderRadius: 6,
              border: '1px solid',
              borderColor: isBTS
                ? (t) => alpha(t.palette.secondary.main, 0.2)
                : 'divider',
              background: isBTS
                ? 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, transparent 100%)'
                : 'background.paper',
            }}
          >
            <Typography
              variant="h5"
              fontWeight="900"
              sx={{
                mb: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                color: isBTS ? 'secondary.main' : 'primary.main',
                letterSpacing: 1,
              }}
            >
              <Info /> À PROPOS DU TOURNOI
            </Typography>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => {
                  const content = String(children);
                  if (
                    content.includes('🥇') ||
                    content.includes('🥈') ||
                    content.includes('🥉')
                  ) {
                    return (
                      <Box
                        sx={{
                          my: 2,
                          p: 2.5,
                          bgcolor: (t) => alpha(t.palette.secondary.main, 0.08),
                          borderRadius: 3,
                          borderLeft: (t) =>
                            `6px solid ${t.palette.secondary.main}`,
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight="900"
                          sx={{ color: '#fff', m: 0 }}
                        >
                          {children}
                        </Typography>
                      </Box>
                    );
                  }
                  if (content.includes('⚠️')) {
                    return (
                      <Box
                        sx={{
                          my: 3,
                          p: 3,
                          bgcolor: (t) => alpha(t.palette.primary.main, 0.15),
                          borderRadius: 4,
                          border: (t) =>
                            `2px solid ${alpha(t.palette.primary.main, 0.3)}`,
                        }}
                      >
                        <Typography
                          variant="body1"
                          fontWeight="800"
                          sx={{ color: 'primary.main', m: 0, lineHeight: 1.6 }}
                        >
                          {children}
                        </Typography>
                      </Box>
                    );
                  }
                  return (
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        lineHeight: 2,
                        fontSize: '1.15rem',
                        color: isBTS ? 'grey.300' : 'text.primary',
                        fontWeight: 500,
                      }}
                    >
                      {children}
                    </Typography>
                  );
                },
                strong: ({ children }) => (
                  <Box
                    component="span"
                    sx={{
                      fontWeight: 900,
                      color: isBTS ? '#fff' : 'text.primary',
                    }}
                  >
                    {children}
                  </Box>
                ),
                a: ({ href, children }) => (
                  <Box
                    component="a"
                    href={href}
                    target="_blank"
                    sx={{
                      color: 'error.main',
                      textDecoration: 'none',
                      fontWeight: 700,
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {children}
                  </Box>
                ),
              }}
            >
              {tournament.description || ''}
            </ReactMarkdown>
          </Paper>

          {/* Bracket / Results Tabs */}
          <Paper
            id="tournament-view"
            elevation={0}
            sx={{
              borderRadius: 8,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="fullWidth"
              sx={{
                bgcolor: 'rgba(0,0,0,0.03)',
                borderBottom: '1px solid',
                borderColor: 'divider',
                '& .MuiTab-root': {
                  fontWeight: 900,
                  minHeight: 70,
                  fontSize: '1rem',
                },
              }}
            >
              <Tab
                icon={<Trophy sx={{ fontSize: 20 }} />}
                iconPosition="start"
                label="TABLEAU"
              />
              <Tab
                icon={<Leaderboard sx={{ fontSize: 20 }} />}
                iconPosition="start"
                label="CLASSEMENT"
              />
              <Tab
                icon={<History sx={{ fontSize: 20 }} />}
                iconPosition="start"
                label="JOURNAL"
              />
            </Tabs>
            <Box sx={{ p: { xs: 2, md: 6 } }}>
              {activeTab === 0 && tournament.challongeUrl && (
                <ChallongeBracket
                  challongeUrl={tournament.challongeUrl}
                  title={tournament.name}
                />
              )}
              {activeTab === 1 && <StandingsPanel standings={standings} />}
              {activeTab === 2 && <ActivityLogPanel log={activityLog} />}
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
    <Stack spacing={1.5}>
      {standings.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ py: 4 }}
        >
          Classement non disponible pour le moment.
        </Typography>
      )}
      {standings.map((s) => {
        const isTop3 = s.rank <= 3;
        const color =
          s.rank === 1
            ? '#fbbf24'
            : s.rank === 2
              ? '#94a3b8'
              : s.rank === 3
                ? '#d97706'
                : 'transparent';
        return (
          <Box
            key={s.rank}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              p: 2.5,
              borderRadius: 4,
              border: '1px solid',
              borderColor: isTop3 ? alpha(color, 0.3) : 'divider',
              bgcolor: isTop3 ? alpha(color, 0.03) : 'transparent',
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: isTop3 ? color : 'action.selected',
                color: s.rank === 1 ? 'black' : 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.1rem',
              }}
            >
              {s.rank}
            </Box>
            <Typography variant="h6" fontWeight={900} sx={{ flex: 1 }}>
              {s.name}
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight={900}
              color="success.main"
            >
              {s.stats?.wins ?? s.wins}W{' '}
              <Box component="span" sx={{ color: 'text.disabled', mx: 0.5 }}>
                -
              </Box>{' '}
              <Box component="span" sx={{ color: 'error.main' }}>
                {s.stats?.losses ?? s.losses}L
              </Box>
            </Typography>
            {s.challongeProfileUrl && (
              <Button
                size="small"
                variant="outlined"
                href={s.challongeProfileUrl}
                target="_blank"
                sx={{ borderRadius: 2, fontWeight: 800 }}
              >
                Profil
              </Button>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}

function ActivityLogPanel({ log }: { log: LogEntry[] }) {
  const theme = useTheme();
  return (
    <Stack spacing={2}>
      {log.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ py: 4 }}
        >
          Aucune activité récente.
        </Typography>
      )}
      {log.slice(0, 30).map((entry, i) => (
        <Box
          key={i}
          sx={{
            p: 2.5,
            borderRadius: 4,
            bgcolor: alpha(theme.palette.action.hover, 0.4),
            borderLeft: '4px solid',
            borderColor: entry.type?.includes('match')
              ? 'primary.main'
              : 'divider',
          }}
        >
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography
              variant="caption"
              fontWeight={900}
              sx={{
                textTransform: 'uppercase',
                color: 'primary.main',
                letterSpacing: 1,
              }}
            >
              {entry.type}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
            >
              {new Date(entry.timestamp).toLocaleTimeString('fr-FR')}
            </Typography>
          </Stack>
          <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.5 }}>
            {entry.message}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
