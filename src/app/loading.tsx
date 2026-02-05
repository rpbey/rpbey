'use client';

import { Box, CircularProgress } from '@mui/material';

export default function Loading() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#000',
      }}
    >
      <CircularProgress size={60} thickness={4} sx={{ color: '#dc2626' }} />
    </Box>
  );
}
