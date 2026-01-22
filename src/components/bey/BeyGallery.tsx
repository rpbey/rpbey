'use client';

import CategoryIcon from '@mui/icons-material/Category';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
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
  Divider,
} from '@mui/material';
import { useMemo, useState } from 'react';
import type { BeyFile, BeyManifest } from '@/types/bey';
import { ModelViewer } from './ModelViewer';

// Loose type for BBX Data
interface BBXData {
  "Pic Bank"?: Array<{
    Blade?: string;
    Type?: string;
    System?: string;
    Brand?: string;
    Rotation?: string;
    Ref?: string;
    Ratchet?: string;
    Bit?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

interface BeyGalleryProps {
  manifest: BeyManifest;
  bbxData?: BBXData;
}

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function BeyGallery({ manifest, bbxData }: BeyGalleryProps) {
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

  // Find stats for selected model
  const selectedStats = useMemo(() => {
    if (!selectedModel || !bbxData || !bbxData['Pic Bank']) return null;
    
    const normName = normalize(selectedModel.name);
    
    // Try to find in Pic Bank
    return bbxData['Pic Bank'].find(row => {
      // Check Blade column
      if (row.Blade && normalize(row.Blade).includes(normName)) return true;
      // Check Ref column (e.g. BX-01 DranSword)
      if (row.Ref && normalize(row.Ref).includes(normName)) return true;
      return false;
    });
  }, [selectedModel, bbxData]);

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

      {/* Right Panel: 3D Viewer & Stats */}
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
                <Stack direction="row" spacing={1}>
                  {selectedStats && selectedStats.Type && (
                    <Chip 
                      label={selectedStats.Type} 
                      size="small"
                      sx={{ 
                        bgcolor: selectedStats.Type === 'Attack' ? '#ef4444' : 
                                 selectedStats.Type === 'Defense' ? '#3b82f6' : 
                                 selectedStats.Type === 'Stamina' ? '#22c55e' : 
                                 selectedStats.Type === 'Balance' ? '#eab308' : 'grey.500',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                  <Chip
                    label={selectedModel.category}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </Box>

              <Box sx={{ flexGrow: 1, minHeight: 0, position: 'relative' }}>
                <ModelViewer
                  modelUrl={selectedModel.path}
                  textureUrl={currentTexture?.path}
                />
                
                {/* Stats Overlay */}
                {selectedStats && (
                  <Paper 
                    elevation={3}
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                      width: 280,
                      p: 2,
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      opacity: 0.9,
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom display="flex" alignItems="center" gap={1}>
                      <InfoIcon fontSize="small" color="primary" />
                      Informations
                    </Typography>
                    <Divider sx={{ mb: 1.5 }} />
                    <Stack spacing={1}>
                      {selectedStats.Ref && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">Ref</Typography>
                          <Typography variant="body2" fontWeight="medium">{selectedStats.Ref.split(' ')[0]}</Typography>
                        </Box>
                      )}
                      {selectedStats.System && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">Système</Typography>
                          <Typography variant="body2">{selectedStats.System}</Typography>
                        </Box>
                      )}
                      {selectedStats.Brand && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">Marque</Typography>
                          <Typography variant="body2">{selectedStats.Brand}</Typography>
                        </Box>
                      )}
                      {selectedStats.Rotation && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">Rotation</Typography>
                          <Typography variant="body2">{selectedStats.Rotation}</Typography>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                )}
              </Box>

              {/* Texture Selector */}
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
