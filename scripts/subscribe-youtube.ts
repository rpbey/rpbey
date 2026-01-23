import { fetch } from 'undici';

const CHANNEL_ID = 'UCHiDwWI-2uQrsUiJhXt6rng'; // RPB Channel ID
const TOPIC_URL = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const HUB_URL = 'https://pubsubhubbub.appspot.com/subscribe';
const CALLBACK_URL = 'https://rpbey.fr/api/webhooks/youtube';

async function subscribeToYouTube() {
  console.log(`Subscribing to YouTube notifications for channel ${CHANNEL_ID}...`);
  console.log(`Callback URL: ${CALLBACK_URL}`);

  const params = new URLSearchParams();
  params.append('hub.mode', 'subscribe');
  params.append('hub.topic', TOPIC_URL);
  params.append('hub.callback', CALLBACK_URL);
  params.append('hub.verify', 'sync');
  // Lease for 10 days (max is usually around that for PSHB)
  params.append('hub.lease_seconds', '864000');

  try {
    const response = await fetch(HUB_URL, {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.status === 202 || response.status === 204 || response.status === 200) {
      console.log('✅ Subscription request sent successfully!');
      console.log('YouTube (Google PubSubHubbub) will now verify the intent by calling your webhook.');
      console.log('Ensure your production server is deployed and accessible.');
    } else {
      console.error(`❌ Subscription failed with status: ${response.status}`);
      const text = await response.text();
      console.error('Response:', text);
    }
  } catch (error) {
    console.error('❌ Error sending subscription request:', error);
  }
}

subscribeToYouTube();
