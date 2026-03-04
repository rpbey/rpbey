import InfoIcon from '@mui/icons-material/Info';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import { alpha } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import { Suspense } from 'react';
import RankingSearch from '@/components/rankings/RankingSearch';
import { RankingsTable } from '@/components/rankings/RankingsTable';
import SeasonSelector from '@/components/rankings/SeasonSelector';
import { prisma } from '@/lib/prisma';
import { getSeasonStandings, getSeasons } from '@/server/actions/season';

// Custom icons
const TwitchIcon = (props: SvgIconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
    {...props}
  >
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h2.998L22.286 11.143V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
  </svg>
);

const TikTokIcon = (props: SvgIconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
    {...props}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const XIcon = (props: SvgIconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
    {...props}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DiscordIcon = (props: SvgIconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
    {...props}
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.07 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Classements | RPB',
  description:
    'Les meilleurs bladers de la République Populaire du Beyblade. Classement officiel mis à jour en temps réel.',
};

interface RankingsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RankingsPage({
  searchParams,
}: RankingsPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1);
  const pageSize = 100;
  const seasonSlug =
    typeof resolvedSearchParams.season === 'string'
      ? resolvedSearchParams.season
      : null;
  const searchQuery =
    typeof resolvedSearchParams.search === 'string'
      ? resolvedSearchParams.search
      : '';

  // Initialize data variables
  let seasons: any[] = [];
  let profiles: any[] = [];
  let totalCount = 0;
  let title = 'Classements Officiels';

  try {
    // Fetch available seasons
    seasons = await getSeasons();

    if (seasonSlug && seasonSlug !== 'current') {
      // Historical Season
      const seasonData = await getSeasonStandings(seasonSlug);
      if (seasonData) {
        title = `Classement - ${seasonData.name}`;

        let entries = seasonData.entries;

        // Filter by search locally for historical data (since it's a fixed array in the action)
        if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          entries = entries.filter(
            (e) =>
              e.user?.profile?.bladerName?.toLowerCase().includes(lowerQuery) ||
              e.user?.profile?.challongeUsername
                ?.toLowerCase()
                .includes(lowerQuery) ||
              e.user?.name?.toLowerCase().includes(lowerQuery) ||
              e.user?.username?.toLowerCase().includes(lowerQuery) ||
              e.playerName?.toLowerCase().includes(lowerQuery),
          );
        }

        totalCount = entries.length;
        // Manually paginate the entries
        profiles = entries
          .slice((page - 1) * pageSize, page * pageSize)
          .map((entry) => ({
            id: entry.id,
            userId: entry.userId,
            rankingPoints: entry.points,
            wins: entry.wins,
            losses: entry.losses,
            tournamentWins: entry.tournamentWins,
            bladerName:
              entry.playerName || entry.user?.profile?.bladerName || null,
            challongeUsername: entry.user?.profile?.challongeUsername || null,
            favoriteType: null, // Not stored in history, optional
            user: entry.user
              ? {
                  ...entry.user,
                  _count: { tournaments: entry.tournamentWins }, // Approximation for history
                  image: entry.user.image,
                }
              : {
                  name: entry.playerName,
                  _count: { tournaments: entry.tournamentWins },
                  image: null,
                },
            // Add missing required Profile fields for serialization safety
            createdAt: new Date(),
            updatedAt: new Date(),
            experience: 'BEGINNER',
          }));
      }
    } else {
      // Current Season (Global Rankings)

      const whereCondition: any = {
        points: { gt: 0 },
        playerName: { notIn: ['Yoyo', 'Loteux', '𝓡𝓟𝓑 | LOTTEUX!'] },
      };

      if (searchQuery) {
        whereCondition.playerName = {
          contains: searchQuery,
          mode: 'insensitive',
        };
      }

      const [liveRankings, count] = await Promise.all([
        prisma.globalRanking.findMany({
          where: whereCondition,
          take: pageSize,
          skip: (page - 1) * pageSize,
          orderBy: [
            { points: 'desc' },
            { tournamentWins: 'desc' },
            { wins: 'desc' },
            { playerName: 'asc' },
          ],
          include: {
            user: {
              include: {
                _count: {
                  select: { tournaments: true },
                },
                profile: true,
              },
            },
          },
        }),
        prisma.globalRanking.count({ where: whereCondition }),
      ]);

      profiles = liveRankings.map((r) => ({
        id: r.id,
        userId: r.userId,
        rankingPoints: r.points,
        wins: r.wins,
        losses: r.losses,
        tournamentWins: r.tournamentWins,
        bladerName: r.playerName,
        challongeUsername: r.user?.profile?.challongeUsername || null,
        favoriteType: r.user?.profile?.favoriteType || null,
        user: r.user
          ? {
              ...r.user,
              _count: { tournaments: r.tournamentsCount },
              image: r.avatarUrl || r.user.image,
            }
          : {
              name: r.playerName,
              _count: { tournaments: r.tournamentsCount },
              image: r.avatarUrl,
            },
        createdAt: r.updatedAt,
        updatedAt: r.updatedAt,
        experience: r.user?.profile?.experience || 'BEGINNER',
      }));
      totalCount = count;
    }
  } catch (error) {
    console.error('RankingsPage Error:', error);
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          Une erreur est survenue lors du chargement des classements. Veuillez
          réessayer plus tard.
        </Alert>
      </Container>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  const socials = [
    {
      name: 'TikTok',
      url: 'https://www.tiktok.com/@rpb_bey',
      icon: TikTokIcon,
      color: '#ff0050',
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/rpb_bey',
      icon: InstagramIcon,
      color: '#E1306C',
    },
    {
      name: 'X / Twitter',
      url: 'https://twitter.com/RPBey_fr',
      icon: XIcon,
      color: '#fff',
    },
    {
      name: 'Twitch',
      url: 'https://www.twitch.tv/tv_rpb',
      icon: TwitchIcon,
      color: '#9146FF',
    },
    {
      name: 'Discord',
      url: 'https://discord.gg/V8H2vHWeU6',
      icon: DiscordIcon,
      color: '#5865F2',
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/@RPB-Beyblade',
      icon: YouTubeIcon,
      color: '#FF0000',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 50% -20%, #2a0a0a 0%, #050505 100%)',
        pt: { xs: 2, md: 4 },
        pb: 8,
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header Layout Similar to SATR */}
        <Box
          sx={{
            mb: { xs: 4, md: 6 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 2, md: 3 },
            px: { xs: 1, md: 0 },
          }}
        >
          {/* Left: Empty Space for Layout Balance */}
          <Box
            sx={{
              flex: 1,
              display: { xs: 'none', md: 'block' },
            }}
          />

          {/* Center: Search */}
          <Box
            sx={{
              flex: 2,
              width: '100%',
              maxWidth: { xs: '100%', md: 600 },
              order: { xs: 3, md: 2 },
            }}
          >
            <Suspense
              fallback={
                <Paper
                  sx={{
                    height: 44,
                    width: '100%',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    borderRadius: 3,
                  }}
                />
              }
            >
              <RankingSearch defaultValue={searchQuery} />
            </Suspense>
          </Box>

          {/* Right: Socials */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: { xs: 'center', md: 'flex-end' },
              width: '100%',
              order: { xs: 2, md: 3 },
            }}
          >
            <Stack direction="row" spacing={1}>
              {socials.map((s) => (
                <Tooltip key={s.name} title={s.name}>
                  <IconButton
                    component="a"
                    href={s.url}
                    target="_blank"
                    size="small"
                    sx={{
                      color: 'rgba(255,255,255,0.4)',
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      '&:hover': {
                        color: s.color,
                        bgcolor: 'rgba(255,255,255,0.08)',
                        transform: 'translateY(-3px)',
                        boxShadow: `0 5px 15px ${alpha(s.color, 0.2)}`,
                      },
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <s.icon sx={{ fontSize: { xs: 18, md: 20 } }} />
                  </IconButton>
                </Tooltip>
              ))}
            </Stack>
          </Box>
        </Box>

        <Box
          sx={{
            mb: { xs: 2, md: 4 },
            mt: { xs: 2, md: 4 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Suspense
            fallback={
              <Box
                sx={{
                  height: 40,
                  width: 200,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                }}
              />
            }
          >
            <SeasonSelector seasons={seasons} />
          </Suspense>
        </Box>

        <Box sx={{ position: 'relative' }}>
          <Suspense
            fallback={
              <Box
                sx={{
                  height: 400,
                  width: '100%',
                  bgcolor: 'action.hover',
                  borderRadius: 4,
                }}
              />
            }
          >
            <RankingsTable
              profiles={profiles}
              totalPages={totalPages}
              currentPage={page}
              totalCount={totalCount}
            />
          </Suspense>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 6,
            opacity: 0.2,
            letterSpacing: 2,
            fontWeight: 900,
            fontSize: { xs: '0.6rem', md: '0.75rem' },
          }}
        >
          RÉPUBLIQUE POPULAIRE DU BEYBLADE • CLASSEMENT OFFICIEL
        </Typography>
      </Container>
    </Box>
  );
}
