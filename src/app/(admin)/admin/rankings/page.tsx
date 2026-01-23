import { Box, Typography } from '@mui/material';
import {
  getRankingConfig,
  getTournamentCategories,
} from '@/server/actions/ranking';
import PointAdjustmentList from './PointAdjustmentList';
import RankingSettingsForm from './RankingSettingsForm';

export const metadata = {
  title: 'Admin - Classements',
};

export default async function RankingAdminPage() {
  const config = await getRankingConfig();
  const categories = await getTournamentCategories();

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Gestion des Classements
        </Typography>
        <Typography color="text.secondary">
          Configurez le barème des points, les catégories de tournois et gérez
          les ajustements manuels.
        </Typography>
      </Box>

      <RankingSettingsForm
        initialConfig={config}
        initialCategories={categories}
      />

      <PointAdjustmentList />
    </Box>
  );
}
