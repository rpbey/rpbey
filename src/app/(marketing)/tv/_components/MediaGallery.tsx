'use client';

import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import VideocamIcon from '@mui/icons-material/Videocam';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useState } from 'react';
import type { VideoInfo } from '@/lib/twitch';
import { MediaCard } from './MediaCard';
import { VideoPlayerModal } from './VideoPlayerModal';

interface MediaGalleryProps {
  clips: VideoInfo[];
  youtubeVideos: VideoInfo[];
  domain: string;
}

export function MediaGallery({
  clips,
  youtubeVideos,
  domain,
}: MediaGalleryProps) {
  const [tab, setTab] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null);
  const [videoType, setVideoType] = useState<'twitch' | 'youtube' | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleVideoClick = (video: VideoInfo, type: 'twitch' | 'youtube') => {
    setSelectedVideo(video);
    setVideoType(type);
  };

  const handleClose = () => {
    setSelectedVideo(null);
    setVideoType(null);
  };

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          aria-label="media gallery tabs"
          textColor="secondary"
          indicatorColor="secondary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
            },
          }}
        >
          <Tab
            icon={<VideocamIcon />}
            iconPosition="start"
            label="Clips Twitch"
          />
          <Tab
            icon={<OndemandVideoIcon />}
            iconPosition="start"
            label="Vidéos YouTube"
          />
        </Tabs>
      </Box>

      {/* Twitch Clips Grid */}
      <Box role="tabpanel" hidden={tab !== 0}>
        {tab === 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)', // Force 2 columns on mobile
                sm: 'repeat(auto-fill, minmax(220px, 1fr))',
                md: 'repeat(auto-fill, minmax(280px, 1fr))',
              },
              gap: { xs: 1, sm: 2 },
            }}
          >
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
              <Box
                sx={{
                  gridColumn: '1 / -1',
                  py: 4,
                  textAlign: 'center',
                  color: 'text.secondary',
                }}
              >
                Aucun clip disponible pour le moment.
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* YouTube Videos Grid */}
      <Box role="tabpanel" hidden={tab !== 1}>
        {tab === 1 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)', // Force 2 columns on mobile
                sm: 'repeat(auto-fill, minmax(220px, 1fr))',
                md: 'repeat(auto-fill, minmax(280px, 1fr))',
              },
              gap: { xs: 1, sm: 2 },
            }}
          >
            {youtubeVideos.length > 0 ? (
              youtubeVideos.map((video) => (
                <MediaCard
                  key={video.id}
                  video={video}
                  type="youtube"
                  onClick={() => handleVideoClick(video, 'youtube')}
                />
              ))
            ) : (
              <Box
                sx={{
                  gridColumn: '1 / -1',
                  py: 4,
                  textAlign: 'center',
                  color: 'text.secondary',
                }}
              >
                Aucune vidéo disponible pour le moment.
              </Box>
            )}
          </Box>
        )}
      </Box>

      <VideoPlayerModal
        open={!!selectedVideo}
        video={selectedVideo}
        type={videoType}
        onClose={handleClose}
        domain={domain}
      />
    </Box>
  );
}
