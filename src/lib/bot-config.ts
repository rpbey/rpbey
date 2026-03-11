/**
 * Bot API configuration.
 * Handles production/development URL switching and internal Docker networking.
 */
export function getBotApiUrl() {
  const url = process.env.BOT_API_URL;

  if (process.env.NODE_ENV === 'production') {
    if (url && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      return url;
    }
    return url || 'http://bot:3001';
  }

  return url || 'http://localhost:3001';
}

export const BOT_API_KEY = process.env.BOT_API_KEY ?? '';
