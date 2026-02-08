'use client';

import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { Avatar, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { TikTokEmbed } from 'react-social-media-embed';

interface TikTokCardProps {
  username: string;
  url: string;
  featuredVideoUrl?: string;
  avatarUrl?: string;
}

export function TikTokCard({ username, url, featuredVideoUrl, avatarUrl }: TikTokCardProps) {
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        borderRadius: 4, 
        bgcolor: 'background.paper',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar 
            src={avatarUrl} 
            sx={{ width: 48, height: 48, bgcolor: 'grey.200' }}
          >
            {username.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="900">
              @{username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              TikTok Creator
            </Typography>
          </Box>
          <Button 
            size="small" 
            variant="contained" 
            color="primary"
            href={url}
            target="_blank"
            startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Voir
          </Button>
        </Stack>

        {featuredVideoUrl && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, borderRadius: 2, overflow: 'hidden' }}>
            <TikTokEmbed url={featuredVideoUrl} width="100%" />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
