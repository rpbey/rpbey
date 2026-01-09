'use client';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useThemeMode } from '@/components/theme/ThemeRegistry';
import { authClient } from '@/lib/auth-client';

export default function TwoFactorPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { backgroundImage } = useThemeMode();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice: true,
      });
      if (res.error) {
        setError(res.error.message || 'Code invalide');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Une erreur est survenue');
    } finally {
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
                Validation A2F
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Entre le code de ton application d'authentification
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleVerify}>
              <TextField
                fullWidth
                label="Code à 6 chiffres"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                sx={{ mb: 3 }}
                autoFocus
                slotProps={{
                  htmlInput: {
                    maxLength: 6,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                  },
                }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={isLoading || code.length < 6}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                }}
              >
                {isLoading ? 'Vérification...' : 'Vérifier'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
