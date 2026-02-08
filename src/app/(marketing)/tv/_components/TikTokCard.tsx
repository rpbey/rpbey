'use client';

import { Box, Card } from '@mui/material';
import Script from 'next/script';
import { useEffect, useState } from 'react';

interface TikTokCardProps {
  username: string;
  url?: string;
  featuredVideoUrl?: string;
  avatarUrl?: string;
}

export function TikTokCard({ username }: TikTokCardProps) {
  // Force re-render of script on mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 4,
        bgcolor: 'background.paper',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        minHeight: 500, // Give it space for the feed
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'start',
        p: 1,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 325 }}>
        {mounted && (
          <blockquote
            className="tiktok-embed"
            cite={`https://www.tiktok.com/@${username}`}
            data-unique-id={username}
            data-embed-type="creator"
            style={{ maxWidth: 780, minWidth: 288 }}
          >
            <section>
              <a
                target="_blank"
                href={`https://www.tiktok.com/@${username}`}
                rel="noreferrer"
              >
                @{username}
              </a>
            </section>
          </blockquote>
        )}
        <Script src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />
      </Box>
    </Card>
  );
}
