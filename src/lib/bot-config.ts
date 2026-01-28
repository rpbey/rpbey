/**
 * Bot configuration utilities.
 * Handles production/development URL switching and internal Docker networking.
 */

export function getBotApiUrl() {
  const url = process.env.BOT_API_URL;

  // In production, we must avoid using localhost/127.0.0.1 as it refers to the container
  if (process.env.NODE_ENV === 'production') {
    if (url && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      return url;
    }
    // Fallback to Host Public IP for reliability
    return 'http://46.224.145.55:3001';
  }

  if (url) {
    return url;
  }

  return 'http://localhost:3001';
}

export const BOT_API_KEY = process.env.BOT_API_KEY || '';
