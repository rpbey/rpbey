'use client';

import { FormControlLabel, Grid, Switch, TextField } from '@mui/material';
import type { BotCommand } from '@prisma/client';
import { useEffect, useState } from 'react';
import { FormDialog } from '@/components/ui';
import type { BotCommandInput } from './actions';

interface CommandDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BotCommandInput) => Promise<void>;
  initialData?: BotCommand | null;
  loading?: boolean;
}

export function CommandDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}: CommandDialogProps) {
  const [formData, setFormData] = useState<BotCommandInput>({
    name: '',
    description: '',
    response: '',
    enabled: true,
    aliases: [],
    cooldown: 0,
    allowedRoles: [],
  });

  const [aliasesString, setAliasesString] = useState('');
  const [rolesString, setRolesString] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        response: initialData.response,
        enabled: initialData.enabled,
        aliases: initialData.aliases || [],
        cooldown: initialData.cooldown || 0,
        allowedRoles: initialData.allowedRoles || [],
      });
      setAliasesString(initialData.aliases?.join(', ') || '');
      setRolesString(initialData.allowedRoles?.join(', ') || '');
    } else {
      setFormData({
        name: '',
        description: '',
        response: '',
        enabled: true,
        aliases: [],
        cooldown: 0,
        allowedRoles: [],
      });
      setAliasesString('');
      setRolesString('');
    }
  }, [initialData]);

  const handleSubmit = async () => {
    const aliases = aliasesString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const allowedRoles = rolesString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await onSubmit({
      ...formData,
      aliases,
      allowedRoles,
    });
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={initialData ? 'Modifier la commande' : 'Ajouter une commande'}
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth="md"
    >
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Nom de la commande"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            helperText="Sans le préfixe /"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Réponse"
            value={formData.response}
            onChange={(e) =>
              setFormData({ ...formData, response: e.target.value })
            }
            required
            helperText="Texte simple ou JSON pour embed"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Alias (séparés par des virgules)"
            value={aliasesString}
            onChange={(e) => setAliasesString(e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="Cooldown (secondes)"
            value={formData.cooldown}
            onChange={(e) =>
              setFormData({
                ...formData,
                cooldown: parseInt(e.target.value, 10) || 0,
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Rôles autorisés (ID séparés par des virgules)"
            value={rolesString}
            onChange={(e) => setRolesString(e.target.value)}
            helperText="Laisser vide pour tout le monde"
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.enabled}
                onChange={(e) =>
                  setFormData({ ...formData, enabled: e.target.checked })
                }
              />
            }
            label="Commande activée"
          />
        </Grid>
      </Grid>
    </FormDialog>
  );
}
