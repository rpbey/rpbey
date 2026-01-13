'use client';

import {
  CheckCircle,
  Error as ErrorIcon,
  Link as LinkIcon,
  Refresh,
  Sync as SyncIcon,
} from '@mui/icons-material';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function AdminSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [config, setConfig] = useState<{ env: Record<string, string> } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [challongeStatus, setChallongeStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [challongeMessage, setChallongeMessage] = useState<string | null>(null);

  useEffect(() => {
    const challongeResult = searchParams.get('challonge');
    if (challongeResult === 'success') {
      setChallongeStatus('success');
      setChallongeMessage('Compte Challonge lié avec succès !');
      // Clear query params
      router.replace('/admin/settings');
    } else if (challongeResult === 'error') {
      setChallongeStatus('error');
      setChallongeMessage('Erreur lors de la liaison du compte Challonge.');
      router.replace('/admin/settings');
    }
  }, [searchParams, router]);

  const connectChallonge = () => {
    window.location.href = '/api/auth/challonge';
  };

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/config');
      if (!res.ok) throw new Error('Failed to fetch config');
      const data = await res.json();
      setConfig(data);
    } catch {
      setError('Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  const testChallonge = async () => {
    setChallongeStatus('loading');
    setChallongeMessage(null);
    try {
      const res = await fetch('/api/admin/integrations/challonge', {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setChallongeStatus('success');
        setChallongeMessage(data.message);
      } else {
        setChallongeStatus('error');
        setChallongeMessage(data.message);
      }
    } catch {
      setChallongeStatus('error');
      setChallongeMessage('Erreur lors du test de connexion');
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return (
    <Box sx={{ py: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Configuration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Variables d'environnement et Intégrations
          </Typography>
        </Box>
        <Tooltip title="Rafraîchir">
          <IconButton onClick={fetchConfig} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Integrations Card */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card variant="elevated" sx={{ height: '100%' }}>
            <CardHeader
              title="Intégrations"
              subheader="Statut des services externes"
            />
            <CardContent>
              <Stack spacing={3}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography fontWeight="bold">Challonge</Typography>
                      {challongeStatus === 'success' && (
                        <CheckCircle color="success" fontSize="small" />
                      )}
                      {challongeStatus === 'error' && (
                        <ErrorIcon color="error" fontSize="small" />
                      )}
                    </Box>
                    <Chip
                      label={
                        challongeStatus === 'success'
                          ? 'Connecté'
                          : challongeStatus === 'error'
                            ? 'Erreur'
                            : 'Inconnu'
                      }
                      color={
                        challongeStatus === 'success'
                          ? 'success'
                          : challongeStatus === 'error'
                            ? 'error'
                            : 'default'
                      }
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  {challongeMessage && (
                    <Alert
                      severity={
                        challongeStatus === 'success' ? 'success' : 'error'
                      }
                      sx={{ mb: 2, py: 0 }}
                    >
                      {challongeMessage}
                    </Alert>
                  )}

                  <Stack spacing={1}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={
                        challongeStatus === 'loading' ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <LinkIcon />
                        )
                      }
                      onClick={testChallonge}
                      disabled={challongeStatus === 'loading'}
                    >
                      Tester la connexion
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<SyncIcon />}
                      onClick={connectChallonge}
                      color="secondary"
                    >
                      Connecter mon compte
                    </Button>
                  </Stack>
                </Box>

                {/* Placeholder for other integrations like Discord or Twitch if needed */}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Environment Variables Card */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : config ? (
            <Card variant="elevated" sx={{ height: '100%' }}>
              <CardHeader title="Variables d'environnement" />
              <CardContent>
                <Grid container spacing={2}>
                  {Object.entries(config.env).map(([key, value]) => (
                    <Grid size={{ xs: 12, md: 6 }} key={key}>
                      <TextField
                        fullWidth
                        label={key}
                        value={value}
                        size="small"
                        slotProps={{
                          input: {
                            readOnly: true,
                            sx: { fontFamily: 'monospace' },
                          },
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          ) : null}
        </Grid>
      </Grid>
    </Box>
  );
}
