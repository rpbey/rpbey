import { prisma } from '../src/lib/prisma';

async function cleanup() {
  console.log("🧹 Début du nettoyage des doublons...");
  
  const allUsers = await prisma.user.findMany({
    include: { profile: true, tournaments: true }
  });

  const stubs = allUsers.filter(u => u.username?.startsWith('bts2_'));
  const realUsers = allUsers.filter(u => !u.username?.startsWith('bts2_'));

  let mergedCount = 0;

  for (const stub of stubs) {
    const stubName = stub.profile?.bladerName?.toLowerCase() || stub.name?.toLowerCase();
    if (!stubName) continue;

    // Chercher un utilisateur réel avec le même nom
    const match = realUsers.find(real => {
      const realName = real.profile?.bladerName?.toLowerCase() || real.name?.toLowerCase();
      return realName === stubName || real.username?.toLowerCase() === stubName;
    });

    if (match) {
      console.log(`🔗 Fusion de ${stub.username} vers ${match.username || match.name} (${stubName})`);
      
      // Transférer les participations
      for (const part of stub.tournaments) {
        try {
          // Vérifier si le vrai utilisateur n'est pas déjà inscrit à ce tournoi
          const existing = await prisma.tournamentParticipant.findUnique({
            where: { id: `tp-${part.tournamentId}-${match.id}` }
          });

          if (!existing) {
            await prisma.tournamentParticipant.update({
              where: { id: part.id },
              data: { 
                id: `tp-${part.tournamentId}-${match.id}`,
                userId: match.id 
              }
            });
          } else {
            // Si le vrai utilisateur est déjà là, on garde la meilleure stat et on supprime le doublon
            await prisma.tournamentParticipant.update({
              where: { id: existing.id },
              data: {
                wins: Math.max(existing.wins, part.wins),
                losses: Math.max(existing.losses, part.losses),
                finalPlacement: Math.min(existing.finalPlacement, part.finalPlacement)
              }
            });
            await prisma.tournamentParticipant.delete({ where: { id: part.id } });
          }
        } catch (e) {
          console.error(`Erreur lors du transfert de participation:`, e);
        }
      }

      // Supprimer le stub
      await prisma.user.delete({ where: { id: stub.id } });
      mergedCount++;
    }
  }

  console.log(`✅ Nettoyage terminé. ${mergedCount} comptes fusionnés.`);
}

cleanup().then(() => prisma.$disconnect());
