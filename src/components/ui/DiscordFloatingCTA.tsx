'use client';

import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import { alpha, Box, Button, IconButton, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { DiscordIcon } from './Icons';

const DISCORD_INVITE = 'https://discord.gg/rpb';
const DISMISS_KEY = 'rpb-discord-cta-dismissed';

export function DiscordFloatingCTA() {
  const [visible, setVisible] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    // Don't show if already dismissed recently (24h)
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 86400000) return;

    // Show after a delay for better UX
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Fetch live member count from Discord widget
    fetch('https://discord.com/api/guilds/1186042507930464367/widget.json')
      .then((r) => r.json())
      .then((data) => {
        if (data.presence_count) setMemberCount(data.presence_count);
      })
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!visible) return null;

  return (
    <Box
      role="complementary"
      aria-label="Rejoindre le Discord RPB"
      sx={{
        position: 'fixed',
        bottom: { xs: 'calc(64px + env(safe-area-inset-bottom))', md: 24 },
        right: { xs: 12, md: 24 },
        left: { xs: 12, md: 'auto' },
        zIndex: 1050,
        maxWidth: { xs: 'none', md: 380 },
        animation: 'slideUp 0.4s ease-out',
        '@keyframes slideUp': {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Box
        sx={{
          bgcolor: '#5865F2',
          color: 'white',
          p: { xs: 2, md: 2.5 },
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: `0 8px 32px ${alpha('#5865F2', 0.4)}, 0 2px 8px rgba(0,0,0,0.3)`,
          border: `1px solid ${alpha('#fff', 0.15)}`,
          position: 'relative',
        }}
      >
        {/* Dismiss button */}
        <IconButton
          onClick={handleDismiss}
          aria-label="Fermer"
          size="small"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            color: alpha('#fff', 0.6),
            '&:hover': { color: 'white' },
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>

        {/* Discord icon */}
        <Box
          sx={{
            width: 44,
            height: 44,
            bgcolor: alpha('#fff', 0.15),
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <DiscordIcon size={26} />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
          <Typography
            fontWeight={800}
            sx={{ fontSize: { xs: '0.85rem', md: '0.95rem' }, lineHeight: 1.2 }}
          >
            Rejoins la communauté RPB !
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '0.72rem', md: '0.78rem' },
              opacity: 0.85,
              mt: 0.25,
            }}
          >
            Tournois, classements, trades et discussions meta.
            {memberCount && (
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.3,
                  ml: 0.5,
                  fontWeight: 700,
                }}
              >
                <GroupIcon sx={{ fontSize: '0.75rem' }} />
                {memberCount} en ligne
              </Box>
            )}
          </Typography>
        </Box>

        {/* CTA */}
        <Button
          component="a"
          href={DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          size="small"
          sx={{
            bgcolor: 'white',
            color: '#5865F2',
            fontWeight: 800,
            fontSize: { xs: '0.75rem', md: '0.8rem' },
            px: { xs: 1.5, md: 2 },
            py: 0.8,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            '&:hover': {
              bgcolor: alpha('#fff', 0.9),
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          Rejoindre
        </Button>
      </Box>
    </Box>
  );
}
