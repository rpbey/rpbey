/**
 * Bot configuration utilities.
 * Handles production/development URL switching and internal Docker networking.
 */

export function getBotApiUrl() {
  const url = process.env.BOT_API_URL;
  
  if (url) {
    // If in production Docker, if it points to localhost but we're in a container, 
    // it MUST point to the other container name for the internal network.
    if (process.env.NODE_ENV === 'production' && (url.includes('localhost') || url.includes('127.0.0.1'))) {
      return 'http://rpb-bot:3001';
    }
    return url;
  }

  // Fallbacks
  if (process.env.NODE_ENV === 'production') {
    return 'http://rpb-bot:3001';
  }
  
  return 'http://localhost:3001';
}

export const BOT_API_KEY = process.env.BOT_API_KEY || '';
