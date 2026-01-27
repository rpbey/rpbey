'use client';

import Box from '@mui/material/Box';
import { RandomCombo } from '@/components/deck/RandomCombo';

export default function RandomPage() {
  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto' }}>
      <RandomCombo />
    </Box>
  );
}
