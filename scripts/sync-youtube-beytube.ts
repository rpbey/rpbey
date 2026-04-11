import { google } from 'googleapis';
import { prisma } from '../src/lib/prisma.js'; // Use .js extension for ESM or let tsx handle it? tsx usually handles .ts. 
// But if I use relative import to src, I might hit issues with other imports inside src/lib/prisma.
// Let's try to replicate the init logic locally in the script to avoid dependency hell.
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const youtube = google.youtube('v3');
const apiKey = process.env.YOUTUBE_API_KEY;

const CHANNELS = [
  { id: 'UCHiDwWI-2uQrsUiJhXt6rng', name: 'RPB' },
  { id: 'UCaGPpRP8MJzc5s8WGOD4jLw', name: 'Le Purgatoire de Ryuk' },
  { id: 'UC7kNAYs7r27OAX0JLjkSt0g', name: 'Skarn Game Master' },
  { id: 'UCu3yEYIoXsNqjGzlAxWRcLw', name: 'Scale Emperors' },
  { id: 'UCm3y-lCQUOM6Vj52LSoLTvA', name: 'Sun After The Reign' }
];

async function sync() {
  if (!apiKey) {
    console.error('Missing YOUTUBE_API_KEY');
    process.exit(1);
  }

  console.log('🔄 Syncing BeyTube channels...');

  // 1. Get Uploads Playlist IDs
  const channelIds = CHANNELS.map(c => c.id);
  const channelsRes = await youtube.channels.list({
    key: apiKey,
    part: ['contentDetails', 'snippet'],
    id: channelIds
  });

  const uploadsMap = new Map<string, string>(); // ChannelID -> UploadsPlaylistID
  const avatarMap = new Map<string, string>(); // ChannelID -> Avatar URL

  for (const item of channelsRes.data.items || []) {
    if (item.contentDetails?.relatedPlaylists?.uploads) {
      uploadsMap.set(item.id!, item.contentDetails.relatedPlaylists.uploads);
    }
    if (item.snippet?.thumbnails?.default?.url) {
      avatarMap.set(item.id!, item.snippet.thumbnails.default.url);
    }
  }

  // 2. Fetch latest video ID from each playlist
  const videoIds: string[] = [];
  
  for (const channel of CHANNELS) {
    const playlistId = uploadsMap.get(channel.id);
    if (!playlistId) continue;

    try {
      let nextPageToken: string | undefined;
      do {
        const plRes = await youtube.playlistItems.list({
          key: apiKey,
          part: ['contentDetails'],
          playlistId,
          maxResults: 50,
          pageToken: nextPageToken,
        });
        for (const item of plRes.data.items || []) {
          const videoId = item.contentDetails?.videoId;
          if (videoId) videoIds.push(videoId);
        }
        nextPageToken = plRes.data.nextPageToken ?? undefined;
      } while (nextPageToken);
    } catch (e) {
      console.error(`Error fetching playlist for ${channel.name}:`, e);
    }
  }

  if (videoIds.length === 0) {
    console.log('No videos found.');
    return;
  }

  // 3. Fetch Video Details in batches of 50
  const allVideoItems: typeof import('googleapis').youtube_v3.Schema$Video[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const videosRes = await youtube.videos.list({
      key: apiKey,
      part: ['snippet', 'statistics', 'contentDetails'],
      id: batch,
    });
    allVideoItems.push(...(videosRes.data.items || []));
  }
  console.log(`Fetched details for ${allVideoItems.length} videos`);

  // 4. Upsert into DB
  // First, clear existing featured videos? 
  // The prompt implies "fetching the most recent". 
  // I will clear the table or just upsert.
  // Actually, I'll delete all and insert new ones to keep it clean if we only want the absolute latest.
  // Or upsert and then in the UI we sort by date.
  
  // Let's upsert.
  
  for (const item of allVideoItems) {
    const durationRaw = item.contentDetails?.duration || '';
    const match = durationRaw.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const duration = match
      ? `${match[2] ? match[2].replace('M', 'm ') : ''}${match[3] ? match[3].replace('S', 's') : ''}`.trim()
      : '';

    const viewCount = parseInt(item.statistics?.viewCount || '0');
    
    await prisma.youTubeVideo.upsert({
      where: { id: item.id! },
      update: {
        title: item.snippet?.title || '',
        channelName: item.snippet?.channelTitle || '',
        channelId: item.snippet?.channelId || '',
        channelAvatar: avatarMap.get(item.snippet?.channelId || '') || '',
        views: viewCount,
        thumbnail: item.snippet?.thumbnails?.maxres?.url || item.snippet?.thumbnails?.high?.url || '',
        url: `https://youtube.com/watch?v=${item.id}`,
        duration,
        publishedAt: new Date(item.snippet?.publishedAt || new Date()),
        isFeatured: true
      },
      create: {
        id: item.id!,
        title: item.snippet?.title || '',
        channelName: item.snippet?.channelTitle || '',
        channelId: item.snippet?.channelId || '',
        channelAvatar: avatarMap.get(item.snippet?.channelId || '') || '',
        views: viewCount,
        thumbnail: item.snippet?.thumbnails?.maxres?.url || item.snippet?.thumbnails?.high?.url || '',
        url: `https://youtube.com/watch?v=${item.id}`,
        duration,
        publishedAt: new Date(item.snippet?.publishedAt || new Date()),
        isFeatured: true
      }
    });
    
    console.log(`✅ Synced: ${item.snippet?.title}`);
  }

  console.log('Done.');
}

sync()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
