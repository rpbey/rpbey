'use client';

import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import type { BotCommand } from '@prisma/client';
import { useCallback, useEffect, useState } from 'react';
import {
  DataTable,
  PageHeader,
  StatusChip,
  useConfirmDialog,
  useToast,
} from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import type { BotCommandInput } from './actions';
import {
  createBotCommand,
  deleteBotCommand,
  getBotCommands,
  syncBotCommands,
  updateBotCommand,
} from './actions';
import { CommandDialog } from './CommandDialog';

export default function AdminBotCommandsPage() {
  const [commands, setCommands] = useState<BotCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<BotCommand | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();

  const fetchCommands = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBotCommands();
      setCommands(data);
    } catch {
      showToast('Erreur lors de la récupération des commandes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);

  const handleAdd = () => {
    setSelectedCommand(null);
    setDialogOpen(true);
  };

  const handleEdit = (command: BotCommand) => {
    setSelectedCommand(command);
    setDialogOpen(true);
  };

  const handleDelete = async (command: BotCommand) => {
    const confirmed = await confirm({
      title: 'Supprimer la commande',
      message: `Êtes-vous sûr de vouloir supprimer la commande "${command.name}" ?`,
      confirmText: 'Supprimer',
      confirmColor: 'error',
    });

    if (confirmed) {
      try {
        await deleteBotCommand(command.id);
        showToast('Commande supprimée avec succès', 'success');
        fetchCommands();
      } catch {
        showToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleSubmit = async (data: BotCommandInput) => {
    setSubmitting(true);
    try {
      // Validate JSON response if needed
      try {
        if (data.response.trim().startsWith('{')) {
          JSON.parse(data.response);
        }
      } catch {
        showToast('JSON invalide dans la réponse', 'error');
        setSubmitting(false);
        return;
      }

      if (selectedCommand) {
        await updateBotCommand(selectedCommand.id, data);
        showToast('Commande mise à jour', 'success');
      } else {
        await createBotCommand(data);
        showToast('Commande créée', 'success');
      }
      setDialogOpen(false);
      fetchCommands();
    } catch {
      showToast("Erreur lors de l'enregistrement", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncBotCommands();
      if (result.success) {
        showToast('Commandes synchronisées avec le bot', 'success');
      } else {
        showToast(result.error || 'Erreur lors de la synchronisation', 'error');
      }
    } catch {
      showToast('Erreur de communication avec le bot', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const columns: Column<BotCommand>[] = [
    {
      id: 'name',
      label: 'Nom',
      render: (row) => (
        <Typography variant="subtitle2" fontWeight="bold">
          /{row.name}
        </Typography>
      ),
    },
    {
      id: 'description',
      label: 'Description',
    },
    {
      id: 'enabled',
      label: 'Statut',
      render: (row) => (
        <StatusChip
          type="generic"
          label={row.enabled ? 'Activée' : 'Désactivée'}
          customColor={row.enabled ? 'success.main' : undefined}
          size="small"
        />
      ),
    },
    {
      id: 'cooldown',
      label: 'Cooldown',
      render: (row) => (row.cooldown > 0 ? `${row.cooldown}s` : '-'),
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title="Modifier">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
              size="small"
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Commandes du Bot"
        description="Gérez les commandes personnalisées du bot Discord"
        actionLabel="Ajouter une commande"
        onAction={handleAdd}
      >
        <Button
          variant="outlined"
          startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? 'Sync...' : 'Synchroniser'}
        </Button>
      </PageHeader>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DataTable
          columns={columns}
          rows={commands}
          emptyMessage="Aucune commande personnalisée trouvée."
        />
      )}

      <CommandDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedCommand}
        loading={submitting}
      />
    </Box>
  );
}
