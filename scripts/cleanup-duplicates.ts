import { prisma } from '../src/lib/prisma';

function normalize(s: string | null | undefined): string {
    if (!s) return '';
    return s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
    }
  }
  return matrix[b.length][a.length];
}

async function cleanup() {
  console.log("🧹 Début du nettoyage et de la fusion avancée des doublons...");
  
  const allUsers = await prisma.user.findMany({
    include: { profile: true, tournaments: true }
  });

  const stubs = allUsers.filter(u => u.username?.match(/^bts[1-3]_/));
  const realUsers = allUsers.filter(u => !u.username?.match(/^bts[1-3]_/));

  let mergedCount = 0;

  for (const stub of stubs) {
    const sName = normalize(stub.name || stub.profile?.bladerName || stub.username?.replace(/^bts[1-3]_/, ''));
    if (!sName) continue;

    // Chercher un utilisateur réel avec correspondance floue
    let bestMatch = null;
    let bestReason = '';

    for (const real of realUsers) {
      const rNames = [
        normalize(real.name),
        normalize(real.username),
        normalize(real.profile?.bladerName),
        normalize(real.discordTag)
      ].filter(n => n.length > 0);

      for (const rName of rNames) {
        // 1. Égalité parfaite (Normalisée)
        if (sName === rName) {
            bestMatch = real;
            bestReason = 'Exact';
            break;
        }

        // 2. Inclusion mutuelle (avec garde-fou sur la longueur)
        if ((sName.includes(rName) || rName.includes(sName)) && Math.abs(sName.length - rName.length) <= 3) {
            // Exceptions manuelles pour éviter les faux positifs évidents
            if (sName === 'philou' && rName === 'ilou') continue;
            if (sName === 'ramens' && rName === 'kamenz') continue;
            if (sName === 'kinan' && rName === 'kenun') continue;

            bestMatch = real;
            bestReason = 'Inclusion';
            break;
        }
        
        // 3. Levenshtein (distance de 1 ou 2 max)
        const dist = levenshteinDistance(sName, rName);
        if (dist <= 2 && sName.length > 4) {
             // Exceptions manuelles
            if (sName === 'ramens' && rName === 'kamenz') continue;
            if (sName === 'kinan' && rName === 'kenun') continue;

            bestMatch = real;
            bestReason = `Levenshtein (${dist})`;
            break;
        }
      }
      if (bestMatch) break;
    }

    if (bestMatch) {
      console.log(`🔗 Fusion [${bestReason}]: "${stub.name}" (${sName}) -> "${bestMatch.username || bestMatch.name}" (${bestMatch.id})`);
      
      // 1. Transférer les participations aux tournois
      for (const part of stub.tournaments) {
        try {
          const existing = await prisma.tournamentParticipant.findFirst({
            where: { tournamentId: part.tournamentId, userId: bestMatch.id }
          });

          if (!existing) {
            await prisma.tournamentParticipant.update({
              where: { id: part.id },
              data: { userId: bestMatch.id }
            });
          } else {
            await prisma.tournamentParticipant.update({
              where: { id: existing.id },
              data: {
                wins: Math.max(existing.wins, part.wins),
                losses: Math.max(existing.losses, part.losses),
                finalPlacement: (existing.finalPlacement && part.finalPlacement) ? Math.min(existing.finalPlacement, part.finalPlacement) : (existing.finalPlacement || part.finalPlacement)
              }
            });
            await prisma.tournamentParticipant.delete({ where: { id: part.id } });
          }
        } catch (e: any) {
          console.error(`  ❌ Erreur participation:`, e.message);
        }
      }

      // 2. Transférer les Matchs
      await prisma.tournamentMatch.updateMany({ where: { player1Id: stub.id }, data: { player1Id: bestMatch.id } });
      await prisma.tournamentMatch.updateMany({ where: { player2Id: stub.id }, data: { player2Id: bestMatch.id } });
      await prisma.tournamentMatch.updateMany({ where: { winnerId: stub.id }, data: { winnerId: bestMatch.id } });

      // 3. Supprimer le stub
      if (stub.profile) await prisma.profile.delete({ where: { id: stub.profile.id } });
      await prisma.user.delete({ where: { id: stub.id } });
      mergedCount++;
    }
  }

  console.log(`✅ Nettoyage terminé. ${mergedCount} comptes fusionnés.`);
}

cleanup().then(() => prisma.$disconnect());
