'use client';

import {
  Avatar,
  Box,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import type { StaffMember } from '@prisma/client';
import { useCallback, useEffect, useState } from 'react';
import { FormDialog } from '@/components/ui';
import type { BotMember, BotRole } from '@/types';
import type { StaffMemberInput } from './actions';
import { getDiscordRoles, getMembersByRole } from './actions';

const TEAMS = [
  { value: 'admin', label: 'Administration' },
  { value: 'rh', label: 'Ressources Humaines' },
  { value: 'modo', label: 'Modération' },
  { value: 'staff', label: 'Staff' },
  { value: 'dev', label: 'Développement' },
  { value: 'event', label: 'Événementiel' },
  { value: 'media', label: 'Média / Design' },
];

interface StaffDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: StaffMemberInput) => Promise<void>;
  initialData?: StaffMember | null;
  loading?: boolean;
}

export function StaffDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}: StaffDialogProps) {
  const [formData, setFormData] = useState<StaffMemberInput>({
    name: '',
    role: '',
    teamId: 'modo',
    imageUrl: '',
    discordId: '',
    displayIndex: 0,
    isActive: true,
  });

  const [roles, setRoles] = useState<BotRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [discordMembers, setDiscordMembers] = useState<BotMember[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    const data = await getDiscordRoles();
    setRoles(data);
    setLoadingRoles(false);
  }, []);

  useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open, fetchRoles]);

  const handleRoleChange = async (roleId: string) => {
    setSelectedRoleId(roleId);
    setLoadingMembers(true);
    const data = await getMembersByRole(roleId);
    setDiscordMembers(data);
    setLoadingMembers(false);
  };

  const handleSelectDiscordMember = (member: BotMember) => {
    setFormData({
      ...formData,
      name: member.displayName || member.username,
      discordId: member.id,
      imageUrl: member.avatar || '',
    });
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        role: initialData.role || '',
        teamId: initialData.teamId || 'modo',
        imageUrl: initialData.imageUrl || '',
        discordId: initialData.discordId || '',
        displayIndex: initialData.displayIndex || 0,
        isActive: initialData.isActive ?? true,
      });
    } else {
      setFormData({
        name: '',
        role: '',
        teamId: 'modo',
        imageUrl: '',
        discordId: '',
        displayIndex: 0,
        isActive: true,
      });
    }
  }, [initialData]);

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={initialData ? 'Modifier le membre' : 'Ajouter un membre'}
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth="md"
    >
      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        {/* Discord Sync Section */}
        {!initialData && (
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Synchronisation Discord (Optionnel)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Sélectionner un rôle Discord"
                    value={selectedRoleId}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    disabled={loadingRoles}
                  >
                    {loadingRoles ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} />{' '}
                        Chargement...
                      </MenuItem>
                    ) : (
                      roles.map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: role.color,
                              mr: 1,
                            }}
                          />
                          {role.name}
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Sélectionner un membre"
                    disabled={!selectedRoleId || loadingMembers}
                    onChange={(e) => {
                      const member = discordMembers.find(
                        (m) => m.id === e.target.value,
                      );
                      if (member) handleSelectDiscordMember(member);
                    }}
                  >
                    {loadingMembers ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} />{' '}
                        Chargement...
                      </MenuItem>
                    ) : (
                      discordMembers.map((member) => (
                        <MenuItem key={member.id} value={member.id}>
                          <Avatar
                            src={member.avatar || undefined}
                            sx={{ width: 20, height: 20, mr: 1 }}
                          />
                          {member.displayName}
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <Divider />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Nom / Pseudo"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Rôle"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            required
            placeholder="ex: Modérateur, Développeur..."
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            select
            label="Équipe"
            value={formData.teamId}
            onChange={(e) =>
              setFormData({ ...formData, teamId: e.target.value })
            }
            required
          >
            {TEAMS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="Ordre d'affichage"
            value={formData.displayIndex}
            onChange={(e) =>
              setFormData({
                ...formData,
                displayIndex: parseInt(e.target.value, 10) || 0,
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="URL de l'image"
            value={formData.imageUrl}
            onChange={(e) =>
              setFormData({ ...formData, imageUrl: e.target.value })
            }
            placeholder="https://..."
            helperText="L'avatar Discord sera utilisé si synchronisé"
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="ID Discord"
            value={formData.discordId}
            onChange={(e) =>
              setFormData({ ...formData, discordId: e.target.value })
            }
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
              />
            }
            label="Actif (Affiché sur le site)"
          />
        </Grid>
      </Grid>
    </FormDialog>
  );
}
