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
    // In production, we expect the ENV var to be set.
    // If not, we can't guess the Host IP easily, but we'll try localhost
    // in case the container uses host networking (unlikely but possible).
    console.warn(
      'Warning: BOT_API_URL is not set in production. Defaulting to http://localhost:3001',
    );
    return 'http://localhost:3001';
  }

  return 'http://localhost:3001';
}

export const BOT_API_KEY = process.env.BOT_API_KEY || '';
