'use client';

import { useMediaQuery, useTheme } from '@mui/material';
import Avatar from '@mui/material/Avatar';
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
import type { Profile, User } from '@prisma/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getInitials } from '@/lib/utils';

type ProfileWithUser = Profile & {
  user: User & {
    _count: {
      tournaments: number;
    };
  };
};

interface RankingsTableProps {
  profiles: ProfileWithUser[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

export function RankingsTable({
  profiles,
  totalPages,
  currentPage,
}: RankingsTableProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', value.toString());
    router.push(`/rankings?${params.toString()}`);
  };

  const getRankColor = (index: number) => {
    // Calcul du rang absolu basé sur la page
    const absoluteRank = (currentPage - 1) * 20 + index + 1;

    if (absoluteRank === 1) return '#FFD700'; // Or
    if (absoluteRank === 2) return '#C0C0C0'; // Argent
    if (absoluteRank === 3) return '#CD7F32'; // Bronze
    return theme.palette.text.primary;
  };

  const getRankBadge = (index: number) => {
    const absoluteRank = (currentPage - 1) * 20 + index + 1;

    if (absoluteRank <= 3) {
      return (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: getRankColor(index),
            color: absoluteRank === 1 ? 'black' : 'white', // Contraste pour l'Or
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            mx: 'auto',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            textShadow:
              absoluteRank === 1 ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          {absoluteRank}
        </Box>
      );
    }

    return (
      <Typography fontWeight="bold" color="text.secondary">
        #{absoluteRank}
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
          borderRadius: 4,
          overflowX: 'auto',
          mb: 4,
          '&::-webkit-scrollbar': { height: '4px' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'divider',
            borderRadius: '4px',
          },
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell
                width={isMobile ? 50 : 80}
                align="center"
                sx={{ px: { xs: 0.5, sm: 2 } }}
              >
                #
              </TableCell>
              <TableCell>Blader</TableCell>
              <TableCell align="center">Points</TableCell>
              <TableCell
                align="center"
                sx={{ display: { xs: 'none', md: 'table-cell' } }}
              >
                Participations
              </TableCell>
              <TableCell
                align="center"
                sx={{ display: { xs: 'none', sm: 'table-cell' } }}
              >
                Tournois Gagnés
              </TableCell>
              <TableCell
                align="center"
                sx={{ display: { xs: 'none', lg: 'table-cell' } }}
              >
                Matchs
              </TableCell>
              <TableCell align="center">Winrate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {profiles.length > 0 ? (
              profiles.map((profile, index) => {
                const totalMatches = profile.wins + profile.losses;
                const winRate =
                  totalMatches > 0
                    ? ((profile.wins / totalMatches) * 100).toFixed(1)
                    : '0';

                return (
                  <TableRow
                    key={profile.id}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <TableCell align="center" sx={{ px: { xs: 0.5, sm: 2 } }}>
                      {getRankBadge(index)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/profile/${profile.userId}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            '&:hover': {
                              '& .MuiTypography-root': {
                                color: 'primary.main',
                              },
                            },
                          }}
                        >
                          <Avatar
                            src={profile.user.image || undefined}
                            sx={{
                              width: 48,
                              height: 48,
                              border: `2px solid ${theme.palette.background.paper}`,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }}
                          >
                            {getInitials(
                              profile.bladerName || profile.user.name,
                            )}
                          </Avatar>
                          <Box>
                            <Typography
                              fontWeight="bold"
                              sx={{
                                transition: 'color 0.2s',
                                fontSize: { xs: '0.85rem', md: '1rem' },
                                maxWidth: { xs: '100px', sm: 'none' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {profile.bladerName ||
                                profile.user.name ||
                                'Anonyme'}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: 'inline-block',
                                bgcolor: 'action.selected',
                                px: 1,
                                py: 0.2,
                                borderRadius: 1,
                                mt: 0.5,
                              }}
                            >
                              {profile.favoriteType || 'Type inconnu'}
                            </Typography>
                          </Box>
                        </Box>
                      </Link>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        fontWeight="900"
                        color="primary.main"
                        fontSize="1.2rem"
                      >
                        {profile.rankingPoints}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        pts
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ display: { xs: 'none', md: 'table-cell' } }}
                    >
                      <Typography fontWeight="bold">
                        {profile.user._count.tournaments}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                    >
                      {profile.tournamentWins > 0 ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5,
                          }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>🏆</span>
                          <Typography fontWeight="bold">
                            {profile.tournamentWins}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ display: { xs: 'none', lg: 'table-cell' } }}
                    >
                      <Typography variant="body2">
                        <span style={{ color: theme.palette.success.main }}>
                          {profile.wins}W
                        </span>
                        {' / '}
                        <span style={{ color: theme.palette.error.main }}>
                          {profile.losses}L
                        </span>
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{ position: 'relative', display: 'inline-flex' }}
                      >
                        <Typography
                          fontWeight="bold"
                          color={
                            parseFloat(winRate) >= 50
                              ? 'success.main'
                              : 'text.secondary'
                          }
                        >
                          {winRate}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Aucun blader trouvé
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Essayez de changer de page.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
}
