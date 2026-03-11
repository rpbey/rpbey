'use client';

import CloseIcon from '@mui/icons-material/Close';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import {
  Avatar,
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Slide,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import React, { forwardRef } from 'react';
import type { ProfileWithUser } from './RankingsTable';

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface BladerComparatorProps {
  selectedBladers: ProfileWithUser[];
  onRemove: (id: string) => void;
  onClear: () => void;
  currentPage: number;
  allProfiles: ProfileWithUser[];
}

function CompareRadar({
  bladerA,
  bladerB,
}: {
  bladerA: ProfileWithUser;
  bladerB: ProfileWithUser;
}) {
  const totalA = bladerA.wins + bladerA.losses;
  const totalB = bladerB.wins + bladerB.losses;
  const maxPoints = Math.max(bladerA.rankingPoints, bladerB.rankingPoints, 1);
  const maxWins = Math.max(bladerA.wins, bladerB.wins, 1);
  const maxMatches = Math.max(totalA, totalB, 1);
  const maxTW = Math.max(bladerA.tournamentWins, bladerB.tournamentWins, 1);

  const stats = [
    { label: 'Points', key: 'points' },
    { label: 'Victoires', key: 'wins' },
    { label: 'Matchs', key: 'matches' },
    { label: 'Win Rate', key: 'winrate' },
    { label: 'Tournois gagnés', key: 'tw' },
  ];

  const getValues = (profile: ProfileWithUser) => {
    const total = profile.wins + profile.losses;
    const wr = total > 0 ? (profile.wins / total) * 100 : 0;
    return {
      points: {
        value: profile.rankingPoints,
        normalized: (profile.rankingPoints / maxPoints) * 100,
      },
      wins: { value: profile.wins, normalized: (profile.wins / maxWins) * 100 },
      matches: { value: total, normalized: (total / maxMatches) * 100 },
      winrate: { value: wr, normalized: wr },
      tw: {
        value: profile.tournamentWins,
        normalized: (profile.tournamentWins / maxTW) * 100,
      },
    };
  };

  const valuesA = getValues(bladerA);
  const valuesB = getValues(bladerB);

  const colorA = '#dc2626';
  const colorB = '#3b82f6';

  return (
    <Stack spacing={2}>
      {stats.map((stat) => {
        const a = valuesA[stat.key as keyof typeof valuesA];
        const b = valuesB[stat.key as keyof typeof valuesB];
        const aWins = a.value > b.value;
        const bWins = b.value > a.value;
        const formatValue = (v: number) =>
          stat.key === 'winrate' ? `${v.toFixed(1)}%` : v.toString();

        return (
          <Box key={stat.key}>
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{
                opacity: 0.6,
                textTransform: 'uppercase',
                letterSpacing: 1,
                mb: 0.5,
                display: 'block',
              }}
            >
              {stat.label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                fontWeight={aWins ? 900 : 500}
                sx={{
                  minWidth: 50,
                  textAlign: 'right',
                  color: aWins ? colorA : 'text.secondary',
                }}
              >
                {formatValue(a.value)}
              </Typography>
              <Box sx={{ flex: 1, display: 'flex', gap: 0.5 }}>
                <Box sx={{ flex: 1, transform: 'scaleX(-1)' }}>
                  <LinearProgress
                    variant="determinate"
                    value={a.normalized}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(colorA, 0.1),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: colorA,
                        borderRadius: 4,
                        transition:
                          'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      },
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={b.normalized}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: alpha(colorB, 0.1),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: colorB,
                        borderRadius: 4,
                        transition:
                          'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      },
                    }}
                  />
                </Box>
              </Box>
              <Typography
                variant="body2"
                fontWeight={bWins ? 900 : 500}
                sx={{
                  minWidth: 50,
                  color: bWins ? colorB : 'text.secondary',
                }}
              >
                {formatValue(b.value)}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

export default function BladerComparator({
  selectedBladers,
  onRemove,
  onClear,
  currentPage,
  allProfiles,
}: BladerComparatorProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const canCompare = selectedBladers.length === 2;

  const getRank = (profile: ProfileWithUser) => {
    const index = allProfiles.findIndex((p) => p.id === profile.id);
    return index >= 0 ? (currentPage - 1) * 100 + index + 1 : '?';
  };

  if (selectedBladers.length === 0) return null;

  return (
    <>
      {/* Floating comparison bar */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            bottom: isMobile ? 70 : 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1300,
            width: isMobile ? 'calc(100% - 32px)' : 'auto',
            maxWidth: 600,
          }}
        >
          <Box
            sx={{
              bgcolor: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(20px)',
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.3),
              borderRadius: 3,
              px: 2,
              py: 1.5,
              boxShadow: `0 8px 32px ${alpha('#000', 0.4)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <CompareArrowsIcon
              sx={{ color: 'primary.main', fontSize: '1.3rem' }}
            />

            <Stack
              direction="row"
              spacing={1}
              sx={{ flex: 1, overflow: 'hidden' }}
            >
              {selectedBladers.map((blader) => (
                <Chip
                  key={blader.id}
                  label={blader.bladerName || blader.user?.name || 'Blader'}
                  avatar={
                    <Avatar
                      src={blader.user?.image || undefined}
                      sx={{ width: 24, height: 24 }}
                    />
                  }
                  onDelete={() => onRemove(blader.id)}
                  deleteIcon={<RemoveCircleOutlineIcon />}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    maxWidth: 180,
                  }}
                />
              ))}
              {selectedBladers.length === 1 && (
                <Chip
                  icon={<PersonIcon />}
                  label="Choisir un 2e blader"
                  size="small"
                  variant="outlined"
                  sx={{ opacity: 0.5, borderStyle: 'dashed' }}
                />
              )}
            </Stack>

            <Button
              variant="contained"
              size="small"
              disabled={!canCompare}
              onClick={() => setDialogOpen(true)}
              startIcon={<CompareArrowsIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                px: 2,
              }}
            >
              Comparer
            </Button>

            <IconButton size="small" onClick={onClear} sx={{ opacity: 0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </motion.div>
      </AnimatePresence>

      {/* Comparison Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
            backgroundImage: 'none',
            borderRadius: isMobile ? 0 : 4,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareArrowsIcon color="primary" />
            <Typography variant="h6" fontWeight={900}>
              Comparaison
            </Typography>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {canCompare && (
            <Box>
              {/* Header with both bladers */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  mb: 3,
                  gap: 2,
                }}
              >
                {selectedBladers.map((blader, idx) => (
                  <Box key={blader.id} sx={{ textAlign: 'center', flex: 1 }}>
                    <Link
                      href={blader.userId ? `/profile/${blader.userId}` : '#'}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Avatar
                        src={blader.user?.image || undefined}
                        sx={{
                          width: { xs: 56, sm: 72 },
                          height: { xs: 56, sm: 72 },
                          mx: 'auto',
                          mb: 1,
                          border: '3px solid',
                          borderColor: idx === 0 ? '#dc2626' : '#3b82f6',
                          boxShadow: `0 0 20px ${alpha(idx === 0 ? '#dc2626' : '#3b82f6', 0.3)}`,
                        }}
                      />
                      <Typography variant="subtitle1" fontWeight={900} noWrap>
                        {blader.bladerName || blader.user?.name || 'Blader'}
                      </Typography>
                    </Link>
                    <Chip
                      icon={
                        <EmojiEventsIcon
                          sx={{ fontSize: '0.9rem !important' }}
                        />
                      }
                      label={`Rang #${getRank(blader)}`}
                      size="small"
                      sx={{
                        mt: 0.5,
                        bgcolor: alpha(idx === 0 ? '#dc2626' : '#3b82f6', 0.1),
                        color: idx === 0 ? '#dc2626' : '#3b82f6',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    />
                  </Box>
                ))}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Stats comparison */}
              <CompareRadar
                bladerA={selectedBladers[0]!}
                bladerB={selectedBladers[1]!}
              />

              {/* Summary */}
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.1),
                  textAlign: 'center',
                }}
              >
                {(() => {
                  const a = selectedBladers[0]!;
                  const b = selectedBladers[1]!;
                  let scoreA = 0;
                  let scoreB = 0;
                  if (a.rankingPoints > b.rankingPoints) scoreA++;
                  else if (b.rankingPoints > a.rankingPoints) scoreB++;
                  if (a.wins > b.wins) scoreA++;
                  else if (b.wins > a.wins) scoreB++;
                  const totalA = a.wins + a.losses;
                  const totalB = b.wins + b.losses;
                  const wrA = totalA > 0 ? a.wins / totalA : 0;
                  const wrB = totalB > 0 ? b.wins / totalB : 0;
                  if (wrA > wrB) scoreA++;
                  else if (wrB > wrA) scoreB++;
                  if (a.tournamentWins > b.tournamentWins) scoreA++;
                  else if (b.tournamentWins > a.tournamentWins) scoreB++;

                  const nameA = a.bladerName || a.user?.name || 'Blader A';
                  const nameB = b.bladerName || b.user?.name || 'Blader B';

                  if (scoreA > scoreB) {
                    return (
                      <Typography variant="body2" fontWeight={700}>
                        <span style={{ color: '#dc2626' }}>{nameA}</span> domine
                        dans {scoreA} catégorie{scoreA > 1 ? 's' : ''} sur 4
                      </Typography>
                    );
                  }
                  if (scoreB > scoreA) {
                    return (
                      <Typography variant="body2" fontWeight={700}>
                        <span style={{ color: '#3b82f6' }}>{nameB}</span> domine
                        dans {scoreB} catégorie{scoreB > 1 ? 's' : ''} sur 4
                      </Typography>
                    );
                  }
                  return (
                    <Typography variant="body2" fontWeight={700}>
                      Egalité parfaite entre les deux bladers !
                    </Typography>
                  );
                })()}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
