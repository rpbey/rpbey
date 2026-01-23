'use client';

import { Box, Card, Typography } from '@mui/material';

interface DiscordWidgetProps {
  id?: string;
  theme?: 'light' | 'dark';
  width?: string | number;
  height?: string | number;
}

export function DiscordWidget({
  id = '1319715782032228463',
  theme = 'dark',
  width = '100%',
  height = 500,
}: DiscordWidgetProps) {
  return (
    <Card
      elevation={0}
      sx={{
        overflow: 'hidden',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(88, 101, 242, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          component="img"
          src="/logo.png"
          alt="RPB"
          sx={{ width: 24, height: 24, borderRadius: '50%' }}
        />
        <Typography variant="subtitle2" fontWeight="bold">
          Discord Officiel
        </Typography>
      </Box>
      <iframe
        title="Discord Widget"
        src={`https://discord.com/widget?id=${id}&theme=${theme}`}
        width={width}
        height={height}
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        style={{ display: 'block', border: 'none' }}
      />
    </Card>
  );
}
