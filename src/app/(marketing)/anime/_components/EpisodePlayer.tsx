'use client';

import { Box } from '@mui/material';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { useCallback, useEffect, useRef } from 'react';

interface EpisodePlayerProps {
  title: string;
  src: string;
  sourceType: string;
  savedProgress?: number;
  episodeId: string;
  duration?: number;
}

/** Sources that must be rendered as an iframe (not via Vidstack) */
const IFRAME_HOSTS = [
  'sibnet.ru',
  'vidmoly.net',
  'vk.com',
  'dailymotion.com',
  'ok.ru',
  'mail.ru',
  'myvi.ru',
  'sendvid.com',
];

function isIframeSource(src: string, sourceType: string): boolean {
  if (sourceType === 'IFRAME' || sourceType === 'DAILYMOTION') return true;
  return IFRAME_HOSTS.some((host) => src.includes(host));
}

function isYouTubeSource(src: string, sourceType: string): boolean {
  if (sourceType === 'YOUTUBE') return true;
  return (
    src.includes('youtube.com') ||
    src.includes('youtu.be') ||
    src.startsWith('youtube/')
  );
}

/** Convert any YouTube src format to a nocookie embed URL */
function getYouTubeEmbedUrl(src: string): string {
  let videoId = '';

  if (src.startsWith('youtube/')) {
    videoId = src.replace('youtube/', '');
  } else {
    const match = src.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    );
    videoId = match?.[1] ?? src;
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

export function EpisodePlayer({
  title,
  src,
  sourceType,
  savedProgress = 0,
  episodeId,
  duration: episodeDuration,
}: EpisodePlayerProps) {
  const lastReportRef = useRef(0);
  const episodeIdRef = useRef(episodeId);

  useEffect(() => {
    episodeIdRef.current = episodeId;
  }, [episodeId]);

  const reportProgress = useCallback(async (time: number, dur: number) => {
    try {
      await fetch('/api/anime/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: episodeIdRef.current,
          progressTime: Math.floor(time),
          duration: Math.floor(dur),
        }),
      });
    } catch {
      // Silently fail
    }
  }, []);

  const handleTimeUpdate = useCallback(
    (detail: { currentTime: number; duration: number }) => {
      const now = Date.now();
      if (now - lastReportRef.current < 30000) return;
      lastReportRef.current = now;
      reportProgress(
        detail.currentTime,
        detail.duration || episodeDuration || 0,
      );
    },
    [reportProgress, episodeDuration],
  );

  const handleEnded = useCallback(() => {
    reportProgress(episodeDuration || 9999, episodeDuration || 9999);
  }, [reportProgress, episodeDuration]);

  // ── Iframe player (Sibnet, VidMoly, VK, Dailymotion, etc.) ──
  if (isIframeSource(src, sourceType)) {
    return (
      <Box
        sx={{
          width: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: '#000',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%', // 16:9
          }}
        >
          <Box
            component="iframe"
            src={src}
            title={title}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </Box>
      </Box>
    );
  }

  // ── YouTube player (direct iframe to avoid bot detection) ──
  if (isYouTubeSource(src, sourceType)) {
    return (
      <Box
        sx={{
          width: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: '#000',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%', // 16:9
          }}
        >
          <Box
            component="iframe"
            src={getYouTubeEmbedUrl(src)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </Box>
      </Box>
    );
  }

  // ── Vidstack player (MP4, HLS) ──
  return (
    <Box
      sx={{
        width: '100%',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: '#000',
        '& media-player': {
          '--media-brand': '#dc2626',
          '--media-focus-ring-color': '#dc2626',
        },
      }}
    >
      <MediaPlayer
        title={title}
        src={src}
        aspectRatio="16/9"
        playsInline
        crossOrigin
        currentTime={savedProgress}
        onTimeUpdate={(detail) =>
          handleTimeUpdate(
            detail as unknown as { currentTime: number; duration: number },
          )
        }
        onEnded={handleEnded}
        style={{
          '--video-brand': '#dc2626',
          '--video-focus-ring-color': '#dc2626',
          '--video-border-radius': '12px',
        }}
      >
        <MediaProvider />
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>
    </Box>
  );
}
