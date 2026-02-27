import { GetUserPosts } from '@tobyg74/tiktok-api-dl';

async function test() {
  console.log('Testing TikTok fetch...');
  try {
    const result = await GetUserPosts('rpbeyblade1');
    console.log('Result status:', result.status);
    if (result.result) {
      console.log('Found', result.result.length, 'videos');
    } else {
      console.log('No result data');
    }
  } catch (e) {
    console.error('Fetch failed:', e);
  }
}

test();
