'use client'

/**
 * Deck Management Page
 * /dashboard/deck - View, create, edit decks
 */

import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import AddIcon from '@mui/icons-material/Add'
import { DeckCard, DeckBuilderModal } from '@/components/deck'
import type { Deck } from '@/components/deck'

export default function DeckPage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingDeck, setDeletingDeck] = useState<Deck | null>(null)

  const fetchDecks = useCallback(async () => {
    try {
      const response = await fetch('/api/decks')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch decks')
      }

      setDecks(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDecks()
  }, [fetchDecks])

  const handleEdit = (deck: Deck) => {
    setEditingDeck(deck)
    setBuilderOpen(true)
  }

  const handleDelete = (deck: Deck) => {
    setDeletingDeck(deck)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingDeck) return

    try {
      const response = await fetch(`/api/decks/${deletingDeck.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete deck')
      }

      setDecks(decks.filter((d) => d.id !== deletingDeck.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setDeleteDialogOpen(false)
      setDeletingDeck(null)
    }
  }

  const handleActivate = async (deck: Deck) => {
    try {
      const response = await fetch(`/api/decks/${deck.id}/activate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to activate deck')
      }

      // Update local state
      setDecks(
        decks.map((d) => ({
          ...d,
          isActive: d.id === deck.id,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleBuilderClose = () => {
    setBuilderOpen(false)
    setEditingDeck(null)
  }

  const handleBuilderSave = () => {
    fetchDecks()
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            📦 Mes Decks
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Compose tes decks de 3 Beys pour les tournois 3-on-3
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setBuilderOpen(true)}
        >
          Nouveau Deck
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={300} />
            </Grid>
          ))}
        </Grid>
      ) : decks.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            bgcolor: 'background.paper',
            borderRadius: 2,
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
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Supprimer le deck ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Es-tu sûr de vouloir supprimer le deck &quot;{deletingDeck?.name}&quot; ? Cette
            action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
