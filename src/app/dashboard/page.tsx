'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/lib/auth-client';

export default function DashboardRedirect() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending) {
      if (session?.user) {
        // Redirect based on role
        if (
          session.user.role === 'admin' ||
          session.user.role === 'superadmin'
        ) {
          router.replace('/admin');
        } else {
          // Regular users go to their own profile by default
          router.replace('/profile');
        }
      } else {
        // Not logged in, redirect to sign-in
        router.replace('/sign-in');
      }
    }
  }, [session, isPending, router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress color="primary" size={48} />
      <Typography variant="body1" color="text.secondary">
        Chargement de votre espace...
      </Typography>
    </Box>
  );
}
