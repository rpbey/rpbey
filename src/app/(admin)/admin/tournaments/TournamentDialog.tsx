'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Grid,
} from '@mui/material'
import { DatePicker } from '@/components/ui'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { Tournament, TournamentStatus } from '@prisma/client'
import type { TournamentInput } from './actions'

interface TournamentDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: TournamentInput) => Promise<void>
  initialData: Tournament | null
  loading: boolean
}

const TOURNAMENT_STATUSES: { value: TournamentStatus; label: string }[] = [
  { value: 'UPCOMING', label: 'À venir' },
  { value: 'REGISTRATION_OPEN', label: 'Inscriptions ouvertes' },
  { value: 'REGISTRATION_CLOSED', label: 'Inscriptions closes' },
  { value: 'CHECKIN', label: 'Check-in' },
  { value: 'UNDERWAY', label: 'En cours' },
  { value: 'COMPLETE', label: 'Terminé' },
  { value: 'CANCELLED', label: 'Annulé' },
]

export function TournamentDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}: TournamentDialogProps) {
  const [formData, setFormData] = useState<Omit<TournamentInput, 'date'> & { date: Dayjs | null }>({
    name: '',
    description: '',
    date: dayjs(),
    location: '',
    format: '3on3 Double Elimination',
    maxPlayers: 64,
    status: 'UPCOMING',
    challongeUrl: '',
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        date: dayjs(initialData.date),
        location: initialData.location || '',
        format: initialData.format,
        maxPlayers: initialData.maxPlayers,
        status: initialData.status,
        challongeUrl: initialData.challongeUrl || '',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        date: dayjs(),
        location: '',
        format: '3on3 Double Elimination',
        maxPlayers: 64,
        status: 'UPCOMING',
        challongeUrl: '',
      })
    }
  }, [initialData, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.date) return
    
    onSubmit({
      ...formData,
      date: formData.date.toDate(),
    } as TournamentInput)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {initialData ? 'Modifier le tournoi' : 'Nouveau tournoi'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nom du tournoi"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Date du tournoi"
                  value={formData.date}
                  onChange={(newValue) => setFormData({ ...formData, date: newValue })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TournamentStatus })}
                  >
                    {TOURNAMENT_STATUSES.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Lieu"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="Max Joueurs"
                  type="number"
                  value={formData.maxPlayers}
                  onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) || 0 })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="Format"
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>

            <TextField
              label="Lien Challonge (Optionnel)"
              value={formData.challongeUrl}
              onChange={(e) => setFormData({ ...formData, challongeUrl: e.target.value })}
              fullWidth
              placeholder="https://challonge.com/..."
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={4}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={loading || !formData.date}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
