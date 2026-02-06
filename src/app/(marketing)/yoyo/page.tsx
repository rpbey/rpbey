import { Container, Typography, Box, Grid, Paper, alpha } from '@mui/material';
import { YoyoAvatar } from './_components/YoyoAvatar';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

export const metadata: Metadata = {
  title: 'Yoyo - Le Maître du Jeu | RPB',
  description: 'Rencontrez Aphrody, le Maître du Jeu de la République Populaire du Beyblade.',
};

export default async function YoyoPage() {
  await connection();
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Restriction: Only accessible by user 'yoyo' or specific Discord ID
  const isYoyo = session?.user && (
    session.user.username?.toLowerCase().includes('yoyo') || 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (session.user as any).discordId === '281114294152724491' ||
    session.user.role === 'admin' || 
    session.user.role === 'superadmin'
  );

  if (!isYoyo) {
    redirect('/');
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: { xs: 4, md: 8 }, pb: 10 }}>
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          {/* Avatar Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ 
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              '&::before': {
                content: '""',
                position: 'absolute',
                width: '120%',
                height: '120%',
                background: 'radial-gradient(circle, rgba(220, 38, 38, 0.15) 0%, transparent 70%)',
                zIndex: 0
              }
            }}>
              <YoyoAvatar size={500} />
            </Box>
          </Grid>

          {/* Info Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography 
                variant="overline" 
                sx={{ 
                  color: '#fbbf24', 
                  fontWeight: 800, 
                  letterSpacing: 2,
                  display: 'block',
                  mb: 1
                }}
              >
                L'ADMINISTRATEUR SUPRÊME
              </Typography>
              <Typography 
                variant="h1" 
                fontWeight={900} 
                sx={{ 
                  fontSize: { xs: '3rem', md: '4.5rem' },
                  lineHeight: 1,
                  mb: 2,
                  background: 'linear-gradient(45deg, #fff 30%, #fbbf24 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                APHRODY
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  color: '#dc2626', 
                  fontWeight: 700, 
                  mb: 4,
                  fontStyle: 'italic'
                }}
              >
                "Le Maître du Jeu"
              </Typography>

              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  bgcolor: alpha('#fff', 0.03), 
                  border: '1px solid',
                  borderColor: alpha('#fbbf24', 0.2),
                  borderRadius: 4,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, fontSize: '1.1rem' }}>
                  Gardien des tournois, arbitre suprême de la RPB et architecte du destin de chaque Blader. 
                  Aphrody veille sur la méta Beyblade X avec une précision chirurgicale.
                </Typography>
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Box sx={{ textAlign: 'center', flex: 1 }}>
                    <Typography variant="h6" fontWeight="900" color="#fbbf24">LVL 99</Typography>
                    <Typography variant="caption" color="text.disabled">PUISSANCE</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', flex: 1 }}>
                    <Typography variant="h6" fontWeight="900" color="#fbbf24">∞</Typography>
                    <Typography variant="caption" color="text.disabled">ENDURANCE</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', flex: 1 }}>
                    <Typography variant="h6" fontWeight="900" color="#fbbf24">CRIT</Typography>
                    <Typography variant="caption" color="text.disabled">CHANCE</Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
