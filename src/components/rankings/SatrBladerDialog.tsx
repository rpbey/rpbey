'use client';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import type { SatrBlader } from '@prisma/client';
import Link from 'next/link';

interface SatrBladerDialogProps {
  blader: SatrBlader | null;
  open: boolean;
  onClose: () => void;
}

export function SatrBladerDialog({
  blader,
  open,
  onClose,
}: SatrBladerDialogProps) {
  if (!blader) return null;

  const history = blader.history as any[];
  const totalMatches = blader.totalWins + blader.totalLosses;
  const winrate =
    totalMatches > 0
      ? ((blader.totalWins / totalMatches) * 100).toFixed(1)
      : '0';

  const getChallongeUrl = (tournamentSlug: string) => {
    const slug = tournamentSlug.toLowerCase();
    return `https://challonge.com/fr/${slug}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Parcours : {blader.name}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 2, pb: 2 }}>
          <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Winrate
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {winrate}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Matchs
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {totalMatches}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Tournois
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {blader.tournamentsCount}
              </Typography>
            </Box>
          </Stack>

          {blader.linkedUserId && (
            <Button
              variant="outlined"
              startIcon={<AccountCircleIcon />}
              component={Link}
              href={`/profile/${blader.linkedUserId}`}
              fullWidth
              sx={{ mb: 2, borderRadius: 2, textTransform: 'none' }}
            >
              Voir le Profil RPB
            </Button>
          )}

          <Divider />
        </Box>
        <List sx={{ pt: 0, maxHeight: 400, overflow: 'auto' }}>
          {history
            .slice()
            .reverse()
            .map((h, index) => (
              <ListItem
                key={index}
                divider={index !== history.length - 1}
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    component="a"
                    href={getChallongeUrl(h.tournament)}
                    target="_blank"
                  >
                    <OpenInNewIcon sx={{ fontSize: 18, opacity: 0.5 }} />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={h.tournament.toUpperCase().replace('_', ' ')}
                  secondary={`${h.wins}W - ${h.losses}L`}
                  primaryTypographyProps={{
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}
                />
                <Chip
                  label={`#${h.rank || '?'}`}
                  size="small"
                  color={h.rank && h.rank <= 3 ? 'warning' : 'default'}
                  sx={{
                    fontWeight: 'bold',
                    mr: 2,
                    minWidth: 45,
                    bgcolor:
                      h.rank === 1
                        ? '#FFD700'
                        : h.rank === 2
                          ? '#C0C0C0'
                          : h.rank === 3
                            ? '#CD7F32'
                            : undefined,
                    color: h.rank && h.rank <= 3 ? 'black' : 'inherit',
                  }}
                />
              </ListItem>
            ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
