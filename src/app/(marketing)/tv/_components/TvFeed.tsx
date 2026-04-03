'use client';

import {
  Box,
  Grid,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Suspense, use, useState } from 'react';
import type { BeyTubeVideo } from '@/lib/beytube';
import type { TikTokVideo } from '@/lib/tiktok';
import type { VideoInfo } from '@/lib/twitch';
import { MediaCard } from './MediaCard';
import { TikTokVideoCard } from './TikTokVideoCard';
import { VideoPlayerModal } from './VideoPlayerModal';
import { YouTubeMobileCard } from './YouTubeMobileCard';

interface TvFeedProps {
  clipsPromise: Promise<VideoInfo[]>;
  rpbVideosPromise: Promise<VideoInfo[]>;
  beyTubeVideosPromise: Promise<BeyTubeVideo[]>;
  tikTokVideosPromise: Promise<TikTokVideo[]>;
  domain: string;
}

function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid key={i} size={{ xs: 6, md: 3 }}>
          <Skeleton
            variant="rectangular"
            sx={{ aspectRatio: '16/9', borderRadius: 2 }}
          />
          <Skeleton width="80%" sx={{ mt: 1 }} />
          <Skeleton width="50%" />
        </Grid>
      ))}
    </Grid>
  );
}

function ClipsGrid({
  promise,
  onVideoClick,
}: {
  promise: Promise<VideoInfo[]>;
  onVideoClick: (v: VideoInfo) => void;
}) {
  const clips = use(promise);
  if (clips.length === 0) {
    return (
      <Typography textAlign="center" color="text.secondary" py={4}>
        Aucun clip disponible.
      </Typography>
    );
  }
  return (
    <Grid container spacing={{ xs: 1.5, md: 2 }}>
      {clips.map((clip) => (
        <Grid key={clip.id} size={{ xs: 6, sm: 4, md: 3 }}>
          <MediaCard
            video={clip}
            type="twitch"
            onClick={() => onVideoClick(clip)}
          />
        </Grid>
      ))}
    </Grid>
  );
}

function VideosGrid({
  promise,
  onVideoClick,
}: {
  promise: Promise<VideoInfo[]>;
  onVideoClick: (v: VideoInfo) => void;
}) {
  const videos = use(promise);
  if (videos.length === 0) {
    return (
      <Typography textAlign="center" color="text.secondary" py={4}>
        Aucune rediffusion disponible.
      </Typography>
    );
  }
  return (
    <Grid container spacing={{ xs: 1.5, md: 2 }}>
      {videos.map((video) => (
        <Grid key={video.id} size={{ xs: 6, sm: 4, md: 3 }}>
          <MediaCard
            video={video}
            type="youtube"
            onClick={() => onVideoClick(video)}
          />
        </Grid>
      ))}
    </Grid>
  );
}

function BeyTubeGrid({ promise }: { promise: Promise<BeyTubeVideo[]> }) {
  const videos = use(promise);
  if (videos.length === 0) {
    return (
      <Typography textAlign="center" color="text.secondary" py={4}>
        Aucune vidéo communautaire disponible.
      </Typography>
    );
  }
  return (
    <Grid container spacing={{ xs: 1.5, md: 2 }}>
      {videos.map((video) => (
        <Grid key={video.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <YouTubeMobileCard
            video={{
              title: video.title,
              thumbnail: video.thumbnail,
              duration: video.duration || '0:00',
              channelName: video.channelName,
              channelAvatar: video.channelAvatar,
              views: video.views,
              ago: video.ago || 'Récemment',
              url: video.url,
            }}
          />
        </Grid>
      ))}
    </Grid>
  );
}

function TikTokGrid({ promise }: { promise: Promise<TikTokVideo[]> }) {
  const videos = use(promise);
  if (videos.length === 0) {
    return (
      <Typography textAlign="center" color="text.secondary" py={4}>
        Aucune vidéo TikTok disponible.
      </Typography>
    );
  }
  return (
    <Grid container spacing={{ xs: 1.5, md: 2 }}>
      {videos.map((video) => (
        <Grid key={video.id} size={{ xs: 6, sm: 4, md: 3 }}>
          <TikTokVideoCard video={video} />
        </Grid>
      ))}
    </Grid>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="subtitle2"
      fontWeight="900"
      sx={{
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontSize: { xs: '0.75rem', md: '0.8rem' },
        color: 'rgba(255,255,255,0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        '&::before': {
          content: '""',
          width: 3,
          height: 16,
          bgcolor: 'primary.main',
          borderRadius: 1,
        },
      }}
    >
      {children}
    </Typography>
  );
}

export function TvFeed({
  clipsPromise,
  rpbVideosPromise,
  beyTubeVideosPromise,
  tikTokVideosPromise,
  domain,
}: TvFeedProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tab, setTab] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null);
  const [videoType, setVideoType] = useState<'twitch' | 'youtube' | null>(null);

  const handleVideoClick = (video: VideoInfo, type: 'twitch' | 'youtube') => {
    setSelectedVideo(video);
    setVideoType(type);
  };

  const sections = [
    {
      label: 'Clips',
      content: (
        <Suspense fallback={<CardSkeleton />}>
          <ClipsGrid
            promise={clipsPromise}
            onVideoClick={(v) => handleVideoClick(v, 'twitch')}
          />
        </Suspense>
      ),
    },
    {
      label: 'Rediffusions',
      content: (
        <Suspense fallback={<CardSkeleton />}>
          <VideosGrid
            promise={rpbVideosPromise}
            onVideoClick={(v) => handleVideoClick(v, 'youtube')}
          />
        </Suspense>
      ),
    },
    {
      label: 'BeyTube',
      content: (
        <Suspense fallback={<CardSkeleton count={3} />}>
          <BeyTubeGrid promise={beyTubeVideosPromise} />
        </Suspense>
      ),
    },
    {
      label: 'TikTok',
      content: (
        <Suspense fallback={<CardSkeleton />}>
          <TikTokGrid promise={tikTokVideosPromise} />
        </Suspense>
      ),
    },
  ];

  if (isMobile) {
    // Mobile: tabs
    return (
      <Box sx={{ pb: 10 }}>
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            mb: 2,
            position: 'sticky',
            top: { xs: 56, md: 64 },
            bgcolor: 'background.default',
            zIndex: 100,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 800,
                textTransform: 'uppercase',
                fontSize: '0.72rem',
                minHeight: 40,
                letterSpacing: 0.5,
              },
            }}
          >
            {sections.map((s) => (
              <Tab key={s.label} label={s.label} />
            ))}
          </Tabs>
        </Box>
        {sections[tab]?.content}
        <VideoPlayerModal
          open={!!selectedVideo}
          video={selectedVideo}
          type={videoType}
          onClose={() => setSelectedVideo(null)}
          domain={domain}
        />
      </Box>
    );
  }

  // Desktop: all sections stacked with grids
  return (
    <Stack spacing={5} sx={{ pb: 10 }}>
      {sections.map((section) => (
        <Box key={section.label}>
          <SectionTitle>{section.label}</SectionTitle>
          <Box sx={{ mt: 2 }}>{section.content}</Box>
        </Box>
      ))}
      <VideoPlayerModal
        open={!!selectedVideo}
        video={selectedVideo}
        type={videoType}
        onClose={() => setSelectedVideo(null)}
        domain={domain}
      />
    </Stack>
  );
}
