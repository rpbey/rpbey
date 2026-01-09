import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  console.log('Now:', now.toISOString());
  console.log('Yesterday:', yesterday.toISOString());

  const totalUsers = await prisma.user.count();
  const newUsers = await prisma.user.count({
    where: { createdAt: { gte: yesterday } },
  });
  
  const activeTournaments = await prisma.tournament.count({
    where: {
      status: { in: ['REGISTRATION_OPEN', 'UNDERWAY', 'CHECKIN'] },
    },
  });

  const completedTournamentsToday = await prisma.tournament.count({
    where: {
      status: 'COMPLETE',
      updatedAt: { gte: yesterday },
    },
  });

  const totalParticipations = await prisma.tournamentParticipant.count();

  console.log({
    totalUsers,
    newUsers,
    activeTournaments,
    completedTournamentsToday,
    totalParticipations,
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
