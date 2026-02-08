'use client';

import {
  Box,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import type { BeyTubeVideo } from '@/lib/beytube';
import type { VideoInfo } from '@/lib/twitch';
import { MediaCard } from './MediaCard';
import { TikTokCard } from './TikTokCard';
import { VideoPlayerModal } from './VideoPlayerModal';
import { YouTubeMobileCard } from './YouTubeMobileCard';

interface TvFeedProps {
  clips: VideoInfo[];
  rpbVideos: VideoInfo[];
  beyTubeVideos: BeyTubeVideo[];
  domain: string;
}

export function TvFeed({
  clips,
  rpbVideos,
  beyTubeVideos,
  domain,
}: TvFeedProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [tab, setTab] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null);
  const [videoType, setVideoType] = useState<'twitch' | 'youtube' | null>(null);

  const handleVideoClick = (video: VideoInfo, type: 'twitch' | 'youtube') => {
    setSelectedVideo(video);
    setVideoType(type);
  };

  const Sections = [
    {
      label: 'Clips Twitch',
      content: (
        <Stack spacing={3}>
          {clips.length > 0 ? (
            clips.map((clip) => (
              <MediaCard
                key={clip.id}
                video={clip}
                type="twitch"
                onClick={() => handleVideoClick(clip, 'twitch')}
              />
            ))
          ) : (
            <Typography textAlign="center" color="text.secondary" py={4}>
              Aucun clip disponible.
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      label: 'Rediffusions',
      content: (
        <Stack spacing={3}>
          {rpbVideos.length > 0 ? (
            rpbVideos.map((video) => (
              <MediaCard
                key={video.id}
                video={video}
                type="youtube"
                onClick={() => handleVideoClick(video, 'youtube')}
              />
            ))
          ) : (
            <Typography textAlign="center" color="text.secondary" py={4}>
              Aucune vidéo disponible.
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      label: 'BeyTube FR',
      content: (
        <Stack spacing={3}>
          {beyTubeVideos.length > 0 ? (
            beyTubeVideos.map((video) => (
              <YouTubeMobileCard
                key={video.id}
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
            ))
          ) : (
            <Typography textAlign="center" color="text.secondary" py={4}>
              Aucune vidéo communautaire disponible.
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      label: 'TikTok RPB',
      content: (
        <Stack spacing={3}>
          <TikTokCard 
            username="skarngamemaster" 
            url="https://www.tiktok.com/@skarngamemaster"
            // Skarn is a major creator, often has recent videos
          />
          <TikTokCard 
            username="sunafterthereign" 
            url="https://www.tiktok.com/@sunafterthereign"
          />
          <TikTokCard 
            username="rpbeyblade1" 
            url="https://www.tiktok.com/@rpbeyblade1?lang=fr"
          />
        </Stack>
      ),
    },
  ];

  if (isDesktop) {
    return (
      <Box sx={{ width: '100%', mb: 10 }}>
        <Grid container spacing={3}>
          {Sections.map((section, idx) => (
            <Grid key={idx} size={{ xs: 12, md: 3 }}>
              <Typography
                variant="h6"
                fontWeight="900"
                sx={{
                  mb: 3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  fontSize: '0.9rem',
                  '&::before': {
                    content: '""',
                    width: 4,
                    height: 20,
                    bgcolor: 'primary.main',
                    borderRadius: 1,
                  },
                }}
              >
                {section.label}
              </Typography>
              <Box
                sx={{
                  maxHeight: 'calc(100vh - 200px)',
                  overflowY: 'auto',
                  pr: 1,
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'divider',
                    borderRadius: '3px',
                  },
                }}
              >
                {section.content}
              </Box>
            </Grid>
          ))}
        </Grid>

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

  // Mobile Version (Tabbed)
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', width: '100%' }}>
      {/* Sticky Tabs Header */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 3,
          position: 'sticky',
          top: { xs: 56, md: 64 },
          bgcolor: 'background.default',
          zIndex: 100,
          pt: 1,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 800,
              textTransform: 'uppercase',
              fontSize: '0.8rem',
              minWidth: 100,
            },
          }}
        >
          <Tab label="Clips" />
          <Tab label="Rediff" />
          <Tab label="BeyTube" />
          <Tab label="TikTok" />
        </Tabs>
      </Box>

      <Box sx={{ pb: 10 }}>{Sections[tab]?.content}</Box>

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

