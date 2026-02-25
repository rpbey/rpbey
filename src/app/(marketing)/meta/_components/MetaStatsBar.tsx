'use client';

import { Box, Grid, Typography } from '@mui/material';

import type { PeriodMetadata } from './types';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        bgcolor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 2,
        px: { xs: 1.5, md: 2 },
        py: { xs: 1, md: 1.5 },
        textAlign: 'center',
        minWidth: 0,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontWeight: 800,
          letterSpacing: 0.5,
          fontSize: { xs: '0.55rem', md: '0.65rem' },
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={700}
        noWrap
        sx={{ mt: 0.25, fontSize: { xs: '0.75rem', md: '0.875rem' } }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export function MetaStatsBar({
  metadata,
  scrapedAt,
}: {
  metadata: PeriodMetadata;
  scrapedAt: string;
}) {
  const formatDate = (dateStr: string, short = false) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: short ? 'short' : 'short',
        year: short ? undefined : 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const period =
    metadata.startDate && metadata.endDate
      ? `${formatDate(metadata.startDate, true)} — ${formatDate(metadata.endDate, true)}`
      : '—';

  return (
    <Grid container spacing={{ xs: 1, md: 1.5 }} sx={{ mt: { xs: 1, md: 2 } }}>
      {metadata.weekId && (
        <Grid size={{ xs: 4, sm: 4, md: 2.4 }}>
          <StatCard label="SEMAINE" value={metadata.weekId} />
        </Grid>
      )}
      <Grid size={{ xs: 8, sm: 4, md: 2.4 }}>
        <StatCard label="PERIODE" value={period} />
      </Grid>
      {metadata.eventsScanned > 0 && (
        <Grid size={{ xs: 4, sm: 4, md: 2.4 }}>
          <StatCard
            label="TOURNOIS"
            value={metadata.eventsScanned.toString()}
          />
        </Grid>
      )}
      {metadata.partsAnalyzed > 0 && (
        <Grid size={{ xs: 4, sm: 4, md: 2.4 }}>
          <StatCard
            label="COMBOS"
            value={metadata.partsAnalyzed.toLocaleString('fr-FR')}
          />
        </Grid>
      )}
      <Grid size={{ xs: 4, sm: 4, md: 2.4 }}>
        <StatCard label="MAJ" value={formatDate(scrapedAt, true)} />
      </Grid>
    </Grid>
  );
}
