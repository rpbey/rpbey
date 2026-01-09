import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      {children}
    </Suspense>
  );
}
