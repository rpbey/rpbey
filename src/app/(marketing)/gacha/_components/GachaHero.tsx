'use client';

import { AutoAwesome, Casino, CollectionsBookmark } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';

const FLOATING_CARDS = [
  {
    rarity: 'LEGENDARY',
    color: '#fbbf24',
    x: '15%',
    y: '20%',
    delay: 0,
    rotate: -12,
  },
  {
    rarity: 'SECRET',
    color: '#ef4444',
    x: '75%',
    y: '15%',
    delay: 0.3,
    rotate: 8,
  },
  {
    rarity: 'EPIC',
    color: '#8b5cf6',
    x: '85%',
    y: '55%',
    delay: 0.6,
    rotate: 15,
  },
  {
    rarity: 'RARE',
    color: '#3b82f6',
    x: '10%',
    y: '65%',
    delay: 0.9,
    rotate: -8,
  },
  {
    rarity: 'COMMON',
    color: '#6b7280',
    x: '60%',
    y: '70%',
    delay: 1.2,
    rotate: 5,
  },
];

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
        height: { xs: 400, sm: 460, md: 520 },
        overflow: 'hidden',
        mb: 0,
      }}
    >
      {/* Animated background gradient */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 30% 50%, rgba(139,92,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(251,191,36,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(239,68,68,0.08) 0%, transparent 50%), #0a0a0a',
        }}
      />

      {/* Grid pattern overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating card silhouettes */}
      {FLOATING_CARDS.map((card) => (
        <Box
          key={card.rarity}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0.08, 0.15, 0.08],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 4,
            delay: card.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
          sx={{
            position: 'absolute',
            left: card.x,
            top: card.y,
            width: { xs: 50, md: 70 },
            height: { xs: 75, md: 105 },
            borderRadius: 2,
            border: `2px solid ${card.color}`,
            bgcolor: `${card.color}10`,
            transform: `rotate(${card.rotate}deg)`,
            display: { xs: 'none', sm: 'block' },
          }}
        />
      ))}

      {/* Gradient overlays */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, #0a0a0a 0%, transparent 40%)',
        }}
      />

      {/* Content */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        sx={{
          position: 'absolute',
          bottom: { xs: 40, md: 60 },
          left: { xs: 20, md: 56 },
          right: { xs: 20, md: '40%' },
          zIndex: 2,
        }}
      >
        {/* Badge */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.75,
            mb: 2,
            borderRadius: 2,
            bgcolor: 'rgba(139,92,246,0.2)',
            border: '1px solid rgba(139,92,246,0.3)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <AutoAwesome sx={{ fontSize: 14, color: '#a78bfa' }} />
          <Typography
            sx={{
              color: '#a78bfa',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {totalCards} cartes · {totalCollectors} collectionneurs
          </Typography>
        </Box>

        <Typography
          variant="h2"
          component="h1"
          fontWeight={900}
          sx={{
            color: 'white',
            mb: 1.5,
            fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' },
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            background:
              'linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #fbbf24 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          RPB Gacha TCG
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255,255,255,0.6)',
            mb: 3,
            maxWidth: 520,
            lineHeight: 1.7,
            fontSize: { xs: '0.85rem', md: '0.95rem' },
          }}
        >
          Collectionnez les cartes de tous les bladers légendaires ! De Tyson à
          Valt, en passant par Gingka et X. Chaque carte possède des stats TCG
          uniques pour les duels.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            component={Link}
            href="#catalogue"
            variant="contained"
            size="large"
            startIcon={<CollectionsBookmark />}
            sx={{
              bgcolor: '#8b5cf6',
              color: 'white',
              fontWeight: 800,
              borderRadius: 2,
              px: { xs: 2.5, md: 3.5 },
              py: 1.2,
              fontSize: '0.9rem',
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#7c3aed',
                transform: 'scale(1.02)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Catalogue
          </Button>
          <Button
            component={Link}
            href="#classement"
            variant="outlined"
            size="large"
            startIcon={<Casino />}
            sx={{
              borderColor: 'rgba(255,255,255,0.3)',
              color: 'white',
              fontWeight: 700,
              borderRadius: 2,
              px: { xs: 2.5, md: 3.5 },
              py: 1.2,
              fontSize: '0.9rem',
              textTransform: 'none',
              backdropFilter: 'blur(8px)',
              bgcolor: 'rgba(255,255,255,0.05)',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            Classement
          </Button>
        </Box>
      </Box>

      {/* Right side: animated card stack (desktop only) */}
      <Box
        sx={{
          position: 'absolute',
          right: { md: '8%' },
          top: '50%',
          transform: 'translateY(-50%)',
          display: { xs: 'none', lg: 'block' },
          zIndex: 1,
        }}
      >
        {['#ef4444', '#fbbf24', '#8b5cf6'].map((color, i) => (
          <Box
            key={color}
            component={motion.div}
            initial={{ opacity: 0, rotate: 0, y: 50 }}
            animate={{
              opacity: 1,
              rotate: (i - 1) * 12,
              y: 0,
            }}
            transition={{
              delay: 0.5 + i * 0.15,
              duration: 0.6,
              ease: 'easeOut',
            }}
            sx={{
              position: 'absolute',
              top: -120,
              left: i * 10 - 10,
              width: 180,
              height: 260,
              borderRadius: 3,
              border: `2px solid ${color}`,
              bgcolor: `${color}15`,
              boxShadow: `0 0 40px ${color}30`,
              transformOrigin: 'center bottom',
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
