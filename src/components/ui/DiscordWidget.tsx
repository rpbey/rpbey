'use client';

import { Box, Skeleton } from '@mui/material';
import { useState } from 'react';

export function DiscordWidget() {
  const [loading, setLoading] = useState(true);

  return (
    <Box
      sx={{
        width: 350,
        height: 500,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        bgcolor: 'rgba(0,0,0,0.2)',
      }}
    >
      {loading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{ position: 'absolute', inset: 0 }}
        />
      )}
      <iframe
        src="https://discord.com/widget?id=1319715782032228463&theme=dark"
        width="100%"
        height="100%"
        allowTransparency={true}
        frameBorder="0"
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        onLoad={() => setLoading(false)}
        title="Discord Widget"
      />
    </Box>
  );
}