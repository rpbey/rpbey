
import { prisma } from '../src/lib/prisma';

async function main() {
  const tournament = await prisma.tournament.findFirst({
    where: { challongeUrl: { contains: 'B_TS1' } },
    include: {
      participants: {
        select: {
          userId: true,
          finalPlacement: true,
          user: { select: { name: true } }
        },
        orderBy: { finalPlacement: 'asc' } // Show winners first
      }
    }
  });

  if (!tournament) {
    console.log('Tournament B_TS1 not found');
    return;
  }

  console.log(`Tournament: ${tournament.name}`);
  console.log('Participants with placement 1 (Winners):');
  
  const winners = tournament.participants.filter(p => p.finalPlacement === 1);
  console.log(JSON.stringify(winners, null, 2));

  console.log('Sample of other participants:');
  console.log(JSON.stringify(tournament.participants.slice(0, 5), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
