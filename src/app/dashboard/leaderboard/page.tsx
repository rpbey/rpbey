/**
 * RPB - Leaderboard Page
 * Global rankings with ELO and win rates
 */

'use client';

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import useSWR from 'swr';
import type { LeaderboardEntry } from '@/lib/stats';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getRankIcon(rank: number) {
  if (rank === 1)
    return <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: 24 }} />;
  if (rank === 2)
    return <EmojiEventsIcon sx={{ color: '#C0C0C0', fontSize: 24 }} />;
  if (rank === 3)
    return <EmojiEventsIcon sx={{ color: '#CD7F32', fontSize: 24 }} />;
  return null;
}

function getRankBgColor(rank: number) {
  if (rank === 1) return 'rgba(255, 215, 0, 0.1)';
  if (rank === 2) return 'rgba(192, 192, 192, 0.1)';
  if (rank === 3) return 'rgba(205, 127, 50, 0.1)';
  return 'transparent';
}

export default function LeaderboardPage() {
  const { data, isLoading } = useSWR<{ data: LeaderboardEntry[] }>(
    '/api/stats?type=leaderboard&limit=100',
    fetcher,
  );

  const leaderboard = data?.data ?? [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Classement
        </Typography>
        <Typography color="text.secondary">
          Classement global des bladers basé sur le système ELO
        </Typography>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={80}>Rang</TableCell>
                <TableCell>Blader</TableCell>
                <TableCell align="right">ELO</TableCell>
                <TableCell
                  align="right"
                  sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                >
                  V/D
                </TableCell>
                <TableCell align="right">Winrate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton width={30} />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton width={120} />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Skeleton width={60} />
                    </TableCell>
                    <TableCell
                      sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                    >
                      <Skeleton width={60} />
                    </TableCell>
                    <TableCell>
                      <Skeleton width={60} />
                    </TableCell>
                  </TableRow>
                ))
              ) : leaderboard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      Aucun blader classé pour le moment
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                leaderboard.map((entry) => (
                  <TableRow
                    key={entry.userId}
                    sx={{
                      bgcolor: getRankBgColor(entry.rank),
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {getRankIcon(entry.rank)}
                        <Typography
                          fontWeight={entry.rank <= 3 ? 'bold' : 'normal'}
                          color={entry.rank <= 3 ? 'primary' : 'inherit'}
                        >
                          #{entry.rank}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/profile/${entry.userId}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                          <Avatar sx={{ width: 40, height: 40 }}>
                            {entry.bladerName[0]}
                          </Avatar>
                          <Typography fontWeight="medium">
                            {entry.bladerName}
                          </Typography>
                        </Box>
                      </Link>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={entry.elo}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                    >
                      <Typography>
                        <Box
                          component="span"
                          sx={{ color: 'success.main', fontWeight: 'bold' }}
                        >
                          {entry.wins}
                        </Box>
                        {' / '}
                        <Box
                          component="span"
                          sx={{ color: 'error.main', fontWeight: 'bold' }}
                        >
                          {entry.losses}
                        </Box>
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${entry.winRate.toFixed(1)}%`}
                        size="small"
                        color={entry.winRate >= 50 ? 'success' : 'error'}
                        variant="filled"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Container>
  );
}
