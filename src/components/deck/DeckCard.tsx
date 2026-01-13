'use client';

/**
 * DeckCard - Display a deck with its 3 beys
 */

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import StarIcon from '@mui/icons-material/Star';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Part } from '@prisma/client';
import { parseStat } from '@/lib/utils';

export interface DeckBey {
  id: string;
  position: number;
  nickname: string | null;
  blade: Part | null;
  ratchet: Part | null;
  bit: Part | null;
}

export interface Deck {
  id: string;
  name: string;
  isActive: boolean;
  beys: DeckBey[];
  createdAt: string;
  updatedAt: string;
}

interface DeckCardProps {
  deck: Deck;
  onEdit?: () => void;
  onDelete?: () => void;
  onActivate?: () => void;
}

function BeyLine({ bey }: { bey: DeckBey }) {
  const partsAvailable = bey.blade && bey.ratchet && bey.bit;
  const name =
    bey.nickname ||
    (partsAvailable
      ? `${bey.blade?.name} ${bey.ratchet?.name} ${bey.bit?.name}`
      : 'Bey incomplet');

  const stats = partsAvailable
    ? {
        attack: parseStat(bey.blade?.attack),
        defense: parseStat(bey.blade?.defense),
        stamina: parseStat(bey.blade?.stamina),
        dash: parseStat(bey.blade?.dash),
      }
    : { attack: 0, defense: 0, stamina: 0, dash: 0 };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 0.5,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          color: partsAvailable ? 'text.primary' : 'text.secondary',
        }}
      >
        {bey.position}. {name}
      </Typography>
      {partsAvailable && (
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
          <Chip
            size="small"
            label={`X ${stats.dash}`}
            sx={{
              bgcolor: 'warning.main',
              color: 'black',
              minWidth: 28,
              height: 20,
              fontSize: '0.7rem',
            }}
          />
        </Box>
      )}
    </Box>
  );
}

export function DeckCard({
  deck,
  onEdit,
  onDelete,
  onActivate,
}: DeckCardProps) {
  const sortedBeys = [...deck.beys].sort((a, b) => a.position - b.position);

  // Calculate total stats
  const totalStats = sortedBeys.reduce(
    (acc, bey) => ({
      attack: acc.attack + (bey.blade ? parseStat(bey.blade.attack) : 0),
      defense: acc.defense + (bey.blade ? parseStat(bey.blade.defense) : 0),
      stamina: acc.stamina + (bey.blade ? parseStat(bey.blade.stamina) : 0),
      dash: acc.dash + (bey.blade ? parseStat(bey.blade.dash) : 0),
    }),
    { attack: 0, defense: 0, stamina: 0, dash: 0 },
  );

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

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              ATK
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="error.main">
              {totalStats.attack}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              DEF
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="info.main">
              {totalStats.defense}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              STA
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="success.main">
              {totalStats.stamina}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              X
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="warning.main">
              {totalStats.dash}
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
  );
}
