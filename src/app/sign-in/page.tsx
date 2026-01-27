'use client';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { TwitchButton } from '@/components/auth';
import { DiscordIcon } from '@/components/ui/Icons';
import { useThemeMode } from '@/components/theme/ThemeRegistry';
import { signIn } from '@/lib/auth-client';

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = useState(false);
  const { backgroundImage } = useThemeMode();

  const handleDiscordSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    // Safety timeout: Reset loading state after 10s if redirect doesn't happen
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 10000);

    try {
      await signIn.social({
        provider: 'discord',
        callbackURL: '/dashboard',
      });
      // On success, the page redirects, so we don't need to clear timeout/loading
    } catch (err) {
      console.error('Login failed', err);
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{ width: '100%', maxWidth: 400, borderRadius: 4, boxShadow: 3 }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h4"
                component="h1"
                fontWeight="bold"
                gutterBottom
              >
                Connexion
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connecte-toi à la République Populaire du Beyblade
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Une erreur est survenue lors de la connexion.
              </Alert>
            )}

            <Stack spacing={2}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleDiscordSignIn}
                disabled={isLoading}
                sx={{
                  bgcolor: '#5865F2',
                  '&:hover': { bgcolor: '#4752C4' },
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                }}
                startIcon={<DiscordIcon size={24} />}
              >
                {isLoading ? 'Connexion...' : 'Continuer avec Discord'}
              </Button>

              <TwitchButton callbackURL="/dashboard" />
            </Stack>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                ou
              </Typography>
            </Divider>

            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Pas encore membre ?{' '}
              <Link
                href="https://discord.gg/rpb"
                style={{
                  color: 'inherit',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                }}
              >
                Rejoins le Discord RPB
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SignInContent />
    </Suspense>
  );
}
