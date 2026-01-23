import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import { getBotApiUrl, BOT_API_KEY } from '@/lib/bot-config';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hubChallenge = searchParams.get('hub.challenge');
  const hubMode = searchParams.get('hub.mode');

  // Verify the subscription
  if (hubMode === 'subscribe' && hubChallenge) {
    return new NextResponse(hubChallenge, { status: 200 });
  }

  return new NextResponse('Invalid request', { status: 400 });
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    
    // Parse Atom feed XML
    const result = await parseStringPromise(body, { explicitArray: false });
    
    if (!result?.feed?.entry) {
      // Often strictly just verification/update without content or malformed
      return new NextResponse('No entry found', { status: 200 });
    }

    const entry = result.feed.entry;
    
    // Check if it's a new video or update
    // Typically we look for 'yt:videoId'
    const videoId = entry['yt:videoId'];
    const channelId = entry['yt:channelId'];
    const title = entry.title;
    const authorName = entry.author?.name;
    const published = entry.published;
    const updated = entry.updated;

    // Filter out updates if needed (e.g. if published !== updated substantially, it might be an edit)
    // For now, we forward everything to the bot and let it decide or just notify
    
    const event = {
      type: 'video.upload',
      videoId,
      channelId,
      title,
      authorName,
      published,
      updated,
      url: `https://www.youtube.com/watch?v=${videoId}`
    };

    console.log(`YouTube Notification: ${title} by ${authorName}`);

    // Notify the bot
    const botApiUrl = getBotApiUrl();
    await fetch(`${botApiUrl}/api/webhook/youtube`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': BOT_API_KEY,
      },
      body: JSON.stringify({ event }),
    });

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('YouTube Webhook Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
