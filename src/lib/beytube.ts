'use server';

import { google } from 'googleapis';

const youtube = google.youtube('v3');

// IDs réels validés des vidéos les plus populaires/représentatives
const FEATURED_VIDEO_IDS = [
  'EJdXaxwyNKI', // Le Purgatoire de Ryuk
  'Eynk56Fm0Bc', // Skarn GameMaster
  '0Bg1F4T0OgE', // Scale Emperors
  'S8N9IoJD5SI', // Sun After The Reign
];

export interface BeyTubeVideo {
  id: string;
  title: string;
  channelName: string;
  channelAvatar?: string;
  views: number;
  thumbnail: string;
  url: string;
  duration?: string;
  ago?: string;
}

export async function getBeyTubeFeatured(): Promise<BeyTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error('[BeyTube] Missing YOUTUBE_API_KEY in environment');
    return [];
  }

  try {
    const response = await youtube.videos.list({
      key: apiKey,
      part: ['snippet', 'statistics', 'contentDetails'],
      id: FEATURED_VIDEO_IDS,
    });

    if (!response.data.items) return [];

    // 1. Collecter les IDs de chaînes uniques
    const channelIds = [
      ...new Set(
        response.data.items
          .map((item) => item.snippet?.channelId)
          .filter(Boolean) as string[],
      ),
    ];

    // 2. Récupérer les infos des chaînes (pour l'avatar)
    const channelsResponse = await youtube.channels.list({
      key: apiKey,
      part: ['snippet'],
      id: channelIds,
    });

    const channelAvatars = new Map<string, string>();
    channelsResponse.data.items?.forEach((channel) => {
      if (channel.id && channel.snippet?.thumbnails?.default?.url) {
        channelAvatars.set(channel.id, channel.snippet.thumbnails.default.url);
      }
    });

    return response.data.items.map((item) => {
      // Simple ISO 8601 duration parser (PT#M#S -> #m #s)
      const durationRaw = item.contentDetails?.duration || '';
      const match = durationRaw.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      const duration = match
        ? `${match[2] ? match[2].replace('M', 'm ') : ''}${match[3] ? match[3].replace('S', 's') : ''}`.trim()
        : '';

      const channelId = item.snippet?.channelId;
      const channelAvatar = channelId
        ? channelAvatars.get(channelId)
        : undefined;

      return {
        id: item.id!,
        title: item.snippet?.title || 'Sans titre',
        channelName: item.snippet?.channelTitle || 'Chaîne inconnue',
        channelAvatar,
        views: parseInt(item.statistics?.viewCount || '0'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thumbnail:
          (item.snippet?.thumbnails as any)?.maxresdefault?.url ||
          item.snippet?.thumbnails?.high?.url ||
          '',
        url: `https://youtube.com/watch?v=${item.id}`,
        duration,
        ago: 'Populaire',
      };
    });
  } catch (e) {
    console.error('[BeyTube] YouTube API Error:', e);
    return [];
  }
}
