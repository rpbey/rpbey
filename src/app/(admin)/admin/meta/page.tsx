'use client';

import {
  Box,
  Card,
  CardContent,
  Grid2 as Grid,
  Typography,
} from '@mui/material';
import { Hub } from '@mui/icons-material';

export default function AdminMetaPage() {
  return (
    <Box sx={{ px: { xs: 1, sm: 0 } }}>
      <Box 
        sx={{ 
          mb: { xs: 3, md: 4 }, 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          gap: { xs: 1, sm: 2 } 
        }}
      >
        <Box 
          sx={{ 
            p: 1.5, 
            borderRadius: 3, 
            bgcolor: 'rgba(220, 38, 38, 0.1)', 
            display: 'flex' 
          }}
        >
          <Hub sx={{ fontSize: { xs: 32, md: 40 }, color: 'error.main' }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
            GESTION META
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configuration des pièces, équilibrage et tendances du jeu.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Statistiques Globales
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Analyse de l'utilisation des pièces dans les decks de la communauté.
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.disabled" fontWeight="bold">
                  DONNÉES EN ATTENTE DE SYNCHRONISATION
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Tier List Officielle
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Gérez le classement de puissance des pièces Beyblade X.
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.disabled" fontWeight="bold">
                  MODULE TIER LIST NON ACTIVÉ
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Alertes Équilibrage
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Suivi des pièces dominantes ou problématiques (Power Creep).
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.disabled" fontWeight="bold">
                  AUCUNE ALERTE DÉTECTÉE
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

