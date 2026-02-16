'use client';

import { useTheme, alpha } from '@mui/material';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import { SatrRanking } from '@prisma/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

interface SatrTableProps {
  rankings: SatrRanking[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

export function SatrTable({ rankings, totalPages, currentPage }: SatrTableProps) {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', value.toString());
    router.push(`/tournaments/satr?${params.toString()}`);
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = {
        1: '#FFD700',
        2: '#C0C0C0',
        3: '#CD7F32'
      };
      const color = colors[rank as 1|2|3];
      return (
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: color,
            color: rank === 1 ? '#000' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '0.8rem',
            mx: 'auto',
            boxShadow: `0 0 15px ${alpha(color, 0.4)}`,
            border: '2px solid rgba(255,255,255,0.2)'
          }}
        >
          {rank}
        </Box>
      );
    }

    return (
      <Typography fontWeight="900" color="text.secondary" sx={{ fontSize: '0.85rem', opacity: 0.6 }}>
        #{rank}
      </Typography>
    );
  };

  return (
    <Box sx={{ position: 'relative' }}>
        <TableContainer
        component={Paper}
        elevation={0}
        sx={{
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 4,
            overflowX: 'auto',
            mb: 3,
        }}
        >
        <Table size="small">
            <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                <TableCell width={70} align="center" sx={{ py: 2, fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>Rang</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>Blader</TableCell>
                <TableCell align="center" sx={{ py: 2, fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>Score</TableCell>
                <TableCell align="center" sx={{ py: 2, fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>Wins</TableCell>
                <TableCell align="center" sx={{ py: 2, display: { xs: 'none', sm: 'table-cell' }, fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>Part.</TableCell>
                <TableCell align="center" sx={{ py: 2, fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>Winrate</TableCell>
                <TableCell align="center" sx={{ py: 2, display: { xs: 'none', md: 'table-cell' }, fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>Moyenne</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {rankings.length > 0 ? (
                rankings.map((row) => (
                    <TableRow 
                        key={row.id} 
                        component={motion.tr}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        hover 
                        sx={{ 
                            '& td': { py: 1, borderBottom: '1px solid rgba(255,255,255,0.02)' },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.03) !important' }
                        }}
                    >
                    <TableCell align="center">{getRankBadge(row.rank)}</TableCell>
                    <TableCell>
                        <Typography fontWeight="800" sx={{ fontSize: '0.95rem', color: '#fff' }}>{row.playerName}</Typography>
                    </TableCell>
                    <TableCell align="center">
                        <Typography fontWeight="900" sx={{ fontSize: '1rem', color: '#fbbf24' }}>{row.score.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="center">
                        <Typography fontWeight="700" color="success.main" sx={{ fontSize: '0.9rem' }}>{row.wins}</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography sx={{ fontSize: '0.85rem', opacity: 0.8 }}>{row.participation}</Typography>
                    </TableCell>
                    <TableCell align="center">
                        <Box sx={{ 
                            display: 'inline-block', 
                            px: 1, 
                            py: 0.25, 
                            borderRadius: 1, 
                            bgcolor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <Typography fontWeight="800" sx={{ fontSize: '0.85rem' }}>{row.winRate}</Typography>
                        </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.pointsAverage}</Typography>
                    </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                        <Typography variant="body1" color="text.secondary">Aucun blader trouvé</Typography>
                    </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        </TableContainer>

        {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
            <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
                sx={{
                    '& .MuiPaginationItem-root': {
                        fontWeight: 900,
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.1)',
                        '&.Mui-selected': {
                            bgcolor: '#fbbf24',
                            color: '#000',
                            '&:hover': { bgcolor: '#f59e0b' }
                        }
                    }
                }}
            />
            </Box>
        )}
    </Box>
  );
}
