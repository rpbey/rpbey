import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { headers } from 'next/headers';
import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import prisma from '@/lib/prisma';
import { getInitials } from '@/lib/utils';

export const metadata = {
  title: 'Classements',
  description: 'Les meilleurs bladers de la République Populaire du Beyblade.',
};

export default async function RankingsPage() {
  await headers();
  const profiles = await prisma.profile.findMany({
    orderBy: [{ rankingPoints: 'desc' }, { tournamentWins: 'desc' }, { wins: 'desc' }],
    include: {
      user: true,
    },
    take: 50,
  });

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <PageHeader
        title="Classements"
        description="Découvrez les meilleurs bladers de la communauté."
      />

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell width={80} align="center">
                Rang
              </TableCell>
              <TableCell>Blader</TableCell>
              <TableCell align="center">Points</TableCell>
              <TableCell align="center">Victoires Tournois</TableCell>
              <TableCell align="center">Victoires</TableCell>
              <TableCell align="center">Ratio</TableCell>
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
                  <TableRow key={profile.id} hover>
                    <TableCell align="center">
                      <Typography
                        fontWeight="bold"
                        color={index < 3 ? 'primary.main' : 'text.primary'}
                      >
                        #{index + 1}
                      </Typography>
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
                          <Avatar src={profile.user.image || undefined}>
                            {getInitials(
                              profile.bladerName || profile.user.name,
                            )}
                          </Avatar>
                          <Box>
                            <Typography
                              fontWeight="medium"
                              sx={{ transition: 'color 0.2s' }}
                            >
                              {profile.bladerName ||
                                profile.user.name ||
                                'Anonyme'}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {profile.favoriteType || 'Type inconnu'}
                            </Typography>
                          </Box>
                        </Box>
                      </Link>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight="900" color="primary.main" fontSize="1.1rem">
                        {profile.rankingPoints} pts
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight="medium">
                        {profile.tournamentWins}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{profile.wins}</TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {winRate}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Aucun blader n'est encore classé.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
