'use client';

import { useMediaQuery, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import type { SatrRanking } from '@prisma/client';
import { useRouter, useSearchParams } from 'next/navigation';

interface SatrTableProps {
  rankings: SatrRanking[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

export function SatrTable({
  rankings,
  totalPages,
  currentPage,
}: SatrTableProps) {
  const theme = useTheme();
  const _isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', value.toString());
    router.push(`/tournaments/satr?${params.toString()}`);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Or
    if (rank === 2) return '#C0C0C0'; // Argent
    if (rank === 3) return '#CD7F32'; // Bronze
    return 'transparent';
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      return (
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: getRankColor(rank),
            color: rank === 1 ? 'black' : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '0.75rem',
            mx: 'auto',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        >
          {rank}
        </Box>
      );
    }

    return (
      <Typography
        fontWeight="bold"
        color="text.secondary"
        variant="body2"
        sx={{ fontSize: '0.8rem' }}
      >
        #{rank}
      </Typography>
    );
  };

  return (
    <Box>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflowX: 'auto',
          mb: 2,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell width={60} align="center" sx={{ py: 1 }}>
                Rang
              </TableCell>
              <TableCell sx={{ py: 1 }}>Joueur</TableCell>
              <TableCell align="center" sx={{ py: 1 }}>
                Score
              </TableCell>
              <TableCell align="center" sx={{ py: 1 }}>
                Wins
              </TableCell>
              <TableCell
                align="center"
                sx={{ py: 1, display: { xs: 'none', sm: 'table-cell' } }}
              >
                Part.
              </TableCell>
              <TableCell align="center" sx={{ py: 1 }}>
                Winrate
              </TableCell>
              <TableCell
                align="center"
                sx={{ py: 1, display: { xs: 'none', md: 'table-cell' } }}
              >
                Moyenne
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rankings.length > 0 ? (
              rankings.map((row) => (
                <TableRow key={row.id} hover sx={{ '& td': { py: 0.5 } }}>
                  <TableCell align="center">{getRankBadge(row.rank)}</TableCell>
                  <TableCell>
                    <Typography
                      fontWeight="bold"
                      variant="body2"
                      sx={{ fontSize: '0.85rem' }}
                    >
                      {row.playerName}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      fontWeight="900"
                      color="primary.main"
                      variant="body2"
                      sx={{ fontSize: '0.9rem' }}
                    >
                      {row.score.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {row.wins}
                    </Typography>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {row.participation}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {row.winRate}
                    </Typography>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ display: { xs: 'none', md: 'table-cell' } }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {row.pointsAverage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Aucun joueur trouvé
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="small"
            showFirstButton
            showLastButton
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
}
