'use client';

import {
  EmojiEvents as Trophy,
  FiberManualRecord,
  History,
  Sensors,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Card,
  Chip,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TournamentLiveCarouselProps {
  tournament: {
    id: string;
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    standings: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stations: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activityLog: any;
  };
}

const VARIANTS = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

export function TournamentLiveCarousel({
  tournament,
}: TournamentLiveCarouselProps) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Parse data
  const stations = (tournament.stations ?? []) as Array<{
    stationId: number;
    name: string;
    status: string;
    currentMatch?: {
      player1: string;
      player2: string;
      scores: string;
      round: number;
    };
  }>;

  const standings = (tournament.standings ?? []) as Array<{
    rank: number;
    name: string;
    wins: number;
    losses: number;
  }>;

  const logs = (tournament.activityLog ?? []) as Array<{
    timestamp: string;
    message: string;
    type: string;
  }>;

  // Determine available slides
  const slides: Array<'stadiums' | 'standings' | 'logs'> = [];
  if (stations.length > 0) slides.push('stadiums');
  if (standings.length > 0) slides.push('standings');
  if (logs.length > 0) slides.push('logs');

  // Auto-rotate
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % slides.length);
    }, 8000); // 8 seconds per slide
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const activeSlide = slides[index];

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: 400, // Fixed height for carousel
        perspective: 1000,
      }}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={index}
          custom={direction}
          variants={VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              borderRadius: '32px',
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(20px)',
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.2),
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 2.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    p: 0.8,
                    borderRadius: '50%',
                    bgcolor: 'background.paper',
                    color: 'primary.main',
                    boxShadow: 1,
                  }}
                >
                  {activeSlide === 'stadiums' && <Sensors fontSize="small" />}
                  {activeSlide === 'standings' && <Trophy fontSize="small" />}
                  {activeSlide === 'logs' && <History fontSize="small" />}
                </Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  {activeSlide === 'stadiums' && 'En Direct : Stadiums'}
                  {activeSlide === 'standings' && 'Top Classement'}
                  {activeSlide === 'logs' && 'Dernières Activités'}
                </Typography>
              </Stack>

              <Chip
                icon={<FiberManualRecord sx={{ fontSize: 10 }} />}
                label="LIVE"
                size="small"
                color="error"
                sx={{
                  fontWeight: 900,
                  animation: 'pulse 2s infinite',
                  height: 24,
                }}
              />
            </Box>

            {/* Content */}
            <Box sx={{ p: 3, flex: 1, overflow: 'hidden', position: 'relative' }}>
              {activeSlide === 'stadiums' && (
                <Stack spacing={2}>
                  {stations.slice(0, 3).map((s) => (
                    <Box
                      key={s.stationId}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        border: '1px solid',
                        borderColor:
                          s.status === 'active'
                            ? 'success.light'
                            : 'divider',
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 1 }}
                      >
                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                          {s.name}
                        </Typography>
                        {s.currentMatch && (
                          <Chip
                            label={`Round ${s.currentMatch.round}`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                        )}
                      </Stack>
                      {s.currentMatch ? (
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="body2" fontWeight={800} noWrap sx={{ maxWidth: '40%' }}>
                            {s.currentMatch.player1}
                          </Typography>
                          <Chip
                            label={s.currentMatch.scores}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 900, minWidth: 40 }}
                          />
                          <Typography variant="body2" fontWeight={800} noWrap sx={{ maxWidth: '40%' }} textAlign="right">
                            {s.currentMatch.player2}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                          En attente de match...
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}

              {activeSlide === 'standings' && (
                <Stack spacing={1}>
                  {standings.slice(0, 5).map((s, i) => (
                    <Stack
                      key={s.rank}
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: i === 0 ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                      }}
                    >
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: i === 0 ? 'primary.main' : 'action.selected',
                          color: i === 0 ? 'white' : 'text.primary',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '0.8rem',
                        }}
                      >
                        {s.rank}
                      </Box>
                      <Typography variant="body2" fontWeight={700} sx={{ flex: 1 }}>
                        {s.name}
                      </Typography>
                      <Typography variant="caption" fontWeight={700} color="text.secondary">
                        {s.wins}W - {s.losses}L
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}

              {activeSlide === 'logs' && (
                <Stack spacing={0} sx={{ height: '100%', overflow: 'hidden' }}>
                   {logs.slice(0, 6).map((log, i) => (
                      <Box
                        key={i}
                        sx={{
                           py: 1.5,
                           borderBottom: i < 5 ? '1px dashed' : 'none',
                           borderColor: 'divider'
                        }}
                      >
                         <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 50, pt: 0.3 }}>
                               {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.3 }}>
                               {log.message}
                            </Typography>
                         </Stack>
                      </Box>
                   ))}
                </Stack>
              )}
            </Box>

            {/* Pagination Dots */}
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
              {slides.map((_, i) => (
                <Box
                  key={i}
                  component={motion.div}
                  onClick={() => setIndex(i)}
                  animate={{
                    width: i === index ? 24 : 8,
                    backgroundColor: i === index ? theme.palette.primary.main : theme.palette.action.disabled,
                  }}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Box>
          </Card>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}
