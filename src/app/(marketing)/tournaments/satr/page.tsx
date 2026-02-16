import { Container, Box, Stack, IconButton, Tooltip, Paper, Typography, alpha } from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';
import { SatrTable } from '@/components/rankings/SatrTable';
import { SatrBladersTable } from '@/components/rankings/SatrBladersTable';
import { SatrHallOfFame } from '@/components/rankings/SatrHallOfFame';
import { SatrTabs } from '@/components/rankings/SatrTabs';
import { SatrCharts } from '@/components/rankings/SatrCharts';
import RankingSearch from '@/components/rankings/RankingSearch';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import { Suspense } from 'react';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Custom icons
const TwitchIcon = (props: SvgIconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h2.998L22.286 11.143V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
  </svg>
);

const TikTokIcon = (props: SvgIconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const XIcon = (props: SvgIconProps) => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const DiscordIcon = (props: SvgIconProps) => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.07 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
);

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Beyblade Battle Tournament | SATR',
  description: 'Le classement officiel SATR.',
};

interface SatrPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getChampions() {
    try {
        const path = join(process.cwd(), 'data', 'satr_champions.json');
        const content = await readFile(path, 'utf-8');
        return JSON.parse(content);
    } catch {
        return [];
    }
}

export default async function SatrPage({ searchParams }: SatrPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1);
  const pageSize = 100;
  const searchQuery = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : '';
  const mode = (resolvedSearchParams.view === 'career' ? 'career' : 'ranking') as 'ranking' | 'career';

  const [champions, rankingData, globalStats, lastUpdate] = await Promise.all([
      getChampions(),
      (async () => {
          try {
              if (mode === 'ranking') {
                // @ts-ignore
                if (!prisma.satrRanking) return { items: [], total: 0 };
                const whereCondition = searchQuery ? {
                    playerName: { contains: searchQuery, mode: 'insensitive' as const }
                } : {};
                const [rankings, count] = await Promise.all([
                    prisma.satrRanking.findMany({
                        where: whereCondition,
                        orderBy: { rank: 'asc' },
                        take: pageSize,
                        skip: (page - 1) * pageSize,
                    }),
                    prisma.satrRanking.count({ where: whereCondition })
                ]);
                return { items: rankings, total: count };
              } else {
                // @ts-ignore
                if (!prisma.satrBlader) return { items: [], total: 0 };
                const whereCondition = searchQuery ? {
                    name: { contains: searchQuery, mode: 'insensitive' as const }
                } : {};
                            const [bladers, count] = await Promise.all([
                                prisma.satrBlader.findMany({
                                    where: whereCondition,
                                    orderBy: [
                                        { tournamentWins: 'desc' },
                                        { totalWins: 'desc' }
                                    ],
                                    take: pageSize,
                                    skip: (page - 1) * pageSize,
                                }),
                                prisma.satrBlader.count({ where: whereCondition })
                            ]);                return { items: bladers, total: count };
              }
          } catch (e) {
              console.error('Data fetch error:', e);
              return { items: [], total: 0 };
          }
      })(),
      (async () => {
          try {
              // @ts-ignore
              if (!prisma.satrBlader) return { totalBladers: 0, totalMatches: 0 };
              const stats = await prisma.satrBlader.aggregate({
                  _sum: {
                      totalWins: true,
                      totalLosses: true
                  },
                  _count: {
                      id: true
                  }
              });
              return {
                  totalBladers: stats._count.id,
                  totalMatches: Math.floor(((stats._sum.totalWins || 0) + (stats._sum.totalLosses || 0)) / 2)
              };
          } catch (e) {
              return { totalBladers: 0, totalMatches: 0 };
          }
      })(),
      // @ts-ignore
      prisma.satrRanking ? prisma.satrRanking.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }) : null
  ]);

  const totalPages = Math.ceil(rankingData.total / pageSize);

  const socials = [
    { name: 'TikTok', url: 'https://www.tiktok.com/@sunafterthereign', icon: TikTokIcon, color: '#ff0050' },
    { name: 'Instagram', url: 'https://www.instagram.com/sunafterthereign', icon: InstagramIcon, color: '#E1306C' },
    { name: 'X / Twitter', url: 'https://x.com/SunAfterTheBey', icon: XIcon, color: '#fff' },
    { name: 'Twitch', url: 'https://www.twitch.tv/sunafterthereign', icon: TwitchIcon, color: '#9146FF' },
    { name: 'Discord', url: 'https://discord.gg/afEvCBF9XR', icon: DiscordIcon, color: '#5865F2' },
    { name: 'YouTube', url: 'https://www.youtube.com/channel/UCm3y-lCQUOM6Vj52LSoLTvA', icon: YouTubeIcon, color: '#FF0000' },
  ];

  return (
    <Box sx={{ 
        minHeight: '100vh', 
        background: 'radial-gradient(circle at 50% -20%, #1a1a1a 0%, #050505 100%)',
        pt: { xs: 2, md: 4 },
        pb: 8
    }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
            <Box sx={{ 
                mb: { xs: 4, md: 6 }, 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: { xs: 2, md: 3 },
                px: { xs: 1, md: 0 }
            }}>
                    {/* Left: Logo */}
                    <Box sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        justifyContent: { xs: 'center', md: 'flex-start' },
                        width: '100%'
                    }}>
                        <Box sx={{ position: 'relative', width: { xs: 120, md: 180 }, height: { xs: 60, md: 80 } }}>
                            <Image 
                                src="/satr-logo.webp" 
                                alt="SATR 2 Logo" 
                                fill 
                                style={{ objectFit: 'contain', mixBlendMode: 'screen', filter: 'drop-shadow(0 0 20px rgba(220, 38, 38, 0.2))' }} 
                                priority 
                            />
                        </Box>
                    </Box>

                    {/* Center: Search */}
                    <Box sx={{ flex: 2, width: '100%', maxWidth: { xs: '100%', md: 600 }, order: { xs: 3, md: 2 } }}>
                        <Suspense fallback={<Paper sx={{ height: 44, width: '100%', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }} />}>
                            <RankingSearch defaultValue={searchQuery} />
                        </Suspense>
                    </Box>

                    {/* Right: Socials */}
                    <Box sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        justifyContent: { xs: 'center', md: 'flex-end' },
                        width: '100%',
                        order: { xs: 2, md: 3 }
                    }}>
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
                                                boxShadow: `0 5px 15px ${alpha(s.color, 0.2)}`
                                            },
                                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                        }}
                                    >
                                        <s.icon sx={{ fontSize: { xs: 18, md: 20 } }} />
                                    </IconButton>
                                </Tooltip>
                            ))}
                        </Stack>
                    </Box>
            </Box>

            {/* Hall of Fame */}
            <SatrHallOfFame champions={champions} />

            <Box sx={{ position: 'relative' }}>
                <SatrTabs mode={mode} totalBladers={globalStats.totalBladers} totalMatches={globalStats.totalMatches} />

                {lastUpdate?.updatedAt && (
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            position: 'absolute',
                            top: { xs: -15, md: -20 },
                            right: 8,
                            color: 'rgba(255,255,255,0.3)', 
                            fontStyle: 'italic',
                            fontWeight: 600,
                            fontSize: { xs: '0.55rem', md: '0.65rem' },
                            letterSpacing: 0.5,
                            textTransform: 'uppercase'
                        }}
                    >
                        Sync: {lastUpdate.updatedAt.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                )}

                <Box sx={{ mt: { xs: 1, md: 2 } }}>
                    {mode === 'career' && <SatrCharts bladers={rankingData.items as any[]} />}
                    
                    {mode === 'ranking' ? (
                        <SatrTable rankings={rankingData.items as any[]} totalPages={totalPages} currentPage={page} totalCount={rankingData.total} />
                    ) : (
                        <SatrBladersTable bladers={rankingData.items as any[]} totalPages={totalPages} currentPage={page} totalCount={rankingData.total} />
                    )}
                </Box>
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 6, opacity: 0.2, letterSpacing: 2, fontWeight: 900, fontSize: { xs: '0.6rem', md: '0.75rem' } }}>
                SUN AFTER THE REIGN • BEYBLADE BATTLE TOURNAMENT
            </Typography>
        </Container>
    </Box>
  );
}
