'use client';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Part } from '@prisma/client';
import { useState } from 'react';
import { ModelViewer } from '@/components/bey/ModelViewer';

interface RandomComboData {
  blade: Part;
  ratchet: Part;
  bit: Part;
}

export function RandomCombo() {
  const [combo, setCombo] = useState<RandomComboData | null>(null);
  const [loading, setLoading] = useState(false);
  const [modelMapping, setModelMapping] = useState<
    Record<string, { model?: string; texture?: string }>
  >({});

  // Load model mapping once
  useState(() => {
    fetch('/data/part-model-map.json')
      .then((res) => res.json())
      .then(setModelMapping)
      .catch((err) => console.error('Failed to load model map', err));
  });

  const generateCombo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/parts/random');
      if (res.ok) {
        const data = await res.json();
        setCombo(data);
      }
    } catch (error) {
      console.error('Failed to generate combo', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useState(() => {
    if (!combo) generateCombo();
  });

  const bladeModel = combo?.blade ? modelMapping[combo.blade.id] : null;

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4, borderRadius: 4 }}>
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Générateur de Combo
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Laisse le hasard décider de ta prochaine toupie !
        </Typography>

        <Box
          sx={{
            height: 300,
            mb: 4,
            borderRadius: 4,
            bgcolor: 'action.hover',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {loading ? (
            <CircularProgress />
          ) : combo ? (
            bladeModel?.model ? (
              <ModelViewer
                modelUrl={bladeModel.model}
                textureUrl={bladeModel.texture}
              />
            ) : (
              <Typography color="text.secondary">
                Aperçu 3D non disponible
              </Typography>
            )
          ) : (
            <CircularProgress />
          )}
        </Box>

        {combo && !loading && (
          <Stack spacing={2} sx={{ mb: 4 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                BLADE
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {combo.blade.name}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  RATCHET
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {combo.ratchet.name}
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  BIT
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {combo.bit.name}
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}
            >
              {/* Stats display if needed */}
              {combo.blade.beyType && (
                <Chip
                  label={combo.blade.beyType}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </Stack>
        )}

        <Button
          variant="contained"
          size="large"
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <AutoAwesomeIcon />
            )
          }
          onClick={generateCombo}
          disabled={loading}
          sx={{
            borderRadius: 8,
            px: 4,
            py: 1.5,
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
            color: 'black',
            boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)',
            '&:hover': {
              background: 'linear-gradient(45deg, #FFC700, #FF9500)',
            },
          }}
        >
          {loading ? 'Génération...' : 'Nouveau Combo Aléatoire'}
        </Button>
      </CardContent>
    </Card>
  );
}
