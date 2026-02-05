import { io, type Socket } from 'socket.io-client';

export const BOT_SOCKET_URL =
  process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001';

// Shared socket instance
let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(BOT_SOCKET_URL, {
      autoConnect: false, // Wait for provider
      reconnection: true,
      auth: {
        token: process.env.NEXT_PUBLIC_BOT_API_KEY, // Exposed or fetched via server action
      },
    });
  }
  return socket;
};
