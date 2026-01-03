import { ApiClient } from '@twurple/api';
import { AppTokenAuthProvider } from '@twurple/auth';

const clientId = process.env.TWITCH_CLIENT_ID || '';
const clientSecret = process.env.TWITCH_CLIENT_SECRET || '';
const channelName = process.env.NEXT_PUBLIC_TWITCH_CHANNEL || 'tv_rpb';

// Initialize the Auth Provider
// Note: This uses App Access Token (Server-to-Server), which is read-only for most user data.
// It cannot update stream titles or tags.
const authProvider = new AppTokenAuthProvider(clientId, clientSecret);

// Initialize the API Client
export const twitchClient = new ApiClient({ authProvider });

export interface StreamInfo {
  isLive: boolean;
  title?: string;
  gameName?: string;
  viewerCount?: number;
  startedAt?: Date;
  thumbnailUrl?: string;
  userName: string;
  avatarUrl?: string;
}

export async function getRPBStreamInfo(): Promise<StreamInfo | null> {
  if (!clientId || !clientSecret) {
    console.warn('Twitch credentials not set.');
    return null;
  }

  try {
    const user = await twitchClient.users.getUserByName(channelName);
    
    if (!user) {
      return null;
    }

    const stream = await twitchClient.streams.getStreamByUserId(user.id);

    return {
      isLive: !!stream,
      title: stream?.title || user.description, // Fallback to bio if offline
      gameName: stream?.gameName,
      viewerCount: stream?.viewers,
      startedAt: stream?.startDate,
      thumbnailUrl: stream?.thumbnailUrl?.replace('{width}', '1280').replace('{height}', '720'),
      userName: user.displayName,
      avatarUrl: user.profilePictureUrl,
    };
  } catch (error) {
    console.error('Error fetching Twitch data:', error);
    return null;
  }
}
