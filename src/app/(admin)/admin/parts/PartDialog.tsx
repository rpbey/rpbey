'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Grid as MuiGrid,
  Stack,
  TextField,
} from '@mui/material';
import type { BeyType, Part, PartType } from '@prisma/client';
import { useEffect, useState } from 'react';

interface PartDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Part>) => Promise<void>;
  initialData?: Part | null;
}

export function PartDialog({
  open,
  onClose,
  onSubmit,
  initialData,
}: PartDialogProps) {
  const [form, setForm] = useState<Partial<Part>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({ type: 'BLADE', system: 'BX' });
    }
  }, [initialData]);

  const handleSubmit = async () => {
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData ? 'Modifier la pièce' : 'Ajouter une pièce'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <MuiGrid container spacing={2}>
            <MuiGrid size={{ xs: 6 }}>
              <TextField
                select
                label="Type"
                fullWidth
                value={form.type || 'BLADE'}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as PartType })
                }
              >
                <MenuItem value="BLADE">Blade</MenuItem>
                <MenuItem value="RATCHET">Ratchet</MenuItem>
                <MenuItem value="BIT">Bit</MenuItem>
              </TextField>
            </MuiGrid>
            <MuiGrid size={{ xs: 6 }}>
              <TextField
                label="Système"
                fullWidth
                value={form.system || ''}
                onChange={(e) => setForm({ ...form, system: e.target.value })}
                placeholder="BX, UX..."
              />
            </MuiGrid>
            <MuiGrid size={{ xs: 12 }}>
              <TextField
                label="Nom"
                fullWidth
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </MuiGrid>
            <MuiGrid size={{ xs: 12 }}>
              <TextField
                label="URL Image"
                fullWidth
                value={form.imageUrl || ''}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </MuiGrid>

            {/* Specs */}
            <MuiGrid size={{ xs: 4 }}>
              <TextField
                label="Poids (g)"
                type="number"
                fullWidth
                value={form.weight || ''}
                onChange={(e) =>
                  setForm({ ...form, weight: parseFloat(e.target.value) })
                }
              />
            </MuiGrid>
            <MuiGrid size={{ xs: 4 }}>
              <TextField
                select
                label="Type Bey"
                fullWidth
                value={form.beyType || ''}
                onChange={(e) =>
                  setForm({ ...form, beyType: e.target.value as BeyType })
                }
              >
                <MenuItem value="">-</MenuItem>
                <MenuItem value="ATTACK">Attack</MenuItem>
                <MenuItem value="DEFENSE">Defense</MenuItem>
                <MenuItem value="STAMINA">Stamina</MenuItem>
                <MenuItem value="BALANCE">Balance</MenuItem>
              </TextField>
            </MuiGrid>
            <MuiGrid size={{ xs: 4 }}>
              <TextField
                label="Rotation"
                fullWidth
                value={form.spinDirection || ''}
                onChange={(e) =>
                  setForm({ ...form, spinDirection: e.target.value })
                }
                placeholder="Right/Left"
              />
            </MuiGrid>

            {/* Stats */}
            {['attack', 'defense', 'stamina', 'dash', 'burst'].map((stat) => (
              <MuiGrid key={stat} size={{ xs: 2.4 }}>
                <TextField
                  label={stat.charAt(0).toUpperCase() + stat.slice(1)}
                  fullWidth
                  size="small"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  value={(form as any)[stat] || ''}
                  onChange={(e) => setForm({ ...form, [stat]: e.target.value })}
                />
              </MuiGrid>
            ))}
          </MuiGrid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? '...' : 'Sauvegarder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
