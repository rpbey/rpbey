import { Download } from '@mui/icons-material';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Suspense } from 'react';
import RankingSearch from '@/components/rankings/RankingSearch';
import {
  type ProfileWithUser,
  RankingsTable,
} from '@/components/rankings/RankingsTable';
import SeasonSelector from '@/components/rankings/SeasonSelector';
import TopRankingsPodium from '@/components/rankings/TopRankingsPodium';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  MuiDiscordIcon as DiscordIcon,
  MuiTikTokIcon as TikTokIcon,
  MuiTwitchIcon as TwitchIcon,
  MuiXIcon as XIcon,
} from '@/components/ui/MuiIcons';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { prisma } from '@/lib/prisma';
import {
  createPageMetadata,
  generateBreadcrumbJsonLd,
  generateItemListJsonLd,
} from '@/lib/seo-utils';
import { getSeasonStandings, getSeasons } from '@/server/actions/season';

export const dynamic = 'force-dynamic';

export const metadata = createPageMetadata({
  title: 'Classements | RPB',
  description:
    'Les meilleurs bladers de la République Populaire du Beyblade. Classement officiel mis à jour en temps réel.',
  path: '/rankings',
});

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
  let seasons: Awaited<ReturnType<typeof getSeasons>> = [];
  let profiles: ProfileWithUser[] = [];
  let totalCount = 0;

  try {
    // Fetch available seasons
    seasons = await getSeasons();

    if (seasonSlug && seasonSlug !== 'current') {
      // Historical Season
      const seasonData = await getSeasonStandings(seasonSlug);
      if (seasonData) {
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
          })) as unknown as ProfileWithUser[];
      }
    } else {
      // Current Season (Global Rankings)

      const whereCondition = searchQuery
        ? {
            points: { gt: 0 },
            playerName: {
              contains: searchQuery,
              mode: 'insensitive' as const,
            },
          }
        : {
            points: { gt: 0 },
            playerName: { notIn: ['Yoyo', 'Loteux', '𝓡𝓟𝓑 | LOTTEUX!'] },
          };

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
      })) as unknown as ProfileWithUser[];
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
  const showPodium = page === 1 && !searchQuery && profiles.length >= 3;

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
      className="bbx-scanlines"
      sx={{
        minHeight: '100vh',
        position: 'relative',
        bgcolor: 'background.default',
        pt: { xs: 1, sm: 2, md: 4 },
        pb: { xs: 12, sm: 8 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: { xs: '40vh', md: '50vh' },
          background: `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(var(--rpb-primary-rgb), 0.15) 0%, transparent 70%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{ position: 'relative', px: { xs: 1.5, sm: 2, md: 3 } }}
      >
        <JsonLd
          data={generateBreadcrumbJsonLd([
            { name: 'Accueil', item: '/' },
            { name: 'Classements', item: '/rankings' },
          ])}
        />
        {showPodium && profiles.length >= 3 && (
          <JsonLd
            data={generateItemListJsonLd(
              profiles.slice(0, 10).map((p, i) => ({
                name: p.bladerName || 'Anonyme',
                url: p.userId ? `/profile/${p.userId}` : '/rankings',
                position: i + 1,
                image: p.user?.image ?? undefined,
              })),
            )}
          />
        )}
        {/* Visually hidden heading for screen readers */}
        <Typography
          component="h1"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            borderWidth: 0,
          }}
        >
          Classement officiel RPB
        </Typography>

        {/* Header */}
        <Box
          sx={{
            mb: { xs: 3, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, md: 3 },
          }}
        >
          {/* Search + Socials row */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'stretch', md: 'center' },
              gap: { xs: 1.5, md: 3 },
            }}
          >
            {/* Search */}
            <Box sx={{ flex: 1, maxWidth: { md: 500 } }}>
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

            {/* Socials */}
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                justifyContent: { xs: 'center', md: 'flex-end' },
                flexShrink: 0,
              }}
            >
              {socials.map((s) => (
                <Tooltip key={s.name} title={s.name}>
                  <IconButton
                    component="a"
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Suivre RPB sur ${s.name}`}
                    size="small"
                    sx={{
                      color: 'rgba(255,255,255,0.4)',
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      width: { xs: 36, md: 40 },
                      height: { xs: 36, md: 40 },
                      '&:hover': {
                        color: s.color,
                        bgcolor: 'rgba(255,255,255,0.08)',
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(s.color, 0.2)}`,
                      },
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: s.color,
                        outlineOffset: 2,
                      },
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <s.icon sx={{ fontSize: { xs: 16, md: 20 } }} />
                  </IconButton>
                </Tooltip>
              ))}
            </Stack>
          </Box>

          {/* Season selector */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
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

            <Box sx={{ flexGrow: 1 }} />

            <Tooltip title="Télécharger le classement en image">
              <IconButton
                component="a"
                href="/api/leaderboard/card"
                download="classement-rpb.png"
                aria-label="Télécharger le classement en image"
                size="small"
                sx={{
                  color: 'rgba(255,255,255,0.4)',
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  '&:hover': {
                    color: 'var(--rpb-secondary)',
                    bgcolor: 'rgba(255,255,255,0.08)',
                  },
                  '&:focus-visible': {
                    outline: '2px solid var(--rpb-secondary)',
                    outlineOffset: 2,
                  },
                }}
              >
                <Download sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Top 3 Podium */}
        {showPodium && (
          <Suspense
            fallback={
              <Box
                sx={{
                  height: { xs: 200, md: 260 },
                  width: '100%',
                  bgcolor: 'rgba(255,255,255,0.02)',
                  borderRadius: 4,
                }}
              />
            }
          >
            <TopRankingsPodium topProfiles={profiles.slice(0, 3)} />
          </Suspense>
        )}

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
              profiles={profiles as ProfileWithUser[]}
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
            mt: { xs: 4, md: 6 },
            opacity: 0.15,
            letterSpacing: 2,
            fontWeight: 900,
            fontSize: { xs: '0.55rem', md: '0.7rem' },
          }}
        >
          RÉPUBLIQUE POPULAIRE DU BEYBLADE • CLASSEMENT OFFICIEL
        </Typography>
      </Container>

      <ScrollToTop />
    </Box>
  );
}
