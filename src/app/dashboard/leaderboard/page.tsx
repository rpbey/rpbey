/**
 * RPB - Leaderboard Page
 * Global rankings with DataGrid
 */

'use client';

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useSession } from '@/lib/auth-client';
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

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [scrolled, setScrolled] = useState(false);

  // Fetch top 500 to ensure most active users are visible
  const { data, isLoading } = useSWR<{ data: LeaderboardEntry[] }>(
    '/api/stats?type=leaderboard&limit=500',
    fetcher,
  );

  const leaderboard = data?.data ?? [];

  // Auto-scroll to user row when data is loaded
  useEffect(() => {
    if (!isLoading && userId && leaderboard.length > 0 && !scrolled) {
      // Small delay to ensure DataGrid rendered rows
      const timer = setTimeout(() => {
        const userRow = document.querySelector(
          `div[data-id="${userId}"]`,
        );
        if (userRow) {
          userRow.scrollIntoView({
            block: 'center',
            behavior: 'smooth',
          });
          setScrolled(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, userId, leaderboard, scrolled]);

  const columns: GridColDef<LeaderboardEntry>[] = [
    {
      field: 'rank',
      headerName: 'Rang',
      width: 100,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params: GridRenderCellParams<LeaderboardEntry, number>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getRankIcon(params.value ?? 0)}
          <Typography
            fontWeight={(params.value ?? 0) <= 3 ? 'bold' : 'normal'}
            color={(params.value ?? 0) <= 3 ? 'primary' : 'inherit'}
          >
            #{params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'bladerName',
      headerName: 'Blader',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<LeaderboardEntry, string>) => (
        <Link
          href={`/dashboard/profile/${params.row.userId}`}
          style={{
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 32, height: 32 }}>
              {params.value?.[0]}
            </Avatar>
            <Typography fontWeight="medium">{params.value}</Typography>
          </Box>
        </Link>
      ),
    },
    {
      field: 'points',
      headerName: 'Points',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<LeaderboardEntry, number>) => (
        <Chip
          label={(params.value ?? 0).toLocaleString()}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 'bold' }}
        />
      ),
    },
    {
      field: 'tournamentsPlayed',
      headerName: 'Participations',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<LeaderboardEntry, number>) => (
        <Typography variant="body2" fontWeight="bold">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'tournamentWins',
      headerName: 'Victoires',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<LeaderboardEntry, number>) =>
        (params.value ?? 0) > 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🏆</span>
            <Typography fontWeight="bold">{params.value}</Typography>
          </Box>
        ) : (
          <Typography color="text.secondary">-</Typography>
        ),
    },
    {
      field: 'matches',
      headerName: 'Matchs (V/D)',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (_: any, row: LeaderboardEntry) =>
        `${row.wins} / ${row.losses}`,
      renderCell: (params: GridRenderCellParams<LeaderboardEntry, string>) => {
        const [wins, losses] = (params.value ?? '0 / 0').split(' / ');
        return (
          <Typography variant="body2">
            <Box
              component="span"
              sx={{ color: 'success.main', fontWeight: 'bold' }}
            >
              {wins}
            </Box>
            {' / '}
            <Box
              component="span"
              sx={{ color: 'error.main', fontWeight: 'bold' }}
            >
              {losses}
            </Box>
          </Typography>
        );
      },
    },
    {
      field: 'winRate',
      headerName: 'Winrate',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<LeaderboardEntry, number>) => (
        <Chip
          label={`${(params.value ?? 0).toFixed(1)}%`}
          size="small"
          color={(params.value ?? 0) >= 50 ? 'success' : 'error'}
          variant="filled"
        />
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Classement
        </Typography>
        <Typography color="text.secondary">
          Classement officiel RPB basé sur les points de tournoi
        </Typography>
      </Box>

      <Card sx={{ height: 800, width: '100%' }}>
        <DataGrid
          rows={leaderboard}
          columns={columns}
          getRowId={(row) => row.userId}
          loading={isLoading}
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          disableRowSelectionOnClick
          rowSelectionModel={{
            type: 'include',
            ids: new Set(userId ? [userId] : []),
          }}
          initialState={{
            pagination: { paginationModel: { pageSize: 100 } },
          }}
          pageSizeOptions={[25, 50, 100]}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderColor: 'divider',
            },
            '& .MuiDataGrid-columnHeaders': {
              borderColor: 'divider',
              bgcolor: 'background.paper',
            },
            // Highlight selected row (current user)
            '& .MuiDataGrid-row.Mui-selected': {
              bgcolor: 'rgba(220, 38, 38, 0.15)', // RPB Red low opacity
              '&:hover': {
                bgcolor: 'rgba(220, 38, 38, 0.25)',
              },
            },
          }}
        />
      </Card>
    </Container>
  );
}
