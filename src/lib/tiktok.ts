import { GetUserPosts } from '@tobyg74/tiktok-api-dl';
import { cacheLife } from 'next/cache';

export interface TikTokVideo {
  id: string;
  desc: string;
  createTime: number;
  cover: string;
  playUrl: string;
  author: {
    username: string;
    nickname: string;
    avatarThumb: string;
  };
  stats: {
    playCount: number;
    diggCount: number;
  };
  url: string;
}

export async function getTikTokVideos(username: string): Promise<TikTokVideo[]> {
  'use cache';
  cacheLife('hours');

  try {
    const result = await GetUserPosts(username);
    
    if (result.status !== 'success' || !result.result) {
      console.error(`Failed to fetch TikTok posts for ${username}:`, result);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.result.slice(0, 12).map((post: any) => ({
      id: post.id,
      desc: post.desc,
      createTime: post.createTime,
      cover: post.video.dynamicCover || post.video.cover,
      playUrl: post.video.playAddr,
      author: {
        username: post.author.username,
        nickname: post.author.nickname,
        avatarThumb: post.author.avatarThumb,
      },
      stats: {
        playCount: post.stats.playCount,
        diggCount: post.stats.diggCount,
      },
      url: `https://www.tiktok.com/@${post.author.username}/video/${post.id}`,
    }));
  } catch (error) {
    console.error(`Error fetching TikTok videos for ${username}:`, error);
    return [];
  }
}
