import { io, type Socket } from 'socket.io-client';

// Use relative URL to leverage Next.js proxy
export const BOT_SOCKET_URL = typeof window !== 'undefined' ? '' : 'http://10.0.1.1:3001';

// Shared socket instance
let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(BOT_SOCKET_URL, {
      path: '/api/bot/socket', // Matches the Next.js rewrite
      autoConnect: false, // Wait for provider
      reconnection: true,
      auth: {
        token: process.env.NEXT_PUBLIC_BOT_API_KEY,
      },
      transports: ['polling', 'websocket'], // Force polling first for better compatibility with proxies
    });
  }
  return socket;
};
