'use client';

import {
  Code as CodeIcon,
  Settings as ConfigIcon,
  Dashboard as DashboardIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Terminal as LogsIcon,
  Memory as MemoryIcon,
  Error as OfflineIcon,
  CheckCircle as OnlineIcon,
  Speed as PingIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Sync as SyncIcon,
  Terminal,
  Timer as UptimeIcon,
  People as UsersIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import type { BotCommand } from '@prisma/client';
import { useCallback, useEffect, useState } from 'react';
import { BotMessenger } from '@/components/admin/BotMessenger';
import { useSocket } from '@/components/providers/SocketProvider';
import {
  DataTable,
  StatusChip,
  useConfirmDialog,
  useToast,
} from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import { getContent, upsertContent } from '@/server/actions/cms';
import { CommandDialog } from './_components/CommandDialog';
import LiveConsole from './_components/LiveConsole';
import type { BotCommandInput } from './actions';
import {
  createBotCommand,
  deleteBotCommand,
  getBotCommands,
  syncBotCommands,
  updateBotCommand,
} from './actions';

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

interface BotConfig {
  env: Record<string, string>;
  constants: {
    RPB: Record<string, string>;
    Colors: Record<string, string>;
    Channels: Record<string, string>;
    Roles: Record<string, string>;
  };
}

interface BotRole {
  id: string;
  name: string;
  color: string;
  position: number;
  managed: boolean;
}

const sectionIcons: Record<string, string> = {
  RPB: '🏷️',
  Colors: '🎨',
  Channels: '📢',
  Roles: '👥',
};

export default function UnifiedBotPage() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [nativeCommands, setNativeCommands] = useState<NativeCommand[]>([]);
  const [customCommands, setCustomCommands] = useState<BotCommand[]>([]);
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [roles, setRoles] = useState<BotRole[]>([]);
  const [disabledCommands, setDisabledCommands] = useState<string[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  // Custom Commands State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<BotCommand | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Phrases State
  const [welcomeText, setWelcomeText] = useState('');
  const [reminderText, setReminderText] = useState('');

  // Config State
  const [showSecrets, setShowSecrets] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    env: true,
    RPB: true,
    Colors: false,
    Channels: false,
    Roles: false,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch Status
      const statusRes = await fetch('/api/bot/status');
      if (statusRes.ok) setStatus(await statusRes.json());

      // Fetch Native Commands
      const nativeRes = await fetch('/api/bot/commands');
      if (nativeRes.ok) {
        const data = await nativeRes.json();
        setNativeCommands(data.commands || []);
      }

      // Fetch Custom Commands
      const customData = await getBotCommands();
      setCustomCommands(customData);

      // Fetch Config
      const configRes = await fetch('/api/bot/config');
      if (configRes.ok) setConfig(await configRes.json());

      // Fetch Roles
      const rolesRes = await fetch('/api/bot/roles');
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.roles || []);
      }

      // Fetch Templates via Server Actions
      const [welcome, reminder, settings] = await Promise.all([
        getContent('bot-welcome-text'),
        getContent('bot-reminder-template'),
        getContent('bot-settings'),
      ]);

      setWelcomeText(welcome?.content || '');
      setReminderText(reminder?.content || '');
      if (settings?.content) {
        try {
          const parsed = JSON.parse(settings.content);
          setDisabledCommands(parsed.disabledCommands || []);
          setMaintenanceMode(parsed.maintenanceMode || false);
        } catch {
          // Ignore error
        }
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
  }, [fetchData]);

  const toggleMaintenance = async () => {
    const newValue = !maintenanceMode;
    setMaintenanceMode(newValue);

    try {
      await upsertContent(
        'bot-settings',
        JSON.stringify({ disabledCommands, maintenanceMode: newValue }),
        'Bot - Paramètres',
      );
      showToast(
        `Mode maintenance ${newValue ? 'activé' : 'désactivé'}`,
        newValue ? 'warning' : 'success',
      );
    } catch {
      showToast('Erreur de configuration', 'error');
      setMaintenanceMode(!newValue);
    }
  };

  const handleSavePhrases = async () => {
    setSubmitting(true);
    try {
      await Promise.all([
        upsertContent(
          'bot-welcome-text',
          welcomeText,
          'Bot - Phrase Bienvenue',
        ),
        upsertContent(
          'bot-reminder-template',
          reminderText,
          'Bot - Rappel Tournoi',
        ),
      ]);
      showToast('Phrases enregistrées', 'success');
    } catch {
      showToast("Erreur lors de l'enregistrement", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCommand = async (cmdName: string) => {
    const isCurrentlyDisabled = disabledCommands.includes(cmdName);
    const newList = isCurrentlyDisabled
      ? disabledCommands.filter((c) => c !== cmdName)
      : [...disabledCommands, cmdName];

    setDisabledCommands(newList);

    try {
      await upsertContent(
        'bot-settings',
        JSON.stringify({ disabledCommands: newList, maintenanceMode }),
        'Bot - Paramètres',
      );
      showToast(
        `Commande ${isCurrentlyDisabled ? 'activée' : 'désactivée'}`,
        'info',
      );
    } catch {
      showToast('Erreur de configuration', 'error');
    }
  };

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = (data: BotStatus) => setStatus(data);
    socket.on('status_update', handleStatusUpdate);
    return () => {
      socket.off('status_update', handleStatusUpdate);
    };
  }, [socket]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Command Handlers
  const handleAddCommand = () => {
    setSelectedCommand(null);
    setDialogOpen(true);
  };

  const handleEditCommand = (command: BotCommand) => {
    setSelectedCommand(command);
    setDialogOpen(true);
  };

  const handleDeleteCommand = async (command: BotCommand) => {
    const confirmed = await confirm({
      title: 'Supprimer la commande',
      message: `Êtes-vous sûr de vouloir supprimer la commande "/${command.name}" ?`,
      confirmText: 'Supprimer',
      confirmColor: 'error',
    });

    if (confirmed) {
      try {
        await deleteBotCommand(command.id);
        showToast('Commande supprimée', 'success');
        const updated = await getBotCommands();
        setCustomCommands(updated);
      } catch {
        showToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleCommandSubmit = async (data: BotCommandInput) => {
    setSubmitting(true);
    try {
      if (selectedCommand) {
        await updateBotCommand(selectedCommand.id, data);
        showToast('Commande mise à jour', 'success');
      } else {
        await createBotCommand(data);
        showToast('Commande créée', 'success');
      }
      setDialogOpen(false);
      const updated = await getBotCommands();
      setCustomCommands(updated);
    } catch {
      showToast("Erreur lors de l'enregistrement", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncCommands = async () => {
    setSyncing(true);
    try {
      const result = await syncBotCommands();
      if (result.success) showToast('Commandes synchronisées', 'success');
      else showToast(result.error || 'Erreur sync', 'error');
    } catch {
      showToast('Erreur de communication', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const commandColumns: Column<BotCommand>[] = [
    {
      id: 'name',
      label: 'Nom',
      render: (row) => <Typography fontWeight="bold">/{row.name}</Typography>,
    },
    { id: 'description', label: 'Description' },
    {
      id: 'enabled',
      label: 'Statut',
      render: (row) => (
        <StatusChip
          type="generic"
          label={row.enabled ? 'Active' : 'Inactive'}
          customColor={row.enabled ? 'success.main' : undefined}
          size="small"
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={() => handleEditCommand(row)} size="small">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => handleDeleteCommand(row)}
            size="small"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const roleColumns: Column<BotRole>[] = [
    {
      id: 'name',
      label: 'Rôle',
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: row.color,
            }}
          />
          <Typography fontWeight="bold">{row.name}</Typography>
        </Stack>
      ),
    },
    {
      id: 'id',
      label: 'ID',
      render: (row) => (
        <Typography variant="caption" fontFamily="monospace">
          {row.id}
        </Typography>
      ),
    },
    {
      id: 'managed',
      label: 'Type',
      render: (row) =>
        row.managed ? (
          <Chip label="Intégré" size="small" />
        ) : (
          <Chip label="Manuel" size="small" variant="outlined" />
        ),
    },
  ];

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
    <Box>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            🤖 Bot Discord
          </Typography>
          <Typography color="text.secondary">
            Centre de contrôle et configuration du Bot RPB
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip
            icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
            label={isOnline ? 'OPÉRATIONNEL' : 'HORS LIGNE'}
            color={isOnline ? 'success' : 'error'}
            variant="outlined"
          />
          <IconButton onClick={fetchData} size="small">
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<DashboardIcon />} label="Tableau de bord" />
          <Tab icon={<CodeIcon />} label="Commandes" />
          <Tab icon={<Terminal />} label="Phrases Auto" />
          <Tab icon={<ConfigIcon />} label="Configuration" />
          <Tab icon={<UsersIcon />} label="Rôles" />
          <Tab icon={<LogsIcon />} label="Console Live" />
          <Tab icon={<SettingsIcon />} label="Options" />
        </Tabs>
      </Paper>

      {/* Tab 0: Overview */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid size={12}>
            <Card
              sx={{
                bgcolor: maintenanceMode
                  ? alpha(theme.palette.warning.main, 0.05)
                  : 'background.paper',
                border: maintenanceMode ? '1px solid' : 'none',
                borderColor: 'warning.main',
              }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  spacing={3}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '50%',
                        bgcolor: maintenanceMode
                          ? 'warning.main'
                          : 'success.main',
                        color: 'white',
                        display: 'flex',
                      }}
                    >
                      <SettingsIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        Mode Maintenance Global
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {maintenanceMode
                          ? 'Le bot refuse actuellement toutes les commandes (sauf admins).'
                          : 'Le bot est en mode opérationnel normal.'}
                      </Typography>
                    </Box>
                  </Stack>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={maintenanceMode}
                        onChange={toggleMaintenance}
                        color="warning"
                      />
                    }
                    label={maintenanceMode ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
                    labelPlacement="start"
                    sx={{ mr: 0 }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2}>
                  <UptimeIcon color="primary" />{' '}
                  <Box>
                    <Typography variant="caption">Uptime</Typography>
                    <Typography variant="h6">
                      {status?.uptimeFormatted}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2}>
                  <PingIcon color="info" />{' '}
                  <Box>
                    <Typography variant="caption">Ping Discord</Typography>
                    <Typography variant="h6">{status?.ping}ms</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2}>
                  <MemoryIcon color="secondary" />{' '}
                  <Box>
                    <Typography variant="caption">Mémoire</Typography>
                    <Typography variant="h6">{status?.memoryUsage}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <BotMessenger />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardHeader title="Communauté" />
              <CardContent>
                <Stack spacing={2}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography color="text.secondary">Serveurs</Typography>
                    <Typography fontWeight="bold">{status?.guilds}</Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography color="text.secondary">
                      Membres en cache
                    </Typography>
                    <Typography fontWeight="bold">{status?.users}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Commands */}
      {activeTab === 1 && (
        <Stack spacing={4}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6">Commandes Personnalisées</Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<CodeIcon />}
                onClick={handleAddCommand}
              >
                Ajouter
              </Button>
              <Button
                variant="outlined"
                startIcon={
                  syncing ? <CircularProgress size={20} /> : <SyncIcon />
                }
                onClick={handleSyncCommands}
                disabled={syncing}
              >
                Sync Bot
              </Button>
            </Stack>
          </Box>
          <DataTable columns={commandColumns} rows={customCommands} />

          <Typography variant="h6">Commandes Natives (Code)</Typography>
          <Card variant="outlined">
            <List dense>
              {nativeCommands.map((cmd) => (
                <ListItem
                  key={cmd.name}
                  divider
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={cmd.category}
                        size="small"
                        variant="outlined"
                      />{' '}
                      <Button
                        size="small"
                        variant="outlined"
                        color={
                          disabledCommands.includes(cmd.name)
                            ? 'error'
                            : 'success'
                        }
                        onClick={() => toggleCommand(cmd.name)}
                      >
                        {disabledCommands.includes(cmd.name)
                          ? 'Désactivée'
                          : 'Active'}
                      </Button>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography fontWeight="bold">/{cmd.name}</Typography>
                    }
                    secondary={cmd.description}
                  />
                </ListItem>
              ))}
            </List>
          </Card>
        </Stack>
      )}

      {/* Tab 2: Phrases */}
      {activeTab === 2 && (
        <Stack spacing={3}>
          <Card>
            <CardHeader
              title="Bienvenue (Nouveau membre)"
              subheader="Variables: {member}, {guild}, {rules}, {roles}, {general}"
            />
            <CardContent>
              <TextField
                fullWidth
                multiline
                rows={6}
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                placeholder="Texte de bienvenue..."
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader
              title="Rappel de Tournoi"
              subheader="Variables: {hours}, {name}, {date}, {location}, {participants}"
            />
            <CardContent>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={reminderText}
                onChange={(e) => setReminderText(e.target.value)}
                placeholder="Texte de rappel..."
              />
            </CardContent>
          </Card>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSavePhrases}
              disabled={submitting}
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer les phrases'}
            </Button>
          </Box>
        </Stack>
      )}

      {/* Tab 3: Configuration */}
      {activeTab === 3 && (
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              startIcon={
                showSecrets ? <VisibilityOffIcon /> : <VisibilityIcon />
              }
              onClick={() => setShowSecrets(!showSecrets)}
            >
              {showSecrets ? 'Masquer' : 'Afficher'} les secrets
            </Button>
          </Box>

          {config && (
            <Grid container spacing={3}>
              <Grid size={12}>
                <Card>
                  <CardHeader
                    title="🔐 Variables d'environnement"
                    onClick={() =>
                      setExpandedSections((p) => ({ ...p, env: !p.env }))
                    }
                    sx={{ cursor: 'pointer' }}
                    action={
                      <IconButton>
                        {expandedSections.env ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    }
                  />
                  <Collapse in={expandedSections.env}>
                    <CardContent>
                      <Grid container spacing={2}>
                        {Object.entries(config.env).map(([key, val]) => (
                          <Grid size={{ xs: 12, md: 6 }} key={key}>
                            <TextField
                              fullWidth
                              label={key}
                              value={
                                (key.includes('TOKEN') ||
                                  key.includes('SECRET')) &&
                                !showSecrets
                                  ? '••••••••'
                                  : val
                              }
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
                  </Collapse>
                </Card>
              </Grid>

              {Object.entries(config.constants).map(([section, values]) => (
                <Grid size={{ xs: 12, md: 6 }} key={section}>
                  <Card>
                    <CardHeader
                      title={`${sectionIcons[section] || '📋'} ${section}`}
                    />
                    <CardContent>
                      <Stack spacing={1}>
                        {Object.entries(values).map(([key, val]) => (
                          <Box
                            key={key}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              pb: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontFamily="monospace"
                              color="text.secondary"
                            >
                              {key}
                            </Typography>
                            <Typography variant="body2" fontFamily="monospace">
                              {val}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      )}

      {/* Tab 4: Roles */}
      {activeTab === 4 && (
        <Stack spacing={3}>
          <Typography variant="h6">Rôles du Serveur Discord</Typography>
          <DataTable columns={roleColumns} rows={roles} />
        </Stack>
      )}

      {/* Tab 5: Console */}
      {activeTab === 5 && <LiveConsole />}

      {/* Tab 6: Advanced Settings */}
      {activeTab === 6 && (
        <Stack spacing={3}>
          <Alert severity="warning">
            Attention : ces paramètres modifient le comportement interne du bot.
          </Alert>
          <Card>
            <CardHeader
              title="Commandes désactivées"
              subheader="Liste des commandes natives bloquées par l'admin"
            />
            <CardContent>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {disabledCommands.map((cmd) => (
                  <Chip
                    key={cmd}
                    label={cmd}
                    onDelete={() => toggleCommand(cmd)}
                    color="error"
                  />
                ))}
                {disabledCommands.length === 0 && (
                  <Typography color="text.secondary">
                    Aucune commande désactivée
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}

      <CommandDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCommandSubmit}
        initialData={selectedCommand}
        loading={submitting}
      />
    </Box>
  );
}
