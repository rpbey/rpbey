import { AppTokenAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';

const clientId = process.env.TWITCH_CLIENT_ID || '';
const clientSecret = process.env.TWITCH_CLIENT_SECRET || '';
const webhookSecret = process.env.TWITCH_WEBHOOK_SECRET || '';
const callbackUrl = 'https://rpbey.fr/api/webhooks/twitch';
const userId = '1405148866'; // tv_rpb

async function subscribe() {
  if (!clientId || !clientSecret || !webhookSecret) {
    console.error('Missing Twitch credentials or webhook secret');
    return;
  }

  const authProvider = new AppTokenAuthProvider(clientId, clientSecret);
  const apiClient = new ApiClient({ authProvider });

  try {
    // Delete existing subscriptions to avoid duplicates
    const subs = await apiClient.eventSub.getSubscriptions();
    for (const sub of subs.data) {
      if (sub.type === 'stream.online' && (sub.condition as Record<string, unknown>).broadcaster_user_id === userId) {
        console.log(`Deleting existing subscription ${sub.id}`);
        await apiClient.eventSub.deleteSubscription(sub.id);
      }
    }

    // Create new subscription
    const subscription = await apiClient.eventSub.subscribeToStreamOnlineEvents(userId, {
      method: 'webhook',
      callback: callbackUrl,
      secret: webhookSecret,
    });

    console.log('Successfully subscribed to stream.online events');
    console.log('Subscription ID:', subscription.id);
    console.log('Status:', subscription.status);
  } catch (error) {
    console.error('Failed to subscribe:', error);
  }
}

subscribe();
