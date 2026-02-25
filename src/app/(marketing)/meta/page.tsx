import { Alert, Box, Container, Typography } from '@mui/material';
import type { Metadata } from 'next';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { prisma } from '@/lib/prisma';

import { MetaClient } from './_components/MetaClient';
import type { BbxWeeklyData, PartStats } from './_components/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Meta Beyblade X | RPB',
  description:
    'Rankings des pièces Beyblade X basés sur les résultats de tournois WBO. Scores de puissance et synergies par catégorie.',
  openGraph: {
    title: 'Meta Beyblade X | RPB',
    description:
      'Rankings des pièces Beyblade X basés sur les résultats de tournois WBO.',
  },
};

async function getData(): Promise<BbxWeeklyData | null> {
  try {
    const filePath = join(process.cwd(), 'data', 'bbx-weekly.json');
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw) as BbxWeeklyData;
  } catch {
    return null;
  }
}

async function getPartStatsMap(): Promise<Map<string, PartStats>> {
  try {
    const parts = await prisma.part.findMany({
      select: { name: true, attack: true, defense: true, stamina: true, burst: true, dash: true },
    });
    const map = new Map<string, PartStats>();
    for (const p of parts) {
      const stats: PartStats = {
        attack: Number(p.attack) || 0,
        defense: Number(p.defense) || 0,
        stamina: Number(p.stamina) || 0,
        dash: Number(p.dash) || 0,
        burst: Number(p.burst) || 0,
      };
      if (stats.attack + stats.defense + stats.stamina + stats.dash + stats.burst > 0) {
        map.set(p.name.toLowerCase(), stats);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function enrichWithStats(data: BbxWeeklyData, statsMap: Map<string, PartStats>): BbxWeeklyData {
  for (const periodKey of ['2weeks', '4weeks'] as const) {
    for (const category of data.periods[periodKey].categories) {
      for (const comp of category.components) {
        const stats = statsMap.get(comp.name.toLowerCase());
        if (stats) {
          comp.stats = stats;
        }
      }
    }
  }
  return data;
}

export default async function MetaPage() {
  const [data, statsMap] = await Promise.all([getData(), getPartStatsMap()]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.08) 0%, transparent 60%)',
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {!data ||
        (data.periods['2weeks'].categories.length === 0 &&
          data.periods['4weeks'].categories.length === 0) ? (
          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight={900} gutterBottom>
              Meta Beyblade X
            </Typography>
            <Alert severity="info" sx={{ maxWidth: 500, mx: 'auto', mt: 3 }}>
              Les données meta ne sont pas encore disponibles. Elles seront
              mises à jour automatiquement chaque vendredi.
            </Alert>
          </Box>
        ) : (
          <MetaClient data={enrichWithStats(data, statsMap)} />
        )}
      </Container>
    </Box>
  );
}
