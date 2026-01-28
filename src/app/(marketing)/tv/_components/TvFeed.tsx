'use client';

import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';
import type { BeyTubeVideo } from '@/lib/beytube';
import type { VideoInfo } from '@/lib/twitch';
import { MediaCard } from './MediaCard';
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
  const [tab, setTab] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null);
  const [videoType, setVideoType] = useState<'twitch' | 'youtube' | null>(null);

  const handleVideoClick = (video: VideoInfo, type: 'twitch' | 'youtube') => {
    setSelectedVideo(video);
    setVideoType(type);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', width: '100%' }}>
      {/* Sticky Tabs Header */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 3,
          position: 'sticky',
          top: { xs: 56, md: 64 }, // Adjust for Navbar height
          bgcolor: 'background.default',
          zIndex: 100,
          pt: 1,
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
              fontSize: '0.9rem',
            },
          }}
        >
          <Tab label="Clips" />
          <Tab label="RPB" />
          <Tab label="BeyTube" />
        </Tabs>
      </Box>

      <Stack spacing={3} sx={{ pb: 10 }}>
        {/* TAB 0: CLIPS TWITCH */}
        {tab === 0 && (
          <>
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
          </>
        )}

        {/* TAB 1: VIDEOS RPB */}
        {tab === 1 && (
          <>
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
          </>
        )}

        {/* TAB 2: BEYTUBE FR */}
        {tab === 2 && (
          <>
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
          </>
        )}
      </Stack>

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
