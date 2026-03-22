'use client';

import { Box, Container, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';

interface HeroBannerProps {
  totalParts: number;
}

export function HeroBanner({ totalParts }: HeroBannerProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: { xs: 260, md: 360 },
        display: 'flex',
        alignItems: 'center',
        background:
          'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%)',
      }}
    >
      {/* Background image */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.2,
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
          },
        }}
      >
        <Image
          src="/app-assets/marketing/Marketing.png"
          alt="Beyblade X"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </Box>

      {/* Animated lines */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(255,255,255,0.02) 100px, rgba(255,255,255,0.02) 101px)',
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ maxWidth: 700 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: alpha('#dc2626', 0.15),
              border: '1px solid',
              borderColor: alpha('#dc2626', 0.3),
              borderRadius: 2,
              px: 2,
              py: 0.5,
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#dc2626',
                boxShadow: '0 0 10px #dc2626',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: '#dc2626',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontSize: '0.7rem',
              }}
            >
              Partenaire officiel Takara Tomy
            </Typography>
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.05,
              fontSize: { xs: '2rem', md: '3.2rem' },
              letterSpacing: -1,
              mb: 1.5,
            }}
          >
            BEYBLADE X
            <Box
              component="span"
              sx={{
                display: 'block',
                background: 'linear-gradient(90deg, #dc2626, #f97316)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1rem', md: '1.5rem' },
                letterSpacing: 2,
                mt: 0.5,
              }}
            >
              EXPLORATEUR DE RESSOURCES
            </Box>
          </Typography>

          <Typography
            sx={{
              color: alpha('#fff', 0.6),
              fontSize: { xs: '0.85rem', md: '1rem' },
              lineHeight: 1.6,
              maxWidth: 500,
            }}
          >
            Explorez les {totalParts}+ pièces du jeu Beyblade X — blades,
            ratchets, bits — avec leurs statistiques, textures et modèles 3D
            extraits directement de l&apos;application officielle.
          </Typography>
        </Box>
      </Container>

      {/* Corner accent */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha('#dc2626', 0.2)} 0%, transparent 70%)`,
        }}
      />
    </Box>
  );
}
