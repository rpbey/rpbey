'use client';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Button, Container, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useThemeMode } from '@/components/theme/ThemeRegistry';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { backgroundImage } = useThemeMode();

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

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
          <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Une erreur est survenue
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Désolé, quelque chose s&apos;est mal passé. Veuillez réessayer.
          </Typography>
          {error.digest && (
            <Typography variant="caption" color="text.disabled">
              Code erreur: {error.digest}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={reset}
            size="large"
          >
            Réessayer
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
