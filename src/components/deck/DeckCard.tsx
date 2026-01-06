'use client'

/**
 * DeckCard - Display a deck with its 3 beys
 */

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import StarIcon from '@mui/icons-material/Star'
import StarOutlineIcon from '@mui/icons-material/StarOutline'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import type { Part } from '@prisma/client'
import { parseStat } from '@/lib/utils'

export interface DeckBey {
  id: string
  position: number
  nickname: string | null
  blade: Part
  ratchet: Part
  bit: Part
}

export interface Deck {
  id: string
  name: string
  isActive: boolean
  beys: DeckBey[]
  createdAt: string
  updatedAt: string
}

interface DeckCardProps {
  deck: Deck
  onEdit?: () => void
  onDelete?: () => void
  onActivate?: () => void
}

function BeyLine({ bey }: { bey: DeckBey }) {
  const name = bey.nickname || `${bey.blade.name} ${bey.ratchet.name} ${bey.bit.name}`
  const stats = {
    attack: parseStat(bey.blade.attack),
    defense: parseStat(bey.blade.defense),
    stamina: parseStat(bey.blade.stamina),
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 0.5,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {bey.position}. {name}
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Chip
          size="small"
          label={stats.attack}
          sx={{
            bgcolor: 'error.main',
            color: 'white',
            minWidth: 28,
            height: 20,
            fontSize: '0.7rem',
          }}
        />
        <Chip
          size="small"
          label={stats.defense}
          sx={{
            bgcolor: 'info.main',
            color: 'white',
            minWidth: 28,
            height: 20,
            fontSize: '0.7rem',
          }}
        />
        <Chip
          size="small"
          label={stats.stamina}
          sx={{
            bgcolor: 'success.main',
            color: 'white',
            minWidth: 28,
            height: 20,
            fontSize: '0.7rem',
          }}
        />
      </Box>
    </Box>
  )
}

export function DeckCard({ deck, onEdit, onDelete, onActivate }: DeckCardProps) {
  const sortedBeys = [...deck.beys].sort((a, b) => a.position - b.position)

  // Calculate total stats
  const totalStats = sortedBeys.reduce(
    (acc, bey) => ({
      attack: acc.attack + parseStat(bey.blade.attack),
      defense: acc.defense + parseStat(bey.blade.defense),
      stamina: acc.stamina + parseStat(bey.blade.stamina),
    }),
    { attack: 0, defense: 0, stamina: 0 }
  )

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: deck.isActive ? 2 : 1,
        borderColor: deck.isActive ? 'primary.main' : 'divider',
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" component="h3">
              {deck.isActive && (
                <StarIcon
                  sx={{ fontSize: 18, mr: 0.5, color: 'warning.main' }}
                />
              )}
              {deck.name}
            </Typography>
            {deck.isActive && (
              <Chip
                size="small"
                label="Actif"
                color="primary"
                sx={{ mt: 0.5 }}
              />
            )}
          </Box>
          <Box>
            {onEdit && (
              <IconButton size="small" onClick={onEdit}>
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            {onDelete && (
              <IconButton size="small" onClick={onDelete} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <Stack spacing={0.5}>
          {sortedBeys.map((bey) => (
            <BeyLine key={bey.id} bey={bey} />
          ))}
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Total ATK
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="error.main">
              {totalStats.attack}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Total DEF
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="info.main">
              {totalStats.defense}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Total STA
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="success.main">
              {totalStats.stamina}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {!deck.isActive && onActivate && (
        <CardActions>
          <Button
            size="small"
            startIcon={<StarOutlineIcon />}
            onClick={onActivate}
            fullWidth
          >
            Définir comme actif
          </Button>
        </CardActions>
      )}
    </Card>
  )
}


