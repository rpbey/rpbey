'use client';

import { Save } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { validateDeck } from '@/lib/tournament-logic';
import { BeySlotCard } from './BeySlotCard';
import { clearDraft, isCXBlade, useBuilder } from './BuilderContext';

export function DeckComposition() {
  const { state, dispatch } = useBuilder();
  const { data: session } = useSession();

  const allComplete = state.beys.every((b) => {
    const baseComplete = !!b.blade && !!b.ratchet && !!b.bit;
    if (!baseComplete) return false;
    if (isCXBlade(b)) {
      return !!b.lockChip && !!b.assistBlade;
    }
    return true;
  });

  const validation = useMemo(() => {
    if (!allComplete) return null;
    return validateDeck({
      beys: state.beys.map((b) => ({
        bladeId: b.blade?.id ?? '',
        ratchetId: b.ratchet?.id ?? '',
        bitId: b.bit?.id ?? '',
        bladeName: b.blade?.name ?? '',
        overBladeId: b.overBlade?.id,
        overBladeName: b.overBlade?.name,
        lockChipId: b.lockChip?.id,
        lockChipName: b.lockChip?.name,
        assistBladeId: b.assistBlade?.id,
        assistBladeName: b.assistBlade?.name,
      })),
    });
  }, [state.beys, allComplete]);

  const handleSave = useCallback(async () => {
    if (!session?.user) {
      toast.error('Connectez-vous pour sauvegarder vos decks');
      return;
    }

    if (!state.deckName.trim()) {
      toast.error('Donnez un nom a votre deck');
      return;
    }

    if (!allComplete) {
      toast.error('Completez les 3 Beys avant de sauvegarder');
      return;
    }

    if (validation && !validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const payload = {
      name: state.deckName,
      isActive: state.isActive,
      beys: state.beys.map((b, i) => ({
        position: i + 1,
        nickname: b.nickname,
        bladeId: b.blade?.id ?? '',
        ratchetId: b.ratchet?.id ?? '',
        bitId: b.bit?.id ?? '',
        overBladeId: b.overBlade?.id || undefined,
        lockChipId: b.lockChip?.id || undefined,
        assistBladeId: b.assistBlade?.id || undefined,
      })),
    };

    try {
      const url = state.deckId ? `/api/decks/${state.deckId}` : '/api/decks';
      const method = state.deckId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur serveur');
      }

      toast.success(state.deckId ? 'Deck mis a jour !' : 'Deck cree !');
      clearDraft();

      // Refresh saved decks
      const decksRes = await fetch('/api/decks');
      if (decksRes.ok) {
        const { data } = await decksRes.json();
        dispatch({
          type: 'SET_SAVED_DECKS',
          decks: data.map(
            (d: {
              id: string;
              name: string;
              isActive: boolean;
              updatedAt: string;
            }) => ({
              id: d.id,
              name: d.name,
              isActive: d.isActive,
              updatedAt: d.updatedAt,
            }),
          ),
        });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde',
      );
    }
  }, [session, state, allComplete, validation, dispatch]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <TextField
          placeholder="Nom du deck"
          size="small"
          value={state.deckName}
          onChange={(e) =>
            dispatch({ type: 'SET_DECK_NAME', name: e.target.value })
          }
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5,
              fontWeight: 'bold',
            },
          }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={state.isActive}
              onChange={(e) =>
                dispatch({ type: 'SET_IS_ACTIVE', isActive: e.target.checked })
              }
              size="small"
              color="success"
            />
          }
          label={
            <Typography variant="caption" fontWeight="bold">
              Actif
            </Typography>
          }
          sx={{ mr: 0 }}
        />
      </Box>

      {[0, 1, 2].map((i) => (
        <BeySlotCard key={i} slotIndex={i} />
      ))}

      {validation && !validation.isValid && (
        <Alert severity="error" sx={{ borderRadius: 2.5 }}>
          {validation.errors.map((err, i) => (
            <Typography key={i} variant="caption" display="block">
              {err}
            </Typography>
          ))}
        </Alert>
      )}

      {allComplete && validation?.isValid && (
        <Alert severity="success" sx={{ borderRadius: 2.5 }}>
          <Typography variant="caption" fontWeight="bold">
            Deck valide et pret pour le tournoi !
          </Typography>
        </Alert>
      )}

      <Button
        variant="contained"
        startIcon={<Save />}
        onClick={handleSave}
        disabled={!allComplete || !state.deckName.trim()}
        fullWidth
        color="error"
        sx={{
          borderRadius: 2.5,
          fontWeight: 'bold',
          py: 1.25,
          textTransform: 'none',
          fontSize: '0.95rem',
        }}
      >
        {state.deckId ? 'Mettre a jour' : 'Sauvegarder le deck'}
      </Button>

      {!session?.user && (
        <Typography variant="caption" color="text.secondary" textAlign="center">
          Connectez-vous pour sauvegarder vos decks
        </Typography>
      )}
    </Box>
  );
}
