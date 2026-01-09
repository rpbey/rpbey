'use client';

/**
 * DeckBuilderModal - Modal for creating/editing decks
 */

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import type { BeyData } from './BeyBuilder';
import { BeyBuilder } from './BeyBuilder';
import type { Deck } from './DeckCard';

interface DeckBuilderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  deck?: Deck | null;
}

const emptyBey: BeyData = {
  blade: null,
  ratchet: null,
  bit: null,
  nickname: '',
};

export function DeckBuilderModal({
  open,
  onClose,
  onSave,
  deck,
}: DeckBuilderModalProps) {
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [beys, setBeys] = useState<[BeyData, BeyData, BeyData]>([
    { ...emptyBey },
    { ...emptyBey },
    { ...emptyBey },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or deck changes
  useEffect(() => {
    if (open) {
      if (deck) {
        setName(deck.name);
        setIsActive(deck.isActive);
        const sortedBeys = [...deck.beys].sort(
          (a, b) => a.position - b.position,
        );
        setBeys([
          {
            blade: sortedBeys[0]?.blade ?? null,
            ratchet: sortedBeys[0]?.ratchet ?? null,
            bit: sortedBeys[0]?.bit ?? null,
            nickname: sortedBeys[0]?.nickname ?? '',
          },
          {
            blade: sortedBeys[1]?.blade ?? null,
            ratchet: sortedBeys[1]?.ratchet ?? null,
            bit: sortedBeys[1]?.bit ?? null,
            nickname: sortedBeys[1]?.nickname ?? '',
          },
          {
            blade: sortedBeys[2]?.blade ?? null,
            ratchet: sortedBeys[2]?.ratchet ?? null,
            bit: sortedBeys[2]?.bit ?? null,
            nickname: sortedBeys[2]?.nickname ?? '',
          },
        ]);
      } else {
        setName('');
        setIsActive(false);
        setBeys([{ ...emptyBey }, { ...emptyBey }, { ...emptyBey }]);
      }
      setError(null);
    }
  }, [open, deck]);

  const handleBeyChange = (index: number, data: BeyData) => {
    const newBeys = [...beys] as [BeyData, BeyData, BeyData];
    newBeys[index] = data;
    setBeys(newBeys);
  };

  // Get all used part IDs across all beys
  const usedPartIds = beys.flatMap((bey) =>
    [bey.blade?.id, bey.ratchet?.id, bey.bit?.id].filter(Boolean),
  ) as string[];

  const isValid =
    name.trim() && beys.every((bey) => bey.blade && bey.ratchet && bey.bit);

  const handleSave = async () => {
    if (!isValid) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        isActive,
        beys: beys.map((bey, index) => ({
          position: index + 1,
          nickname: bey.nickname || null,
          bladeId: bey.blade?.id,
          ratchetId: bey.ratchet?.id,
          bitId: bey.bit?.id,
        })),
      };

      const url = deck ? `/api/decks/${deck.id}` : '/api/decks';
      const method = deck ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save deck');
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {deck ? 'Modifier le Deck' : 'Créer un nouveau Deck'}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Nom du Deck"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            placeholder="Mon deck agressif"
          />

          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            }
            label="Définir comme deck actif pour les tournois"
          />

          {beys.map((bey, index) => (
            <BeyBuilder
              // biome-ignore lint/suspicious/noArrayIndexKey: Fixed slots
              key={index}
              position={index + 1}
              data={bey}
              onChange={(data) => handleBeyChange(index, data)}
              usedPartIds={usedPartIds}
              disabled={saving}
            />
          ))}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!isValid || saving}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
