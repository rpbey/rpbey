'use client';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
  Collapse,
  CircularProgress,
  alpha
} from '@mui/material';
import type { SatrBlader } from '@prisma/client';
import Link from 'next/link';
import { useState } from 'react';
import { getTournamentTop10 } from '@/server/actions/satr';

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
  const [expandedTournament, setExpandedTournament] = useState<string | null>(null);
  const [top10Data, setTop10Data] = useState<any[]>([]);
  const [loadingTop10, setLoadingTop10] = useState(false);

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

  const handleToggleExpand = async (slug: string) => {
      if (expandedTournament === slug) {
          setExpandedTournament(null);
          return;
      }

      setExpandedTournament(slug);
      setLoadingTop10(true);
      setTop10Data([]);
      
      const res = await getTournamentTop10(slug);
      if (res.success && res.data) {
          setTop10Data(res.data);
      }
      setLoadingTop10(false);
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
        <List sx={{ pt: 0, maxHeight: 500, overflow: 'auto' }}>
          {history
            .slice()
            .reverse()
            .map((h, index) => (
              <Box key={index}>
                <ListItem
                    divider={!expandedTournament || expandedTournament !== h.tournament}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleToggleExpand(h.tournament)}
                    secondaryAction={
                        <Stack direction="row" spacing={1} alignItems="center">
                            <IconButton
                                size="small"
                                component="a"
                                href={getChallongeUrl(h.tournament)}
                                target="_blank"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <OpenInNewIcon sx={{ fontSize: 18, opacity: 0.5 }} />
                            </IconButton>
                            {expandedTournament === h.tournament ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </Stack>
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
                
                <Collapse in={expandedTournament === h.tournament} timeout="auto" unmountOnExit>
                    <Box sx={{ bgcolor: 'action.hover', px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main', mb: 1, display: 'block' }}>
                            Top 10 du tournoi
                        </Typography>
                        
                        {loadingTop10 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                <CircularProgress size={20} />
                            </Box>
                        ) : (
                            <Stack spacing={0.5}>
                                {top10Data.map((top, i) => (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: top.name === blader.name ? 900 : 500, color: top.name === blader.name ? 'primary.main' : 'inherit' }}>
                                            {top.rank}. {top.name}
                                        </Typography>
                                        {top.rank === 1 && <Typography sx={{ fontSize: '0.8rem' }}>🏆</Typography>}
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Box>
                </Collapse>
              </Box>
            ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
