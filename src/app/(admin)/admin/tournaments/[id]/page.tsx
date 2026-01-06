/**
 * RPB - Tournament Detail Page
 * View and manage a single tournament with bracket
 */

'use client'

import { use, useState } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from 'next/link'
import useSWR, { mutate } from 'swr'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SyncIcon from '@mui/icons-material/Sync'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PeopleIcon from '@mui/icons-material/People'
import { TournamentBracket, ParticipantList } from '@/components/tournaments'

interface TournamentDetailPageProps {
  params: Promise<{ id: string }>
}

interface Tournament {
  id: string
  name: string
  description: string | null
  date: string
  location: string | null
  format: string
  maxPlayers: number
  status: string
  challongeId: string | null
  challongeUrl: string | null
  participants: Array<{
    id: string
    seed: number | null
    userId: string
    user: {
      id: string
      name: string
      profile?: {
        bladerName?: string
        avatarUrl?: string
      }
      decks?: Array<{
        id: string
        name: string
        isActive: boolean
      }>
    }
  }>
  matches: Array<{
    id: string
    round: number
    state: string
    score: string | null
    player1: {
      id: string
      name: string
      profile?: {
        bladerName?: string
        avatarUrl?: string
      }
    } | null
    player2: {
      id: string
      name: string
      profile?: {
        bladerName?: string
        avatarUrl?: string
      }
    } | null
    winner: {
      id: string
      name: string
      profile?: {
        bladerName?: string
        avatarUrl?: string
      }
    } | null
  }>
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function getStatusColor(status: string) {
  switch (status) {
    case 'UPCOMING':
      return 'info'
    case 'ONGOING':
      return 'warning'
    case 'COMPLETED':
      return 'success'
    case 'CANCELLED':
      return 'error'
    default:
      return 'default'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'UPCOMING':
      return 'À venir'
    case 'ONGOING':
      return 'En cours'
    case 'COMPLETED':
      return 'Terminé'
    case 'CANCELLED':
      return 'Annulé'
    default:
      return status
  }
}

export default function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const { id } = use(params)
  const [tab, setTab] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { data, isLoading, error } = useSWR<{ data: Tournament }>(
    `/api/tournaments/${id}`,
    fetcher
  )

  const tournament = data?.data

  const handleAction = async (action: 'start' | 'finalize' | 'sync') => {
    setActionLoading(action)
    try {
      const response = await fetch(`/api/tournaments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        mutate(`/api/tournaments/${id}`)
      }
    } catch (err) {
      console.error('Action failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveParticipant = async (userId: string) => {
    if (!confirm('Retirer ce participant ?')) return

    try {
      await fetch(`/api/tournaments/${id}/participants?userId=${userId}`, {
        method: 'DELETE',
      })
      mutate(`/api/tournaments/${id}`)
    } catch (err) {
      console.error('Failed to remove participant:', err)
    }
  }

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 3 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    )
  }

  if (error || !tournament) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Tournoi introuvable</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/admin" style={{ textDecoration: 'none', color: 'inherit' }}>
          Admin
        </Link>
        <Link href="/admin/tournaments" style={{ textDecoration: 'none', color: 'inherit' }}>
          Tournois
        </Link>
        <Typography color="text.primary">{tournament.name}</Typography>
      </Breadcrumbs>

      {/* Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" fontWeight="bold">
                  {tournament.name}
                </Typography>
                <Chip
                  label={getStatusLabel(tournament.status)}
                  color={getStatusColor(tournament.status) as 'info' | 'warning' | 'success' | 'error'}
                />
              </Box>

              {tournament.description && (
                <Typography color="text.secondary" sx={{ mb: 2, maxWidth: 600 }}>
                  {tournament.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarTodayIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {new Date(tournament.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>

                {tournament.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2">{tournament.location}</Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {tournament.participants.length} / {tournament.maxPlayers} participants
                  </Typography>
                </Box>

                <Chip label={tournament.format} size="small" variant="outlined" />
              </Box>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <ButtonGroup variant="outlined" size="small">
                {tournament.challongeId && tournament.status === 'UPCOMING' && (
                  <Button
                    startIcon={<PlayArrowIcon />}
                    onClick={() => handleAction('start')}
                    disabled={actionLoading !== null}
                    color="success"
                  >
                    {actionLoading === 'start' ? 'Démarrage...' : 'Démarrer'}
                  </Button>
                )}
                {tournament.challongeId && tournament.status === 'ONGOING' && (
                  <Button
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleAction('finalize')}
                    disabled={actionLoading !== null}
                    color="primary"
                  >
                    {actionLoading === 'finalize' ? 'Finalisation...' : 'Finaliser'}
                  </Button>
                )}
                {tournament.challongeId && (
                  <Button
                    startIcon={<SyncIcon />}
                    onClick={() => handleAction('sync')}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === 'sync' ? 'Sync...' : 'Sync'}
                  </Button>
                )}
              </ButtonGroup>

              {tournament.challongeUrl && (
                <Button
                  size="small"
                  endIcon={<OpenInNewIcon />}
                  href={tournament.challongeUrl}
                  target="_blank"
                  rel="noopener"
                >
                  Challonge
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Bracket" />
        <Tab label={`Participants (${tournament.participants.length})`} />
      </Tabs>

      {/* Tab Panels */}
      {tab === 0 && (
        <Card>
          <CardContent>
            <TournamentBracket matches={tournament.matches} />
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <ParticipantList
              participants={tournament.participants}
              maxPlayers={tournament.maxPlayers}
              canManage={tournament.status === 'UPCOMING'}
              onRemove={handleRemoveParticipant}
            />
          </Grid>
        </Grid>
      )}
    </Container>
  )
}
