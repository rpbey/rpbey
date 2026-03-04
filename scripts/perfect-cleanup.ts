import { prisma } from '../src/lib/prisma';

// Configuration des fusions manuelles connues
const MANUAL_MERGES: Record<string, string> = {
  'bts2_09illu': 'illuca',
  'bts2_satrzeikuo': 'zeikuo',
  'bts2_satrmewxy': 'mewxyb',
  'bts2_tategamii': 'tategami',
  'bts2_noiri': 'noiri7',
  'bts2_vincentmp': 'vincentmp4',
  'bts2_hyakutakee': 'hyakutake.',
  'lotteuxsqwa': 'lotteux',
  'bts2_kiiro': 'kiirohhh',
  'bts2_upolemno': 'upolemmo',
  'tategamii': 'tategami',
  'upolemno': 'upolemmo',
  'satrzeikuo': 'zeikuo',
  'satrmewxy': 'mewxyb',
  '09illu': 'illuca'
};

// Préfixes à nettoyer (avec variations collées)
const PREFIXES = [
  'SAtR | ', '𝓡𝓟𝓑 | ', 'Team_Arc ', 'RPB | ', 'SAtR|',
  'SAtR', 'RPB', 'TeamArc',
  'bts1_', 'bts2_', 'bts3_'
];

function cleanName(name: string | null | undefined): string {
  if (!name) return '';
  let cleaned = name;
  for (const prefix of PREFIXES) {
    cleaned = cleaned.replace(prefix, '');
  }
  // Supprimer les suffixes spécifiques
  cleaned = cleaned.replace(/sqwa$/i, ''); 
  return cleaned.trim();
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
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

async function mergeUsers(sourceId: string, targetId: string) {
  if (sourceId === targetId) return;

  const source = await prisma.user.findUnique({ 
    where: { id: sourceId }, 
    include: { profile: true, tournaments: true, seasonEntries: true } 
  });
  const target = await prisma.user.findUnique({ 
    where: { id: targetId }, 
    include: { profile: true } 
  });

  if (!source || !target) return;

  console.log(`🔗 Fusion : "${source.username || source.name}" -> "${target.username || target.name}"`);

  // 1. Fusionner les points et stats du profil
  if (source.profile && target.profile) {
    await prisma.profile.update({
      where: { id: target.profile.id },
      data: {
        rankingPoints: target.profile.rankingPoints + source.profile.rankingPoints,
        wins: target.profile.wins + source.profile.wins,
        losses: target.profile.losses + source.profile.losses,
        tournamentWins: target.profile.tournamentWins + source.profile.tournamentWins,
      }
    });
  }

  // 2. Transférer les participations aux tournois
  for (const part of source.tournaments) {
    const existing = await prisma.tournamentParticipant.findFirst({
      where: { tournamentId: part.tournamentId, userId: targetId }
    });
    if (!existing) {
      await prisma.tournamentParticipant.update({ where: { id: part.id }, data: { userId: targetId } });
    } else {
      await prisma.tournamentParticipant.delete({ where: { id: part.id } });
    }
  }

  // 3. Transférer les Matchs
  await prisma.tournamentMatch.updateMany({ where: { player1Id: sourceId }, data: { player1Id: targetId } });
  await prisma.tournamentMatch.updateMany({ where: { player2Id: sourceId }, data: { player2Id: targetId } });
  await prisma.tournamentMatch.updateMany({ where: { winnerId: sourceId }, data: { winnerId: targetId } });

  // 4. Supprimer la source (et son profil)
  if (source.profile) await prisma.profile.delete({ where: { id: source.profile.id } });
  await prisma.user.delete({ where: { id: sourceId } });
}

async function main() {
  console.log("🚀 Nettoyage et fusion des données...");

  // 1. Nettoyage des noms
  const allProfiles = await prisma.profile.findMany({ include: { user: true } });
  for (const profile of allProfiles) {
    const currentName = profile.bladerName || '';
    const cleaned = cleanName(currentName);
    
    if (cleaned && cleaned !== currentName) {
      console.log(`✨ Clean : "${currentName}" -> "${cleaned}"`);
      await prisma.profile.update({
        where: { id: profile.id },
        data: { bladerName: cleaned }
      });
    }
  }

  // 2. Fusions manuelles
  const users = await prisma.user.findMany();
  for (const [sourceSlug, targetSlug] of Object.entries(MANUAL_MERGES)) {
    const source = users.find(u => u.username === sourceSlug || normalize(u.name || '') === normalize(sourceSlug));
    const target = users.find(u => u.username === targetSlug || normalize(u.name || '') === normalize(targetSlug));
    
    if (source && target && source.id !== target.id) {
      await mergeUsers(source.id, target.id);
    }
  }

  // 3. Détection automatique des doublons (Fuzzy)
  // Re-fetch après fusions manuelles
  const remainingProfiles = await prisma.profile.findMany({ include: { user: true } });
  const seenNames = new Map<string, string>(); // normalizedName -> userId

  for (const p of remainingProfiles) {
    const name = normalize(p.bladerName || p.user?.name || '');
    if (!name) continue;

    let merged = false;
    for (const [seenName, userId] of seenNames.entries()) {
      const dist = levenshteinDistance(name, seenName);
      
      // Merge if names are identical OR very close
      // dist 1 for names > 4 chars, dist 2 for names > 8 chars
      const isMatch = (dist === 0) || (dist === 1 && name.length > 4) || (dist <= 2 && name.length > 8);

      if (isMatch) {
        const sourceId = p.userId;
        const targetId = userId;
        if (sourceId !== targetId) {
          console.log(`🤖 Auto-merge : ${name} <-> ${seenName} (dist ${dist})`);
          await mergeUsers(sourceId, targetId);
          merged = true;
          break;
        }
      }
    }
    
    if (!merged) {
      seenNames.set(name, p.userId);
    }
  }

  console.log("✅ Opération terminée.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
