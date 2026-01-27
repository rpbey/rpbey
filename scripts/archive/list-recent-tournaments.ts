
import { prisma } from '../src/lib/prisma';

async function listRecentTournaments() {
  try {
    const tournaments = await prisma.tournament.findMany({
      take: 10,
      where: {
        challongeId: { not: null }
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: { participants: true, matches: true }
        }
      }
    });

    console.log("----- Derniers Tournois -----");
    tournaments.forEach(t => {
      console.log(`ID: ${t.id}`);
      console.log(`Nom: ${t.name}`);
      console.log(`Date: ${t.date}`);
      console.log(`Challonge ID: ${t.challongeId}`);
      console.log(`Challonge URL: ${t.challongeUrl}`);
      console.log(`Status DB: ${t.status}`);
      console.log(`Participants (DB): ${t._count.participants}`);
      console.log(`Matchs (DB): ${t._count.matches}`);
      console.log("-----------------------------");
    });

  } catch (error) {
    console.error("Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listRecentTournaments();
