'use client';

/**
 * DeckCard - Display a deck with its 3 beys
 */

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import StarIcon from '@mui/icons-material/Star';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import Avatar from '@mui/material/Avatar';
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
import { alpha, useTheme } from '@mui/material/styles';
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
        py: 1,
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
        <Avatar
          src={bey.blade?.imageUrl || undefined}
          variant="rounded"
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'action.hover',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {bey.position}
        </Avatar>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: partsAvailable ? 'text.primary' : 'text.secondary',
            fontSize: '0.9rem',
          }}
        >
          {name}
        </Typography>
      </Box>
      {partsAvailable && (
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <Chip
            size="small"
            label={stats.attack}
            sx={{
              bgcolor: 'error.main',
              color: 'white',
              minWidth: 28,
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 'bold',
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
              fontWeight: 'bold',
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
              fontWeight: 'bold',
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
  const theme = useTheme();
  const sortedBeys = [...deck.beys].sort((a, b) => a.position - b.position);

  // Calculate total stats
  const totalStats = sortedBeys.reduce(
    (acc, bey) => {
      const parts = [bey.blade, bey.ratchet, bey.bit].filter(Boolean) as Part[];

      const beyStats = parts.reduce(
        (bAcc, part) => ({
          attack: bAcc.attack + parseStat(part.attack),
          defense: bAcc.defense + parseStat(part.defense),
          stamina: bAcc.stamina + parseStat(part.stamina),
          dash: bAcc.dash + parseStat(part.dash),
        }),
        { attack: 0, defense: 0, stamina: 0, dash: 0 },
      );

      return {
        attack: acc.attack + beyStats.attack,
        defense: acc.defense + beyStats.defense,
        stamina: acc.stamina + beyStats.stamina,
        dash: acc.dash + beyStats.dash,
      };
    },
    { attack: 0, defense: 0, stamina: 0, dash: 0 },
  );

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        border: '1px solid',
        borderColor: deck.isActive ? 'primary.main' : 'divider',
        background: deck.isActive
          ? `linear-gradient(180deg, ${alpha(
              theme.palette.primary.main,
              0.05,
            )} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`
          : theme.palette.background.paper,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardContent sx={{ flex: 1, p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" component="h3" fontWeight="800">
              {deck.name}
            </Typography>
            {deck.isActive ? (
              <Chip
                size="small"
                label="Deck Actif"
                color="primary"
                icon={<StarIcon sx={{ fontSize: '1rem !important' }} />}
                sx={{ mt: 0.5, fontWeight: 'bold' }}
              />
            ) : (
              <Typography variant="caption" color="text.disabled">
                Créé le {new Date(deck.createdAt).toLocaleDateString()}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={0.5}>
            {onEdit && (
              <IconButton
                size="small"
                onClick={onEdit}
                sx={{ bgcolor: alpha(theme.palette.text.primary, 0.05) }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                size="small"
                onClick={onDelete}
                color="error"
                sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        </Box>

        <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

        <Stack spacing={1}>
          {sortedBeys.map((bey) => (
            <BeyLine key={bey.id} bey={bey} />
          ))}
        </Stack>

        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-around',
            bgcolor: alpha(theme.palette.text.primary, 0.03),
            py: 1.5,
            borderRadius: 2,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="bold"
            >
              ATK
            </Typography>
            <Typography variant="body2" fontWeight="900" color="error.main">
              {totalStats.attack}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="bold"
            >
              DEF
            </Typography>
            <Typography variant="body2" fontWeight="900" color="info.main">
              {totalStats.defense}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="bold"
            >
              END
            </Typography>
            <Typography variant="body2" fontWeight="900" color="success.main">
              {totalStats.stamina}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="bold"
            >
              DASH
            </Typography>
            <Typography variant="body2" fontWeight="900" color="warning.main">
              {totalStats.dash}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {!deck.isActive && onActivate && (
        <Box sx={{ p: 2, pt: 0 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<StarOutlineIcon />}
            onClick={onActivate}
            fullWidth
            sx={{
              borderRadius: 2,
              fontWeight: 'bold',
              textTransform: 'none',
            }}
          >
            Définir comme actif
          </Button>
        </Box>
      )}
    </Card>
  );
}
