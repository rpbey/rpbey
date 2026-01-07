'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material'
import { Edit, Delete, Link as LinkIcon } from '@mui/icons-material'
import {
  PageHeader,
  useConfirmDialog,
  useToast,
} from '@/components/ui'
import { getTournaments, createTournament, updateTournament, deleteTournament } from './actions'
import type { TournamentInput } from './actions'
import { TournamentDialog } from './TournamentDialog'
import { formatDateShort } from '@/lib/utils'
import type { Tournament } from '@prisma/client'

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<(Tournament & { _count: { participants: number } })[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { confirm, ConfirmDialogComponent } = useConfirmDialog()
  const { showToast } = useToast()

  const fetchTournaments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTournaments()
      // Cast is needed because dates are serialized as strings in server actions
      setTournaments(data as unknown as (Tournament & { _count: { participants: number } })[])
    } catch {
      showToast('Erreur lors de la récupération des tournois', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchTournaments()
  }, [fetchTournaments])

  const handleAdd = () => {
    setSelectedTournament(null)
    setDialogOpen(true)
  }

  const handleEdit = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setDialogOpen(true)
  }

  const handleDelete = async (tournament: Tournament) => {
    const confirmed = await confirm({
      title: 'Supprimer le tournoi',
      message: `Êtes-vous sûr de vouloir supprimer "${tournament.name}" ? Tous les participants seront également retirés.`, 
      confirmText: 'Supprimer',
      confirmColor: 'error',
    })

    if (confirmed) {
      try {
        await deleteTournament(tournament.id)
        showToast('Tournoi supprimé avec succès', 'success')
        fetchTournaments()
      } catch {
        showToast('Erreur lors de la suppression', 'error')
      }
    }
  }

  const handleSubmit = async (data: TournamentInput) => {
    setSubmitting(true)
    try {
      if (selectedTournament) {
        await updateTournament(selectedTournament.id, data)
        showToast('Tournoi mis à jour', 'success')
      } else {
        await createTournament(data)
        showToast('Tournoi créé', 'success')
      }
      setDialogOpen(false)
      fetchTournaments()
    } catch {
      showToast('Erreur lors de l\'enregistrement', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const statusColors: Record<string, 'success' | 'warning' | 'default' | 'info' | 'error'> = {
    REGISTRATION_OPEN: 'success',
    REGISTRATION_CLOSED: 'warning',
    UPCOMING: 'info',
    COMPLETE: 'default',
    UNDERWAY: 'success',
    CHECKIN: 'info',
    CANCELLED: 'error',
  }

  const statusLabels: Record<string, string> = {
    REGISTRATION_OPEN: 'Inscriptions ouvertes',
    REGISTRATION_CLOSED: 'Inscriptions closes',
    UPCOMING: 'À venir',
    COMPLETE: 'Terminé',
    UNDERWAY: 'En cours',
    CHECKIN: 'Check-in',
    CANCELLED: 'Annulé',
  }

  const totalParticipants = tournaments.reduce((acc, t) => acc + t._count.participants, 0)
  const activeTournaments = tournaments.filter(t => 
    ['REGISTRATION_OPEN', 'UNDERWAY', 'CHECKIN'].includes(t.status)
  ).length

  return (
    <Box>
      <PageHeader
        title="Tournois"
        description="Gérez les tournois Beyblade et les participants"
        actionLabel="Nouveau tournoi"
        onAction={handleAdd}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[ 
              { label: 'Total tournois', value: tournaments.length },
              { label: 'En cours / Ouverts', value: activeTournaments },
              { label: 'Participants totaux', value: totalParticipants },
            ].map((stat) => (
              <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" color="primary">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Tournaments Table */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Participants</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tournaments.map((tournament) => (
                    <TableRow key={tournament.id} hover>
                      <TableCell>
                        <Typography fontWeight="bold">{tournament.name}</Typography>
                        {tournament.challongeUrl && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <LinkIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                              {tournament.challongeUrl}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>{formatDateShort(tournament.date)}</TableCell>
                      <TableCell>
                        {tournament._count.participants}/{tournament.maxPlayers}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabels[tournament.status] || tournament.status}
                          color={statusColors[tournament.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="Modifier">
                            <IconButton onClick={() => handleEdit(tournament)} size="small">
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton onClick={() => handleDelete(tournament)} size="small" color="error">
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tournaments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">Aucun tournoi trouvé</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}

      <TournamentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedTournament}
        loading={submitting}
      />
      {ConfirmDialogComponent}
    </Box>
  )
}