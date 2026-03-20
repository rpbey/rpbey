'use client';

import { Download, Language, OndemandVideo } from '@mui/icons-material';
import { Box, Button, Chip, Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { EpisodePlayerWrapper } from './EpisodePlayerWrapper';

interface Source {
  id: string;
  type: string;
  url: string;
  quality: string;
  language: string;
  priority: number;
}

interface EpisodeViewerProps {
  title: string;
  sources: Source[];
  savedProgress: number;
  episodeId: string;
  duration: number;
}

const SOURCE_LABELS: Record<string, string> = {
  YOUTUBE: 'YouTube',
  DAILYMOTION: 'Dailymotion',
  MP4: 'MP4',
  HLS: 'HLS',
  IFRAME: 'Lecteur',
};

function getSourceLabel(source: Source): string {
  const url = source.url;
  if (url.includes('sibnet.ru')) return 'Sibnet';
  if (url.includes('vidmoly.net')) return 'VidMoly';
  if (url.includes('vk.com')) return 'VK Video';
  if (url.includes('dailymotion.com')) return 'Dailymotion';
  if (url.includes('youtube.com') || source.type === 'YOUTUBE')
    return 'YouTube';
  if (url.includes('drive.google.com')) return 'Google Drive';
  if (url.includes('sendvid.com')) return 'SendVid';
  return SOURCE_LABELS[source.type] || 'Lecteur';
}

function isDownloadSource(source: Source): boolean {
  return source.url.includes('drive.google.com/uc?export=download');
}

function getPlayerSrc(source: Source): string {
  if (source.type === 'YOUTUBE' && !source.url.includes('youtube.com')) {
    return `youtube/${source.url}`;
  }
  return source.url;
}

export function EpisodeViewer({
  title,
  sources,
  savedProgress,
  episodeId,
  duration,
}: EpisodeViewerProps) {
  // Separate streaming sources from download links
  const streamingSources = sources.filter((s) => !isDownloadSource(s));
  const downloadSources = sources.filter(isDownloadSource);

  // Available languages
  const languages = [...new Set(streamingSources.map((s) => s.language))];
  const [selectedLang, setSelectedLang] = useState(
    languages.includes('VOSTFR') ? 'VOSTFR' : languages[0] || 'VOSTFR',
  );

  // Filter by language
  const langSources = streamingSources.filter(
    (s) => s.language === selectedLang,
  );

  // Active source index
  const [activeIdx, setActiveIdx] = useState(0);
  const activeSource = langSources[activeIdx] || langSources[0];

  if (!activeSource) {
    return (
      <Box
        sx={{
          aspectRatio: '16/9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#111',
          borderRadius: { xs: 0, md: 3 },
        }}
      >
        <Typography color="text.secondary">
          Aucune source disponible pour cet épisode.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Player */}
      <EpisodePlayerWrapper
        title={title}
        src={getPlayerSrc(activeSource)}
        sourceType={activeSource.type}
        savedProgress={savedProgress}
        episodeId={episodeId}
        duration={duration}
      />

      {/* Controls bar */}
      <Box
        sx={{
          mt: 1.5,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        {/* Language selector */}
        {languages.length > 1 && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Language sx={{ color: 'text.secondary', fontSize: 18 }} />
            {languages.map((lang) => (
              <Chip
                key={lang}
                label={lang}
                size="small"
                onClick={() => {
                  setSelectedLang(lang);
                  setActiveIdx(0);
                }}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  bgcolor:
                    selectedLang === lang
                      ? '#dc2626'
                      : 'rgba(255,255,255,0.08)',
                  color: selectedLang === lang ? 'white' : 'text.secondary',
                  '&:hover': {
                    bgcolor:
                      selectedLang === lang
                        ? '#dc2626'
                        : 'rgba(255,255,255,0.15)',
                  },
                }}
              />
            ))}
          </Stack>
        )}

        {/* Source selector */}
        {langSources.length > 1 && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <OndemandVideo sx={{ color: 'text.secondary', fontSize: 18 }} />
            {langSources.map((src, i) => (
              <Chip
                key={src.id}
                label={getSourceLabel(src)}
                size="small"
                onClick={() => setActiveIdx(i)}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  bgcolor:
                    activeIdx === i
                      ? 'rgba(255,255,255,0.15)'
                      : 'rgba(255,255,255,0.05)',
                  color: activeIdx === i ? 'white' : 'text.secondary',
                  border:
                    activeIdx === i
                      ? '1px solid rgba(255,255,255,0.3)'
                      : '1px solid transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.12)',
                  },
                }}
              />
            ))}
          </Stack>
        )}

        {/* Quality badge */}
        {activeSource.quality && activeSource.quality !== '720p' && (
          <Chip
            label={activeSource.quality}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.65rem',
              bgcolor: 'rgba(255,255,255,0.05)',
              color: 'text.secondary',
            }}
          />
        )}

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Download button */}
        {downloadSources.length > 0 && (
          <Tooltip title="Télécharger (Google Drive)">
            <Button
              component="a"
              href={downloadSources[0]?.url}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              startIcon={<Download />}
              sx={{
                color: 'text.secondary',
                fontSize: '0.75rem',
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.08)',
                  color: 'white',
                },
              }}
            >
              Télécharger
            </Button>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
