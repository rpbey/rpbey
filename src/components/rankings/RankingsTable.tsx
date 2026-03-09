'use client';

import {
  EmojiEvents as TrophyIcon,
  CheckCircle as VerifiedIcon,
} from '@mui/icons-material';
import type { Theme } from '@mui/material';
import { Tooltip, useTheme } from '@mui/material';
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
import { authClient } from '@/lib/auth-client';
import { getInitials } from '@/lib/utils';

export type ProfileWithUser = Profile & {
  user: User & {
    _count: {
      tournaments: number;
    };
  };
};

function BladerInfo({
  profile,
  theme,
}: {
  profile: ProfileWithUser;
  theme: Theme;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 0.5, sm: 2 },
        '&:hover': {
          '& .MuiTypography-root': {
            color: 'primary.main',
          },
        },
      }}
    >
      <Avatar
        src={profile.user?.image || undefined}
        sx={{
          width: { xs: 24, sm: 40 },
          height: { xs: 24, sm: 40 },
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {getInitials(profile.bladerName || profile.user?.name)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Typography
            fontWeight="bold"
            sx={{
              transition: 'color 0.2s',
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              maxWidth: { xs: '150px', sm: '250px' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {profile.bladerName ||
              profile.user?.name ||
              profile.challongeUsername ||
              profile.user?.username?.replace(/^bts[1-3]_/, '') ||
              'Anonyme'}
          </Typography>
          {profile.challongeUsername && (
            <Tooltip title={`Compte Challonge : ${profile.challongeUsername}`}>
              <Link
                href={`https://challonge.com/fr/users/${profile.challongeUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()} // Prevent row click
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <VerifiedIcon
                  sx={{
                    fontSize: { xs: '0.7rem', sm: '0.9rem' },
                    color: 'info.main',
                    opacity: 0.8,
                    flexShrink: 0,
                    transition: 'opacity 0.2s',
                    '&:hover': { opacity: 1, filter: 'brightness(1.2)' },
                  }}
                />
              </Link>
            </Tooltip>
          )}
        </Box>
        {profile.tournamentWins > 0 && (
          <Tooltip title={`${profile.tournamentWins} tournoi(s) remporté(s)`}>
            <TrophyIcon
              sx={{
                fontSize: { xs: '0.8rem', sm: '1.1rem' },
                color: '#FFD700',
                filter: 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.4))',
                mt: 0.2,
              }}
            />
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

interface RankingsTableProps {
  profiles: ProfileWithUser[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  profileUrlPrefix?: string;
  baseUrl?: string;
}

export function RankingsTable({
  profiles,
  totalPages,
  currentPage,
  profileUrlPrefix = '/profile',
  baseUrl = '/rankings',
}: RankingsTableProps) {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', value.toString());
    router.push(`${baseUrl}?${params.toString()}`);
  };

  const getRankColor = (index: number) => {
    // Calcul du rang absolu basé sur la page (base 100 désormais)
    const absoluteRank = (currentPage - 1) * 100 + index + 1;

    if (absoluteRank === 1) return '#FFD700'; // Or
    if (absoluteRank === 2) return '#C0C0C0'; // Argent
    if (absoluteRank === 3) return '#CD7F32'; // Bronze
    return theme.palette.text.primary;
  };

  const getRankBadge = (index: number) => {
    const absoluteRank = (currentPage - 1) * 100 + index + 1;

    if (absoluteRank <= 3) {
      return (
        <Box
          sx={{
            width: { xs: 28, sm: 32 },
            height: { xs: 28, sm: 32 },
            borderRadius: '50%',
            bgcolor: getRankColor(index),
            color: absoluteRank <= 3 ? 'rgba(0, 0, 0, 0.87)' : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            mx: 'auto',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            textShadow: 'none',
            fontSize: { xs: '0.75rem', sm: '1rem' },
          }}
        >
          {absoluteRank}
        </Box>
      );
    }

    return (
      <Typography
        fontWeight="bold"
        color="text.secondary"
        sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }}
      >
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
          borderRadius: { xs: 2, sm: 4 },
          overflowX: 'auto',
          maxHeight: '80vh', // Sticky header support
          mb: 4,
          '&::-webkit-scrollbar': { height: '4px', width: '4px' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'divider',
            borderRadius: '4px',
          },
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                sx={{
                  width: { xs: 30, sm: 60 },
                  px: { xs: 0.2, sm: 2 },
                  bgcolor: 'action.hover',
                  fontWeight: 'bold',
                }}
              >
                #
              </TableCell>
              <TableCell
                sx={{
                  px: { xs: 0.5, sm: 2 },
                  bgcolor: 'action.hover',
                  fontWeight: 'bold',
                }}
              >
                Blader
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  px: { xs: 0.2, sm: 2 },
                  bgcolor: 'action.hover',
                  fontWeight: 'bold',
                }}
              >
                Points
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  px: { xs: 0.2, sm: 2 },
                  bgcolor: 'action.hover',
                  fontWeight: 'bold',
                  display: { xs: 'none', sm: 'table-cell' },
                }}
              >
                <Tooltip title="Nombre de tournois officiels disputés">
                  <span>T.</span>
                </Tooltip>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  px: { xs: 0.2, sm: 2 },
                  bgcolor: 'action.hover',
                  fontWeight: 'bold',
                  display: { xs: 'table-cell', md: 'table-cell' },
                }}
              >
                <Tooltip title="Nombre de matchs (Victoires / Défaites)">
                  <span>M.</span>
                </Tooltip>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  px: { xs: 0.2, sm: 2 },
                  bgcolor: 'action.hover',
                  fontWeight: 'bold',
                  display: { xs: 'table-cell', md: 'table-cell' },
                }}
              >
                <Tooltip title="Taux de victoire (Win Rate)">
                  <span>WR</span>
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {profiles.length > 0 ? (
              profiles.map((profile, index) => {
                const totalMatches = profile.wins + profile.losses;
                const winRate =
                  totalMatches > 0
                    ? ((profile.wins / totalMatches) * 100).toFixed(0)
                    : '0';

                const isCurrentUser = session?.user?.id === profile.userId;

                return (
                  <TableRow
                    key={profile.id}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      bgcolor: isCurrentUser
                        ? 'rgba(220, 38, 38, 0.08)' // RPB Red subtle highlight
                        : index % 2 === 0
                          ? 'transparent'
                          : 'rgba(255, 255, 255, 0.02)',
                      transition: 'background-color 0.2s',
                      borderLeft: isCurrentUser ? '4px solid #dc2626' : 'none',
                    }}
                  >
                    <TableCell align="center" sx={{ px: { xs: 0.2, sm: 2 } }}>
                      {getRankBadge(index)}
                    </TableCell>
                    <TableCell sx={{ px: { xs: 0.2, sm: 2 } }}>
                      {profile.userId ? (
                        <Link
                          href={`${profileUrlPrefix}/${profile.userId}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <BladerInfo profile={profile} theme={theme} />
                        </Link>
                      ) : (
                        <Box sx={{ color: 'inherit' }}>
                          <BladerInfo profile={profile} theme={theme} />
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ px: { xs: 0.1, sm: 2 } }}>
                      <Typography
                        fontWeight="900"
                        color="primary.main"
                        sx={{ fontSize: { xs: '0.75rem', sm: '1.1rem' } }}
                      >
                        {profile.rankingPoints}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        px: { xs: 0.1, sm: 2 },
                        display: { xs: 'none', sm: 'table-cell' },
                      }}
                    >
                      <Typography
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.9rem' } }}
                      >
                        {profile.user?._count?.tournaments || 0}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        px: { xs: 0.1, sm: 2 },
                        display: { xs: 'table-cell', md: 'table-cell' },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: { xs: '0.65rem', sm: '0.85rem' },
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span style={{ color: theme.palette.success.main }}>
                          {profile.wins}
                        </span>
                        <span style={{ opacity: 0.5 }}>/</span>
                        <span style={{ color: theme.palette.error.main }}>
                          {profile.losses}
                        </span>
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        px: { xs: 0.1, sm: 2 },
                        display: { xs: 'table-cell', md: 'table-cell' },
                      }}
                    >
                      <Typography
                        fontWeight="bold"
                        sx={{ fontSize: { xs: '0.65rem', sm: '0.9rem' } }}
                        color={
                          parseFloat(winRate) >= 50
                            ? 'success.main'
                            : 'text.secondary'
                        }
                      >
                        {winRate}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
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
            size="medium"
            showFirstButton
            showLastButton
            shape="rounded"
            sx={{
              '& .MuiPaginationItem-firstLast': {
                display: { xs: 'none', sm: 'inline-flex' },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
