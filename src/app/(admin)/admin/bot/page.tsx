'use client';

import {
  Code as CodeIcon,
  Settings as ConfigIcon,
  Groups as GuildsIcon,
  Terminal as LogsIcon,
  Memory as MemoryIcon,
  Error as OfflineIcon,
  CheckCircle as OnlineIcon,
  Speed as PingIcon,
  Refresh as RefreshIcon,
  Timer as UptimeIcon,
  People as UsersIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BotMessenger } from '@/components/admin/BotMessenger';

interface BotStatus {
  status: 'running' | 'starting' | 'offline';
  uptime: number;
  uptimeFormatted: string;
  guilds: number;
  users: number;
  ping: number;
  memoryUsage: string;
  nodeVersion: string;
  error?: string;
}

interface NativeCommand {
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

export default function BotStatusPage() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [commands, setCommands] = useState<NativeCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, commandsRes] = await Promise.all([
        fetch('/api/bot/status'),
        fetch('/api/bot/commands'),
      ]);

      if (!statusRes.ok) throw new Error('Failed to fetch status');

      const statusData = await statusRes.json();
      setStatus(statusData);

      if (commandsRes.ok) {
        const commandsData = await commandsRes.json();
        setCommands(commandsData.commands || []);
      }

      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !status) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  const isOnline = status?.status === 'running';

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight={600}>
          🤖 Statut du Bot
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            href="/admin/bot/commands"
            variant="outlined"
            startIcon={<CodeIcon />}
          >
            Commandes Custom
          </Button>
          <Button
            component={Link}
            href="/admin/bot/logs"
            variant="outlined"
            startIcon={<LogsIcon />}
          >
            Voir les logs
          </Button>
          <Button
            component={Link}
            href="/admin/bot/config"
            variant="outlined"
            startIcon={<ConfigIcon />}
          >
            Configuration
          </Button>
          <Tooltip title="Rafraîchir">
            <IconButton onClick={fetchData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {status?.error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Le bot semble être hors ligne : {status.error}
        </Alert>
      )}

      {status && (
        <>
          {/* Main Status Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: isOnline ? 'success.main' : 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: isOnline ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.6 },
                    },
                  }}
                >
                  {isOnline ? (
                    <OnlineIcon sx={{ fontSize: 32, color: 'white' }} />
                  ) : (
                    <OfflineIcon sx={{ fontSize: 32, color: 'white' }} />
                  )}
                </Box>

                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    RPB Bot
                  </Typography>
                  <Stack direction="row" spacing={1} mt={0.5}>
                    <Chip
                      label={isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
                      color={isOnline ? 'success' : 'error'}
                      size="small"
                    />
                    {status.nodeVersion !== 'N/A' && (
                      <Chip
                        label={status.nodeVersion}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Stack>
          </Paper>

          {/* Stats Grid */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <UptimeIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Uptime
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {status.uptimeFormatted}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <PingIcon color="info" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Ping Discord
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {status.ping}ms
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <MemoryIcon color="secondary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Mémoire
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {status.memoryUsage}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <GuildsIcon color="warning" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Serveurs
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {status.guilds}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <UsersIcon color="success" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Utilisateurs en cache
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {status.users}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tools & Commands */}
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              {/* Messenger */}
              <Grid size={{ xs: 12, md: 7 }}>
                <BotMessenger />
              </Grid>

              {/* Native Commands List */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardHeader
                    title="Commandes Natives"
                    subheader={`${commands.length} commandes chargées`}
                  />
                  <CardContent sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
                    <List dense>
                      {commands.map((cmd) => (
                        <ListItem
                          key={cmd.name}
                          divider
                          secondaryAction={
                            <Chip
                              label={cmd.category}
                              size="small"
                              variant="outlined"
                            />
                          }
                        >
                          <ListItemText
                            primary={
                              <Typography fontWeight="bold">
                                /{cmd.name}
                              </Typography>
                            }
                            secondary={cmd.description}
                          />
                        </ListItem>
                      ))}
                      {commands.length === 0 && (
                        <Typography
                          textAlign="center"
                          color="text.secondary"
                          py={4}
                        >
                          Aucune commande trouvée (Bot hors ligne ?)
                        </Typography>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </>
      )}
    </Box>
  );
}
