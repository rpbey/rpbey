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
    // Use the Docker gateway IP to reach the bot service running on the host.
    return 'http://172.17.0.1:3001';
  }

  return 'http://localhost:3001';
}

export const BOT_API_KEY = process.env.BOT_API_KEY || '';
