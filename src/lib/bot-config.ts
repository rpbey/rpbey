/**
 * Bot configuration utilities.
 * Handles production/development URL switching and internal Docker networking.
 */

export function getBotApiUrl() {
  const url = process.env.BOT_API_URL;

  if (url) {
    return url;
  }

  // Fallbacks
  if (process.env.NODE_ENV === 'production') {
    // In production (Docker), localhost refers to the container itself.
    // Use the host IP to reach the bot service running on the host.
    console.warn(
      'Warning: BOT_API_URL is not set in production. Defaulting to http://46.224.145.55:3001',
    );
    return 'http://46.224.145.55:3001';
  }

  return 'http://localhost:3001';
}

export const BOT_API_KEY = process.env.BOT_API_KEY || '';
