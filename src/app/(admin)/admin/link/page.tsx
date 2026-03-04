'use client';

import {
  CheckCircle,
  Link as LinkIcon,
  Search,
  SwapHoriz,
} from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  getAllRealUsers,
  getUnlinkedParticipants,
  mergeUserAccounts,
} from '@/server/actions/admin-link';

interface UserOption {
  id: string;
  name: string | null;
  discordTag: string | null;
  image: string | null;
  profile?: { bladerName: string | null } | null;
}

export default function AdminLinkPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [_isPending, startTransition] = useTransition();
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    string | null
  >(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, uData] = await Promise.all([
        getUnlinkedParticipants(),
        getAllRealUsers(),
      ]);
      setTournaments(tData);
      setAllUsers(uData as any);
      if (tData.length > 0 && !selectedTournamentId) {
        setSelectedTournamentId(tData[0]?.id || null);
      }
    } catch (_err) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMerge = async (placeholderId: string, realUserId: string) => {
    if (
      !confirm(
        "Fusionner ces deux comptes ? L'utilisateur temporaire sera supprimé.",
      )
    )
      return;

    startTransition(async () => {
      try {
        await mergeUserAccounts(placeholderId, realUserId);
        toast.success('Comptes fusionnés avec succès');
        loadData(); // Reload
      } catch (err: any) {
        toast.error(err.message);
      }
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress color="error" />
      </Box>
    );
  }

  const activeTournament = tournaments.find(
    (t) => t.id === selectedTournamentId,
  );

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <LinkIcon sx={{ fontSize: 40, color: 'error.main' }} />
        <Box>
          <Typography variant="h4" fontWeight="900">
            LIAISON DE COMPTES
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Associez les pseudos Challonge des tournois aux vrais comptes
            Discord des joueurs.
          </Typography>
        </Box>
      </Box>

      {/* Selector */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 4, overflowX: 'auto', pb: 1 }}
      >
        {tournaments.map((t) => (
          <Chip
            key={t.id}
            label={t.name}
            onClick={() => setSelectedTournamentId(t.id)}
            color={selectedTournamentId === t.id ? 'error' : 'default'}
            variant={selectedTournamentId === t.id ? 'filled' : 'outlined'}
            sx={{ fontWeight: 'bold' }}
          />
        ))}
      </Stack>

      {!activeTournament ? (
        <Alert severity="info">Aucun tournoi trouvé.</Alert>
      ) : (
        <Grid container spacing={3}>
          {activeTournament.participants.map((p: any) => {
            const isPlaceholder =
              p.user.email.includes('placeholder.rpb') ||
              p.user.email.includes('discord.rpb');
            const hasDiscordId = !!p.user.discordId;

            return (
              <Grid size={{ xs: 12 }} key={p.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: isPlaceholder ? 'warning.main' : 'divider',
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      {/* Left: Challonge Info */}
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            src={p.user.image || undefined}
                            sx={{ bgcolor: 'error.main' }}
                          >
                            {p.user.name?.[0]}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight="900"
                              noWrap
                            >
                              {p.user.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              ID Challonge: {p.challongeParticipantId}
                            </Typography>
                            {isPlaceholder ? (
                              <Chip
                                label="TEMP"
                                size="small"
                                color="warning"
                                sx={{
                                  height: 16,
                                  fontSize: '0.6rem',
                                  fontWeight: 900,
                                  mt: 0.5,
                                }}
                              />
                            ) : hasDiscordId ? (
                              <Chip
                                label="LIÉ"
                                size="small"
                                color="success"
                                icon={
                                  <CheckCircle
                                    sx={{ fontSize: '10px !important' }}
                                  />
                                }
                                sx={{
                                  height: 16,
                                  fontSize: '0.6rem',
                                  fontWeight: 900,
                                  mt: 0.5,
                                }}
                              />
                            ) : null}
                          </Box>
                        </Stack>
                      </Grid>

                      {/* Middle: Action */}
                      <Grid
                        size={{ xs: 12, md: 1 }}
                        sx={{ display: 'flex', justifyContent: 'center' }}
                      >
                        <SwapHoriz sx={{ color: 'text.disabled' }} />
                      </Grid>

                      {/* Right: Discord Matcher */}
                      <Grid size={{ xs: 12, md: 7 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Autocomplete
                            fullWidth
                            size="small"
                            options={allUsers}
                            getOptionLabel={(option) =>
                              `${option.name} (@${option.discordTag})`
                            }
                            renderOption={(props, option) => (
                              <Box component="li" {...props} sx={{ gap: 2 }}>
                                <Avatar
                                  src={option.image || undefined}
                                  sx={{ width: 24, height: 24 }}
                                />
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {option.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    @{option.discordTag}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                            onChange={(_, newValue) => {
                              if (newValue) handleMerge(p.user.id, newValue.id);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Lier à un compte Discord..."
                                placeholder="Rechercher par nom..."
                                slotProps={{
                                  input: {
                                    ...params.InputProps,
                                    startAdornment: (
                                      <>
                                        <Search
                                          fontSize="small"
                                          sx={{ mr: 1, color: 'text.disabled' }}
                                        />
                                        {params.InputProps.startAdornment}
                                      </>
                                    ),
                                  },
                                }}
                              />
                            )}
                          />
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
