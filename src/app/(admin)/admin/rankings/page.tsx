import { Box, Typography } from '@mui/material';
import SeasonManager from '@/components/admin/rankings/SeasonManager';
import {
  getRankingConfig,
  getTournamentCategories,
} from '@/server/actions/ranking';
import { getSeasons } from '@/server/actions/season';
import PointAdjustmentList from './PointAdjustmentList';
import RankingSettingsForm from './RankingSettingsForm';

export const metadata = {
  title: 'Admin - Classements',
};

export default async function RankingAdminPage() {
  const config = await getRankingConfig();
  const categories = await getTournamentCategories();
  const seasons = await getSeasons();

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

      <SeasonManager seasons={seasons} />

      <RankingSettingsForm
        initialConfig={config}
        initialCategories={categories}
      />

      <PointAdjustmentList />
    </Box>
  );
}
