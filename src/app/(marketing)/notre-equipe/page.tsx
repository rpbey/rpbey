import { Box, Typography } from '@mui/material';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { TeamClientContent } from './TeamClientContent';

export const metadata = {
  title: 'Notre Équipe | RPB',
  description:
    'Découvrez les passionnés qui font vivre la République Populaire du Beyblade.',
};

const TEAM_LABELS: Record<string, string> = {
  admin: 'Administration',
  rh: 'Ressources Humaines',
  modo: 'Modération',
  arbitre: 'Arbitrage',
  staff: 'Staff',
  dev: 'Développement',
  event: 'Événementiel',
  media: 'Média / Design',
};

const TEAM_ORDER = ['admin', 'rh', 'modo', 'arbitre', 'staff', 'dev', 'event', 'media'];

export default async function TeamPage() {
  await headers();
  const members = await prisma.staffMember.findMany({
    where: { isActive: true },
    orderBy: [{ teamId: 'asc' }, { displayIndex: 'asc' }],
  });

  if (members.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 20 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Notre Équipe
        </Typography>
        <Typography variant="h6" color="text.secondary">
          L'équipe est en cours de formation... Revenez bientôt !
        </Typography>
      </Box>
    );
  }

  // Group members by team
  const groupedMembers = members.reduce(
    (acc, member) => {
      if (!acc[member.teamId]) {
        acc[member.teamId] = [];
      }
      acc[member.teamId]?.push(member);
      return acc;
    },
    {} as Record<string, typeof members>,
  );

  return (
    <TeamClientContent
      groupedMembers={groupedMembers}
      teamLabels={TEAM_LABELS}
      teamOrder={TEAM_ORDER}
    />
  );
}
