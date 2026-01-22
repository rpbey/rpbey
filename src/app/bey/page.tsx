import { Container, Typography, Box } from '@mui/material';
import { BeyGallery } from '@/components/bey/BeyGallery';
import manifest from '../../../public/bey-manifest.json';
import type { BeyManifest } from '@/types/bey';

// Force dynamic because we are importing a JSON that might change? 
// No, standard import is fine for static data.
// But to ensure types matching we cast it.

const data = manifest as unknown as BeyManifest;

export const metadata = {
  title: 'BeyLab 3D | RPB',
  description: 'Explorateur de pièces Beyblade X en 3D.',
};

export default function BeyPage() {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Container maxWidth={false} sx={{ py: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.02em' }}>
            BEYLAB <Box component="span" color="primary.main">3D</Box>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.stats.models} modèles • {data.stats.textures} textures
          </Typography>
        </Box>
        
        <BeyGallery manifest={data} />
      </Container>
    </Box>
  );
}
