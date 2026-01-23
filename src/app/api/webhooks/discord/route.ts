import { verifyKey } from 'discord-interactions';
import { NextResponse } from 'next/server';

/**
 * Discord Webhook Events Handler
 * Implements the security and protocol requirements for Discord Webhook Events.
 * See: https://discord.com/developers/docs/events/webhook-events#preparing-for-events
 */

export async function POST(req: Request) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  if (!publicKey) {
    console.error('Missing DISCORD_PUBLIC_KEY in environment variables');
    return new NextResponse('Configuration Error', { status: 500 });
  }

  const signature = req.headers.get('X-Signature-Ed25519');
  const timestamp = req.headers.get('X-Signature-Timestamp');

  if (!signature || !timestamp) {
    return new NextResponse('Missing signature headers', { status: 401 });
  }

  const body = await req.text();
  const isValidRequest = verifyKey(body, signature, timestamp, publicKey);

  if (!isValidRequest) {
    return new NextResponse('Invalid request signature', { status: 401 });
  }

  const data = JSON.parse(body);

  // Handle Discord PING event
  if (data.type === 0) {
    return new NextResponse(null, { status: 204 });
  }

  // Handle actual events
  // Documentation for event types: https://discord.com/developers/docs/events/webhook-events#event-body-object-event-types
  console.log('Received Discord Webhook Event:', data.event);

  // TODO: Implement specific event logic (e.g., APPLICATION_AUTHORIZED)
  // For now, we just acknowledge receipt as required (within 3 seconds)
  return new NextResponse(null, { status: 204 });
}
