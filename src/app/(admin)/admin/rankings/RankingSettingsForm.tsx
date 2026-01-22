'use client';

import { Add, Delete, Refresh, Save } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  createTournamentCategory,
  deleteTournamentCategory,
  recalculateRankings,
  updateRankingConfig,
} from '@/server/actions/ranking';

interface RankingConfig {
  participation: number;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  top8: number;
  matchWin: number;
}

interface Category {
  id: string;
  name: string;
  multiplier: number;
  color?: string | null;
}

export default function RankingSettingsForm({
  initialConfig,
  initialCategories,
}: {
  initialConfig: RankingConfig;
  initialCategories: Category[];
}) {
  const [config, setConfig] = useState(initialConfig);
  const [categories, setCategories] = useState(initialCategories);
  const [newCat, setNewCat] = useState({ name: '', multiplier: 1.0 });
  const [loading, setLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: parseInt(value, 10) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await updateRankingConfig(config);
      setMessage({
        type: 'success',
        text: 'Configuration enregistrée avec succès.',
      });
    } catch {
      setMessage({ type: 'error', text: "Erreur lors de l'enregistrement." });
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (
      !confirm(
        'Êtes-vous sûr de vouloir recalculer tous les points de classement ? Cette opération peut prendre quelques secondes.',
      )
    )
      return;

    setRecalcLoading(true);
    setMessage(null);
    try {
      const res = await recalculateRankings();
      setMessage({ type: 'success', text: res.message });
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors du recalcul.' });
    } finally {
      setRecalcLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCat.name) return;
    try {
      const res = await createTournamentCategory(newCat);
      setCategories([...categories, res]);
      setNewCat({ name: '', multiplier: 1.0 });
      setMessage({ type: 'success', text: 'Catégorie ajoutée.' });
    } catch {
      setMessage({
        type: 'error',
        text: "Erreur lors de l'ajout de la catégorie.",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteTournamentCategory(id);
      setCategories(categories.filter((c) => id !== c.id));
      setMessage({ type: 'success', text: 'Catégorie supprimée.' });
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de la suppression.';
      setMessage({ type: 'error', text: msg });
    }
  };

  return (
    <Box>
      {message && (
        <Alert
          severity={message.type}
          sx={{ mb: 3 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader
                title="Configuration des Points de Base"
                subheader="Définissez les points attribués pour chaque action."
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Participation"
                      name="participation"
                      type="number"
                      value={config.participation}
                      onChange={handleChange}
                      helperText="Points attribués pour la participation à un tournoi"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Victoire de Match"
                      name="matchWin"
                      type="number"
                      value={config.matchWin}
                      onChange={handleChange}
                      helperText="Points par match gagné (dans le bracket)"
                    />
                  </Grid>

                  <Grid size={12}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, mt: 1, color: 'text.secondary' }}
                    >
                      Bonus de Placement
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="1ère Place"
                      name="firstPlace"
                      type="number"
                      value={config.firstPlace}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="2ème Place"
                      name="secondPlace"
                      type="number"
                      value={config.secondPlace}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="3ème Place"
                      name="thirdPlace"
                      type="number"
                      value={config.thirdPlace}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Top 8"
                      name="top8"
                      type="number"
                      value={config.top8}
                      onChange={handleChange}
                      helperText="Points bonus pour avoir atteint le Top 8"
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <Divider />
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                }}
              >
                <Button
                  variant="contained"
                  type="submit"
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Save />
                    )
                  }
                  disabled={loading || recalcLoading}
                >
                  Enregistrer
                </Button>
              </Box>
            </Card>
          </form>

          <Card sx={{ mt: 3 }}>
            <CardHeader
              title="Catégories de Tournois"
              subheader="Définissez des multiplicateurs par type de tournoi (ex: Major x1.5)."
            />
            <Divider />
            <CardContent>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ mb: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom</TableCell>
                      <TableCell align="right">Multiplicateur</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell>{cat.name}</TableCell>
                        <TableCell align="right">
                          x{cat.multiplier.toFixed(1)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteCategory(cat.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell>
                        <TextField
                          size="small"
                          placeholder="Nouvelle catégorie..."
                          fullWidth
                          value={newCat.name}
                          onChange={(e) =>
                            setNewCat({ ...newCat, name: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          sx={{ width: 100 }}
                          value={newCat.multiplier}
                          onChange={(e) =>
                            setNewCat({
                              ...newCat,
                              multiplier: parseFloat(e.target.value) || 1,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button startIcon={<Add />} onClick={handleAddCategory}>
                          Ajouter
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title="Actions" subheader="Opérations de maintenance" />
            <Divider />
            <CardContent>
              <Typography variant="body2" color="text.secondary" paragraph>
                Si vous changez les règles de points ou si vous modifiez
                manuellement des résultats de tournoi, vous devez relancer le
                calcul des points pour que le classement soit mis à jour.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                onClick={handleRecalculate}
                startIcon={
                  recalcLoading ? <CircularProgress size={20} /> : <Refresh />
                }
                disabled={loading || recalcLoading}
              >
                Recalculer les classements
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
