/**
 * RPB - Stats Card Component
 * Displays key statistics in a grid
 */

'use client';

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import type { UserStats } from '@/lib/stats';

interface StatsCardProps {
  stats: UserStats;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}

function StatItem({
  icon,
  label,
  value,
  subValue,
  color = 'primary.main',
}: StatItemProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'action.hover',
          color,
          display: 'flex',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {subValue && (
          <Typography variant="caption" color="text.secondary">
            {subValue}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export function UserProfileStatsCard({ stats }: StatsCardProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Statistiques
        </Typography>

        <Grid container spacing={3}>
          {/* Win/Loss */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <StatItem
              icon={<SportsMmaIcon />}
              label="Matchs"
              value={`${stats.wins}V - ${stats.losses}D`}
              subValue={`${stats.totalMatches} matchs joués`}
              color="primary.main"
            />
          </Grid>

          {/* Win Rate */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Taux de victoire
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stats.winRate.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats.winRate}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'error.light',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'success.main',
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Tournaments */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <StatItem
              icon={<EmojiEventsIcon />}
              label="Tournois"
              value={stats.tournamentsWon}
              subValue={`${stats.tournamentsPlayed} participations`}
              color="warning.main"
            />
          </Grid>

          {/* ELO / Rank */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <StatItem
              icon={<TrendingUpIcon />}
              label="Classement"
              value={`#${stats.rank}`}
              subValue={`${stats.elo} ELO`}
              color="info.main"
            />
          </Grid>

          {/* Current Streak */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <StatItem
              icon={<WhatshotIcon />}
              label="Série actuelle"
              value={stats.currentStreak}
              subValue={`Record: ${stats.bestStreak}`}
              color={
                stats.currentStreak > 0 ? 'success.main' : 'text.secondary'
              }
            />
          </Grid>

          {/* Recent Form */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Forme récente
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {stats.recentForm.length > 0 ? (
                  stats.recentForm.map((result, i) => (
                    <Box
                      key={`${i}-${result}`}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        bgcolor: result === 'W' ? 'success.main' : 'error.main',
                        color: 'white',
                      }}
                    >
                      {result}
                    </Box>
                  ))
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Aucun match récent
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
