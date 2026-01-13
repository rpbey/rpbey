import { Box } from '@mui/material';
import {
  getRankingConfig,
  getTournamentCategories,
} from '@/server/actions/ranking';
import RankingSettingsForm from './RankingSettingsForm';

export const metadata = {
  title: 'Admin - Classements',
};

export default async function RankingAdminPage() {
  const config = await getRankingConfig();
  const categories = await getTournamentCategories();

  return (
    <Box sx={{ py: 4 }}>
      <RankingSettingsForm
        initialConfig={config}
        initialCategories={categories}
      />
    </Box>
  );
}
