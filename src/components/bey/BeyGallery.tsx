'use client';

import CategoryIcon from '@mui/icons-material/Category';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import type { BeyFile, BeyManifest } from '@/types/bey';
import { ModelViewer } from './ModelViewer';

interface BeyGalleryProps {
  manifest: BeyManifest;
}

export function BeyGallery({ manifest }: BeyGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState(
    manifest.categories[0],
  );
  const [selectedModel, setSelectedModel] = useState<BeyFile | null>(null);
  const [selectedTexture, setSelectedTexture] = useState<BeyFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Default texture logic
  const defaultTexture = useMemo(() => {
    return (
      manifest.textures.find((t) => t.name === 'DRANSWORD') ||
      manifest.textures[0]
    );
  }, [manifest]);

  // Filter models
  const filteredModels = useMemo(() => {
    return manifest.models.filter((model) => {
      const matchesCategory = model.category === selectedCategory;
      const matchesSearch =
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (model.subcategory &&
          model.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [manifest.models, selectedCategory, searchQuery]);

  // Filter textures (show all for now, maybe filter by name similarity later?)
  // For simplicity, we list all textures in a separate tab or section?
  // Or just auto-select one?
  // Let's allow picking a texture.

  const currentTexture = selectedTexture || defaultTexture;

  const handleCategoryChange = (_: React.SyntheticEvent, newValue: string) => {
    setSelectedCategory(newValue);
    setSelectedModel(null); // Reset selection on category change
  };

  return (
    <Grid container spacing={3} sx={{ height: 'calc(100vh - 100px)' }}>
      {/* Left Panel: Navigation & List */}
      <Grid
        size={{ xs: 12, md: 4, lg: 3 }}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Paper sx={{ p: 2, mb: 2, borderRadius: 4 }}>
          <TextField
            fullWidth
            placeholder="Rechercher une pièce..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        <Paper
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 4,
          }}
        >
          <Tabs
            value={selectedCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            {manifest.categories.map((cat) => (
              <Tab key={cat} label={cat} value={cat} />
            ))}
          </Tabs>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
            <Stack spacing={1}>
              {filteredModels.map((model) => (
                <Card
                  key={model.path}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor:
                      selectedModel?.path === model.path
                        ? 'primary.main'
                        : 'divider',
                    bgcolor:
                      selectedModel?.path === model.path
                        ? 'action.selected'
                        : 'background.paper',
                  }}
                >
                  <CardActionArea
                    onClick={() => setSelectedModel(model)}
                    sx={{ p: 1.5 }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {model.name}
                        </Typography>
                        {model.subcategory && (
                          <Typography variant="caption" color="text.secondary">
                            {model.subcategory}
                          </Typography>
                        )}
                      </Box>
                      <CategoryIcon fontSize="small" color="disabled" />
                    </Stack>
                  </CardActionArea>
                </Card>
              ))}
              {filteredModels.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  py={4}
                >
                  Aucun modèle trouvé
                </Typography>
              )}
            </Stack>
          </Box>
        </Paper>
      </Grid>

      {/* Right Panel: 3D Viewer */}
      <Grid size={{ xs: 12, md: 8, lg: 9 }} sx={{ height: '100%' }}>
        <Paper
          sx={{
            height: '100%',
            p: 2,
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {selectedModel ? (
            <>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h5" fontWeight="bold">
                  {selectedModel.name}
                </Typography>
                <Chip
                  label={selectedModel.category}
                  color="primary"
                  size="small"
                />
              </Box>

              <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                <ModelViewer
                  modelUrl={selectedModel.path}
                  textureUrl={currentTexture?.path}
                />
              </Box>

              {/* Texture Selector (Mini scrollable strip) */}
              <Box>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color="text.secondary"
                  mb={1}
                  display="block"
                >
                  TEXTURES ({manifest.textures.length})
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ overflowX: 'auto', pb: 1 }}
                >
                  {manifest.textures.map((tex) => (
                    <Box
                      key={tex.path}
                      onClick={() => setSelectedTexture(tex)}
                      sx={{
                        width: 48,
                        height: 48,
                        flexShrink: 0,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '2px solid',
                        borderColor:
                          currentTexture?.path === tex.path
                            ? 'primary.main'
                            : 'transparent',
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 },
                      }}
                    >
                      <img
                        src={tex.path}
                        alt={tex.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        loading="lazy"
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
                opacity: 0.5,
              }}
            >
              <CategoryIcon sx={{ fontSize: 64 }} />
              <Typography variant="h6">
                Sélectionnez une pièce pour l'afficher en 3D
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}
