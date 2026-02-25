import { prisma } from '../src/lib/prisma';
import dotenv from 'dotenv';

dotenv.config();

// Distance de Levenshtein pour la similarité
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;
  return (longerLength - levenshteinDistance(longer, shorter)) / longerLength;
}

function normalize(s: string | null | undefined): string {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

async function autoLink() {
  console.log('🔄 Démarrage de la liaison automatique (Identiques ou Similaires)...');

  // 1. Récupérer les utilisateurs "réels" (ceux avec un discordId)
  const realUsers = await prisma.user.findMany({
    where: { NOT: { discordId: null } },
    include: { profile: true }
  });

  // 2. Récupérer les utilisateurs "temporaires" (ceux créés par les imports Challonge)
  // On les reconnaît à leur email placeholder.rpb ou discord.rpb
  const tempUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'placeholder.rpb' } },
        { email: { contains: 'discord.rpb' } }
      ],
      discordId: null // Sécurité : pas de discordId
    },
    include: { profile: true }
  });

  console.log(`📊 Comparaison de ${tempUsers.length} comptes temporaires avec ${realUsers.length} comptes réels...`);

  let autoLinkedCount = 0;

  for (const temp of tempUsers) {
    const tempName = normalize(temp.name);
    if (!tempName) continue;

    let bestMatch = null;
    let maxScore = 0;

    for (const real of realUsers) {
      const namesToCompare = [
        normalize(real.name),
        normalize(real.discordTag),
        normalize(real.globalName),
        normalize(real.nickname),
        normalize(real.profile?.bladerName)
      ].filter(n => n.length > 0);

      const scores = namesToCompare.map(n => similarity(tempName, n));
      const currentBest = Math.max(...scores);

      if (currentBest > maxScore) {
        maxScore = currentBest;
        bestMatch = real;
      }
    }

    // Seuil de confiance : 0.9 (très proche ou identique)
    if (bestMatch && maxScore >= 0.9) {
      console.log(`🔗 Match trouvé (${Math.round(maxScore * 100)}%) : "${temp.name}" -> "${bestMatch.name}"`);
      
      try {
        await prisma.$transaction(async (tx) => {
          // Fusionner les données vers le compte réel
          await tx.tournamentParticipant.updateMany({
            where: { userId: temp.id },
            data: { userId: bestMatch.id }
          });

          await tx.tournamentMatch.updateMany({
            where: { player1Id: temp.id },
            data: { player1Id: bestMatch.id }
          });

          await tx.tournamentMatch.updateMany({
            where: { player2Id: temp.id },
            data: { player2Id: bestMatch.id }
          });

          await tx.tournamentMatch.updateMany({
            where: { winnerId: temp.id },
            data: { winnerId: bestMatch.id }
          });

          await tx.deck.updateMany({
            where: { userId: temp.id },
            data: { userId: bestMatch.id }
          });

          // Supprimer le compte temporaire
          await tx.user.delete({
            where: { id: temp.id }
          });
        });
        autoLinkedCount++;
      } catch (err) {
        console.error(`❌ Erreur fusion "${temp.name}":`, err);
      }
    }
  }

  console.log(`
✅ Opération terminée.
   - Comptes temporaires fusionnés : ${autoLinkedCount}
   - Reste à lier manuellement : ${tempUsers.length - autoLinkedCount}
  `);
}

autoLink()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
