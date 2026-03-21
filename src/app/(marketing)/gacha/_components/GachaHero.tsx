'use client';

import { Box, Button, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface GachaHeroProps {
  totalCards: number;
  totalCollectors: number;
}

export function GachaHero({ totalCards, totalCollectors }: GachaHeroProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 300, sm: 360, md: 440 },
        overflow: 'hidden',
        mb: 0,
      }}
    >
      {/* Background — dark with subtle red accent */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 20% 80%, rgba(220,38,38,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(220,38,38,0.06) 0%, transparent 50%), #0a0a0a',
        }}
      />

      {/* Diagonal stripes — subtle texture */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,1) 40px, rgba(255,255,255,1) 41px)',
        }}
      />

      {/* Gradient to content */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, #0a0a0a 0%, transparent 50%)',
        }}
      />

      {/* Content */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        sx={{
          position: 'absolute',
          bottom: { xs: 32, md: 50 },
          left: { xs: 20, md: 48 },
          right: { xs: 20, md: '40%' },
          zIndex: 2,
        }}
      >
        {/* Stats badge */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.5,
            mb: 1.5,
            borderRadius: 1.5,
            bgcolor: 'rgba(220,38,38,0.15)',
            border: '1px solid rgba(220,38,38,0.25)',
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: '#dc2626',
            }}
          />
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            {totalCards} cartes &middot; {totalCollectors} joueurs
          </Typography>
        </Box>

        <Typography
          variant="h2"
          component="h1"
          fontWeight={900}
          sx={{
            color: 'white',
            mb: 1,
            fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
          }}
        >
          RPB Gacha
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255,255,255,0.5)',
            mb: 2.5,
            maxWidth: 460,
            lineHeight: 1.6,
            fontSize: { xs: '0.82rem', md: '0.9rem' },
          }}
        >
          Collectionnez les cartes de tous les bladers, de Tyson à X. Affrontez
          d&apos;autres joueurs en duel 5v5.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: '#dc2626',
              color: 'white',
              fontWeight: 700,
              borderRadius: 2,
              px: { xs: 2.5, md: 3 },
              py: 1,
              fontSize: '0.85rem',
              textTransform: 'none',
              '&:hover': { bgcolor: '#b91c1c' },
            }}
          >
            Jouer sur Discord
          </Button>
        </Box>
      </Box>

      {/* Right side accent — large muted number */}
      <Box
        sx={{
          position: 'absolute',
          right: { xs: -20, md: '5%' },
          bottom: { xs: -30, md: -20 },
          display: { xs: 'none', sm: 'block' },
          zIndex: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: { sm: '12rem', md: '16rem' },
            fontWeight: 900,
            color: 'rgba(255,255,255,0.015)',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          TCG
        </Typography>
      </Box>
    </Box>
  );
}
