'use client';

import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import type { Deck } from '@/components/deck';
import { DeckBuilderModal, DeckCard } from '@/components/deck';
import { PageHeader } from '@/components/ui';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DeckClient() {
  const { data, isLoading, error: fetchError } = useSWR<{ data: Deck[] }>(
    '/api/decks',
    fetcher
  );
  
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDeck, setDeletingDeck] = useState<Deck | null>(null);

  const decks = data?.data ?? [];

  const handleEdit = (deck: Deck) => {
    setEditingDeck(deck);
    setBuilderOpen(true);
  };

  const handleDelete = (deck: Deck) => {
    setDeletingDeck(deck);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingDeck) return;

    try {
      const response = await fetch(`/api/decks/${deletingDeck.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Impossible de supprimer le deck');
      }

      mutate('/api/decks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingDeck(null);
    }
  };

  const handleActivate = async (deck: Deck) => {
    try {
      const response = await fetch(`/api/decks/${deck.id}/activate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Impossible d'activer le deck");
      }

      mutate('/api/decks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleBuilderClose = () => {
    setBuilderOpen(false);
    setEditingDeck(null);
  };

  const handleBuilderSave = () => {
    mutate('/api/decks');
  };

  return (
    <Box>
      <PageHeader
        title="📦 Mes Decks"
        description="Compose tes decks de 3 Beys pour les tournois 3-on-3"
        actionLabel="Nouveau deck"
        onAction={() => setBuilderOpen(true)}
        actionIcon={<AddIcon />}
      />

      {(error || fetchError) && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error || 'Erreur lors de la récupération des decks'}
        </Alert>
      )}

      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
      ) : decks.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            bgcolor: 'background.paper',
            borderRadius: 4,
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Tu n&apos;as pas encore de deck
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Crée ton premier deck pour participer aux tournois !
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setBuilderOpen(true)}
            sx={{ borderRadius: 3, fontWeight: 'bold' }}
          >
            Créer mon premier deck
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {decks.map((deck) => (
            <Grid key={deck.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <DeckCard
                deck={deck}
                onEdit={() => handleEdit(deck)}
                onDelete={() => handleDelete(deck)}
                onActivate={() => handleActivate(deck)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Deck Builder Modal */}
      <DeckBuilderModal
        open={builderOpen}
        onClose={handleBuilderClose}
        onSave={handleBuilderSave}
        deck={editingDeck}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle>Supprimer le deck ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Es-tu sûr de vouloir supprimer le deck &quot;{deletingDeck?.name}
            &quot; ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">Annuler</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: 2 }}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
