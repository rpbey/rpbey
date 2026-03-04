import { prisma } from '../src/lib/prisma';

async function main() {
  console.log("=== Début de la vérification de la qualité des données ===");

  const usersCount = await prisma.user.count();
  const profilesCount = await prisma.profile.count();
  const tournamentsCount = await prisma.tournament.count();
  const matchesCount = await prisma.tournamentMatch.count();
  const participantsCount = await prisma.tournamentParticipant.count();
  
  console.log("\n=== Résumé Global ===");
  console.log(`Utilisateurs (Users): ${usersCount}`);
  console.log(`Profils Bladers (Profiles): ${profilesCount}`);
  console.log(`Tournois (Tournaments): ${tournamentsCount}`);
  console.log(`Participants aux tournois: ${participantsCount}`);
  console.log(`Matchs enregistrés: ${matchesCount}`);

  console.log("\n=== Analyse des Profils ===");
  const profilesWithZeroPoints = await prisma.profile.count({ where: { rankingPoints: 0 } });
  const profilesWithTournaments = await prisma.profile.count({ where: { user: { tournaments: { some: {} } } } });
  const profilesWithoutNames = await prisma.profile.count({ where: { bladerName: null, user: { name: null } } });

  console.log(`Profils avec 0 points: ${profilesWithZeroPoints}`);
  console.log(`Profils actifs (ayant fait au moins 1 tournoi): ${profilesWithTournaments}`);
  console.log(`Profils orphelins (sans pseudo): ${profilesWithoutNames}`);
  
  console.log("\n=== Détection d'Anomalies de Matchs/Points ===");
  const allProfiles = await prisma.profile.findMany();
  let anomalies = 0;
  for (const p of allProfiles) {
    if (p.wins < 0 || p.losses < 0 || p.rankingPoints < 0 || p.tournamentWins < 0) {
      console.log(`[ANOMALIE STATS] ${p.bladerName} a des stats négatives (W: ${p.wins}, L: ${p.losses}, PTS: ${p.rankingPoints}, TW: ${p.tournamentWins})`);
      anomalies++;
    }
  }
  if (anomalies === 0) console.log("✅ Aucune stat négative détectée.");

  console.log("\n=== Cohérence des Matchs de Tournois ===");
  const matchesWithoutWinner = await prisma.tournamentMatch.count({ where: { winnerId: null, state: 'complete' } });
  console.log(`Matchs "complets" sans vainqueur: ${matchesWithoutWinner}`);

  const activeSeasons = await prisma.rankingSeason.findMany({ where: { isActive: true } });
  console.log(`\nSaison active actuelle: ${activeSeasons.length === 1 ? activeSeasons[0].name : (activeSeasons.length === 0 ? 'Aucune' : 'PLUSIEURS (Erreur)')}`);

  console.log("\n=== Top 5 Bladers Actuels ===");
  const topProfiles = await prisma.profile.findMany({
    take: 5,
    orderBy: { rankingPoints: 'desc' },
    select: { bladerName: true, rankingPoints: true, wins: true, losses: true, tournamentWins: true, user: { select: { name: true } } }
  });
  console.table(topProfiles.map(p => ({
    Nom: p.bladerName || p.user?.name,
    Points: p.rankingPoints,
    V: p.wins,
    D: p.losses,
    Tournois_Gagnes: p.tournamentWins
  })));

  console.log("\n=== Fin de la vérification ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
