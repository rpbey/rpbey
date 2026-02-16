'use client';

import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { SatrBlader } from '@prisma/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { TrophyIcon } from '@/components/ui/Icons';
import { SatrBladerDialog } from './SatrBladerDialog';

interface SatrBladersTableProps {
  bladers: SatrBlader[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

export function SatrBladersTable({
  bladers,
  totalPages,
  currentPage,
}: SatrBladersTableProps) {
  const _theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBlader, setSelectedBlader] = useState<SatrBlader | null>(null);

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', value.toString());
    router.push(`/tournaments/satr?${params.toString()}`);
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
                #
              </TableCell>
              <TableCell sx={{ py: 1 }}>Blader</TableCell>
              <TableCell align="center" sx={{ py: 1 }}>
                Total Wins
              </TableCell>
              <TableCell align="center" sx={{ py: 1 }}>
                Total Losses
              </TableCell>
              <TableCell align="center" sx={{ py: 1 }}>
                Winrate
              </TableCell>
              <TableCell align="center" sx={{ py: 1 }}>
                Tournois
              </TableCell>
              <TableCell
                align="center"
                sx={{ py: 1, display: { xs: 'none', md: 'table-cell' } }}
              >
                Historique
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bladers.length > 0 ? (
              bladers.map((row, index) => {
                const totalMatches = row.totalWins + row.totalLosses;
                const winRate =
                  totalMatches > 0
                    ? ((row.totalWins / totalMatches) * 100).toFixed(1)
                    : '0';
                const history = row.history as any[];
                const absoluteIndex = (currentPage - 1) * 100 + index + 1;

                // Vérifier si le joueur a déjà fini dans le Top 3 d'un tournoi
                const hasPodium = history.some((h) => h.rank && h.rank <= 3);
                const hasWinner = history.some((h) => h.rank === 1);

                return (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => setSelectedBlader(row)}
                    sx={{
                      '& td': { py: 0.5 },
                      cursor: 'pointer',
                    }}
                  >
                    <TableCell align="center">
                      <Typography variant="caption" color="text.secondary">
                        #{absoluteIndex}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography
                          fontWeight="bold"
                          variant="body2"
                          sx={{ fontSize: '0.85rem' }}
                        >
                          {row.name}
                        </Typography>
                        {hasWinner ? (
                          <Tooltip title="Champion SATR">
                            <Box sx={{ display: 'flex', color: '#FFD700' }}>
                                <TrophyIcon fontSize={16} />
                            </Box>
                          </Tooltip>
                        ) : hasPodium ? (
                          <Tooltip title="Podium SATR">
                            <Box sx={{ display: 'flex', color: '#C0C0C0', opacity: 0.8 }}>
                                <TrophyIcon fontSize={14} />
                            </Box>
                          </Tooltip>
                        ) : null}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        color="success.main"
                        variant="body2"
                        fontWeight="bold"
                      >
                        {row.totalWins}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography color="error.main" variant="body2">
                        {row.totalLosses}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="bold">
                        {winRate}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {row.tournamentsCount}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ display: { xs: 'none', md: 'table-cell' } }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.5,
                          justifyContent: 'center',
                        }}
                      >
                        {history.slice(-5).map((h, i) => (
                          <Tooltip
                            key={i}
                            title={`${h.tournament}: Rang ${h.rank || '?'}`}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor:
                                  h.wins > h.losses
                                    ? 'success.main'
                                    : 'error.main',
                                opacity: 0.6,
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Aucun blader trouvé
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

      <SatrBladerDialog
        blader={selectedBlader}
        open={!!selectedBlader}
        onClose={() => setSelectedBlader(null)}
      />
    </Box>
  );
}
