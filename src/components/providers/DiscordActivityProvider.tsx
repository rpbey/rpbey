'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';

interface DiscordActivityContextType {
  sdk: DiscordSDK | null;
  auth: any | null;
  status: 'loading' | 'ready' | 'error';
}

const DiscordActivityContext = createContext<DiscordActivityContextType>({
  sdk: null,
  auth: null,
  status: 'loading',
});

export const useDiscordActivity = () => useContext(DiscordActivityContext);

export function DiscordActivityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sdk, setSdk] = useState<DiscordSDK | null>(null);
  const [auth, setAuth] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

    // Allow running outside Discord iframe for testing/dev
    const inIframe =
      typeof window !== 'undefined' && window.self !== window.top;

    if (!clientId || !inIframe) {
      console.warn(
        'Discord Activity Context not detected or configured. Running in Standalone Mode.',
      );
      setStatus('ready');
      return;
    }

    const discordSdk = new DiscordSDK(clientId);

    const setup = async () => {
      try {
        await discordSdk.ready();

        // Authorize with Discord
        const { code } = await discordSdk.commands.authorize({
          client_id: clientId,
          response_type: 'code',
          state: '',
          prompt: 'none',
          scope: ['identify', 'guilds'],
        });

        // Exchange code for token (via our API)
        const response = await fetch('/api/discord/activity/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const authData = await response.json();

        // Authenticate SDK
        await discordSdk.commands.authenticate({
          access_token: authData.access_token,
        });

        setSdk(discordSdk);
        setAuth(authData);
        setStatus('ready');
      } catch (error) {
        console.error('Discord Activity Setup failed:', error);
        setStatus('error');
      }
    };

    setup();
  }, []);

  return (
    <DiscordActivityContext.Provider value={{ sdk, auth, status }}>
      {children}
    </DiscordActivityContext.Provider>
  );
}
