'use client';

import SearchOffIcon from '@mui/icons-material/SearchOff';
import { Box, Button, Container, Typography } from '@mui/material';
import Link from 'next/link';
import { useThemeMode } from '@/components/theme/ThemeRegistry';

export default function NotFound() {
  const { backgroundImage } = useThemeMode();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 3,
            bgcolor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            borderRadius: 4,
            p: 6,
          }}
        >
          <SearchOffIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
          <Typography variant="h2" component="h1" fontWeight="bold">
            404
          </Typography>
          <Typography variant="h5" gutterBottom>
            Page introuvable
          </Typography>
          <Typography variant="body1" color="text.secondary">
            La page que tu cherches n&apos;existe pas ou a été déplacée.
          </Typography>
          <Button
            component={Link}
            href="/"
            variant="contained"
            color="primary"
            size="large"
          >
            Retour à l&apos;accueil
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
