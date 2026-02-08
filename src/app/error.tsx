'use client';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Button, Container, Typography } from '@mui/material';
import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        bgcolor: 'black',
        color: 'white',
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
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {error.message || 'Désolé, quelque chose s\'est mal passé. Veuillez réessayer.'}
          </Typography>
          {error.digest && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 2 }}>
              ID: {error.digest}
            </Typography>
          )}
          {process.env.NODE_ENV === 'development' && error.stack && (
            <Box sx={{ textAlign: 'left', bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 1, overflow: 'auto', maxWidth: '100%', mb: 3 }}>
              <pre style={{ fontSize: '0.7rem', margin: 0 }}>{error.stack}</pre>
            </Box>
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
