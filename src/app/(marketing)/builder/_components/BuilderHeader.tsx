'use client';

import { Add, Close } from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  Skeleton,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { useBuilder } from './BuilderContext';

export function BuilderHeader() {
  const { state, dispatch } = useBuilder();
  const { data: session } = useSession();

  // Load saved decks on mount if authenticated
  useEffect(() => {
    if (!session?.user) return;
    dispatch({ type: 'SET_LOADING_DECKS', loading: true });

    fetch('/api/decks')
      .then((res) => res.json())
      .then(({ data }) => {
        if (data) {
          dispatch({
            type: 'SET_SAVED_DECKS',
            decks: data.map((d: { id: string; name: string; isActive: boolean; updatedAt: string }) => ({
              id: d.id,
              name: d.name,
              isActive: d.isActive,
              updatedAt: d.updatedAt,
            })),
          });
        }
      })
      .catch(() => {})
      .finally(() => dispatch({ type: 'SET_LOADING_DECKS', loading: false }));
  }, [session?.user, dispatch]);

  const handleLoadDeck = useCallback(
    async (deckId: string) => {
      try {
        const res = await fetch(`/api/decks/${deckId}`);
        if (!res.ok) throw new Error();
        const { data } = await res.json();
        dispatch({
          type: 'LOAD_DECK',
          deck: {
            id: data.id,
            name: data.name,
            isActive: data.isActive,
            beys: (data.items || []).map((item: { blade: unknown; ratchet: unknown; bit: unknown; nickname?: string }) => ({
              blade: item.blade,
              ratchet: item.ratchet,
              bit: item.bit,
              nickname: item.nickname || '',
            })),
          },
        });
        toast.success(`Deck "${data.name}" chargé`);
      } catch {
        toast.error('Impossible de charger ce deck');
      }
    },
    [dispatch],
  );

  const handleDeleteDeck = useCallback(
    async (deckId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const res = await fetch(`/api/decks/${deckId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        dispatch({ type: 'DELETE_DECK', deckId });
        toast.success('Deck supprimé');
      } catch {
        toast.error('Impossible de supprimer ce deck');
      }
    },
    [dispatch],
  );

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Typography variant="h5" fontWeight="900" sx={{ mr: 'auto' }}>
        DECK BUILDER
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 0.75,
          alignItems: 'center',
          overflow: 'auto',
          maxWidth: { xs: '100%', md: '60%' },
          pb: 0.5,
        }}
      >
        {state.loadingDecks && (
          <>
            <Skeleton variant="rounded" width={80} height={28} />
            <Skeleton variant="rounded" width={80} height={28} />
          </>
        )}

        {state.savedDecks.map((deck) => (
          <Chip
            key={deck.id}
            label={deck.name}
            variant={state.deckId === deck.id ? 'filled' : 'outlined'}
            onClick={() => handleLoadDeck(deck.id)}
            onDelete={(e) => handleDeleteDeck(deck.id, e as unknown as React.MouseEvent)}
            deleteIcon={<Close sx={{ fontSize: '14px !important' }} />}
            size="small"
            sx={{
              fontWeight: 'bold',
              fontSize: '0.75rem',
              ...(state.deckId === deck.id && {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
                color: 'primary.main',
              }),
              ...(deck.isActive && {
                border: '1px solid',
                borderColor: 'success.main',
              }),
            }}
          />
        ))}

        <IconButton
          size="small"
          onClick={() => dispatch({ type: 'NEW_DECK' })}
          sx={{
            width: 28,
            height: 28,
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Add sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
