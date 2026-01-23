import fs from 'node:fs';
import path from 'node:path';
import { Box, Container, Typography } from '@mui/material';
import { BeyGallery } from '@/components/bey/BeyGallery';
import type { BeyManifest } from '@/types/bey';
import manifest from '../../../public/bey-manifest.json';

const manifestData = manifest as unknown as BeyManifest;

export const metadata = {
  title: 'BeyLab 3D | RPB',
  description: 'Explorateur de pièces Beyblade X en 3D.',
};

export default async function BeyPage() {
  const bbxDataPath = path.join(process.cwd(), 'public/data/bbx_data.json');
  let bbxData = null;

  if (fs.existsSync(bbxDataPath)) {
    bbxData = JSON.parse(fs.readFileSync(bbxDataPath, 'utf-8'));
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth={false}
        sx={{ py: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h4"
            fontWeight="900"
            sx={{ letterSpacing: '-0.02em' }}
          >
            BEYLAB{' '}
            <Box component="span" color="primary.main">
              3D
            </Box>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {manifestData.stats.models} modèles • {manifestData.stats.textures}{' '}
            textures
          </Typography>
        </Box>

        <BeyGallery manifest={manifestData} bbxData={bbxData} />
      </Container>
    </Box>
  );
}
