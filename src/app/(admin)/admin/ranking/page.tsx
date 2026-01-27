import { Box, Container } from '@mui/material';
import { RankingForm } from '@/components/admin/RankingForm';
import { PageHeader } from '@/components/ui';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Admin - Système de Classement',
};



export default async function RankingAdminPage() {
  const rules = await prisma.rankingSystem.findFirst();

  const initialRules = {
    participation: rules?.participation || 500,
    matchWin: rules?.matchWin || 300,
    firstPlace: rules?.firstPlace || 10000,
    secondPlace: rules?.secondPlace || 6000,
    thirdPlace: rules?.thirdPlace || 3000,
    top8: rules?.top8 || 1000,
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Système de Classement"
        description="Configurez les points attribués lors des tournois. Toute modification entraînera un recalcul complet de l'historique."
      />

      <Box sx={{ mt: 4 }}>
        <RankingForm initialRules={initialRules} />
      </Box>
    </Container>
  );
}
