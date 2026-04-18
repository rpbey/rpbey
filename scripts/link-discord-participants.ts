import { prisma } from '../src/lib/prisma';
import fs from 'node:fs';
import path from 'node:path';

// Fonction de distance de Levenshtein simple
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

async function fetchDiscordMembers() {
  const BOT_API = process.env.BOT_API_URL || 'http://127.0.0.1:3001';
  const API_KEY = process.env.BOT_API_KEY;
  const GUILD_ID = process.env.GUILD_ID;

  if (!GUILD_ID) throw new Error("GUILD_ID manquant");

  console.log('📡 Récupération des rôles Discord...');
  const rolesRes = await fetch(`${BOT_API}/api/roles`, { headers: { 'x-api-key': API_KEY || '' } });
  if (!rolesRes.ok) throw new Error(`Erreur API Bot Roles: ${rolesRes.statusText}`);
  const { roles } = await rolesRes.json();

  const targetRole = roles.find((r: any) => r.name === 'Blader' || r.name === 'Membre' || r.name === 'Citoyen') || roles[0];
  console.log(`📡 Récupération des membres du rôle "${targetRole.name}"...`);
  
  const membersRes = await fetch(`${BOT_API}/api/members-by-role?roleId=${targetRole.id}`, {
    headers: { 'x-api-key': API_KEY || '' }
  });

  if (!membersRes.ok) throw new Error(`Erreur API Bot Members: ${membersRes.statusText}`);
  const { members } = await membersRes.json();
  return members;
}

async function linkParticipants() {
  console.log('🔄 Démarrage du liage avancé...');

  // Chargement du mapping manuel
  const mappingPath = path.resolve(process.cwd(), 'data/discord_mapping.json');
  let manualMapping: Record<string, string> = {};
  if (await Bun.file(mappingPath).exists()) {
    manualMapping = await Bun.file(mappingPath).json();
    console.log(`📂 Mapping manuel chargé : ${Object.keys(manualMapping).length} entrées.`);
  }

  const tournament = await prisma.tournament.findFirst({
    where: { 
        OR: [{ challongeId: '17261774' }, { challongeUrl: { contains: 'B_TS1' } }]
    },
    include: { participants: { include: { user: true } } }
  });

  if (!tournament) {
    console.error('❌ Tournoi B_TS1 non trouvé.');
    return;
  }

  let discordMembers: any[] = [];
  try {
    discordMembers = await fetchDiscordMembers();
    console.log(`✅ ${discordMembers.length} membres Discord récupérés.`);
  } catch (e) {
    console.error('❌ Impossible de récupérer les membres Discord:', e);
    return;
  }

  const uncertainMatches: any[] = [];
  let linkedCount = 0;

  for (const p of tournament.participants) {
    const user = p.user;
    const searchName = user.name || user.username || '';
    if (!searchName) continue;

    let bestMatch: any = null;
    let matchType = 'none'; // 'manual', 'fuzzy', 'exact'

    // 1. Vérification Mapping Manuel (Priorité Absolue)
    if (manualMapping[searchName]) {
        // On cherche le membre par ID ou par Username dans le mapping
        const mappedValue = manualMapping[searchName];
        bestMatch = discordMembers.find(m => m.id === mappedValue || m.username === mappedValue);
        if (bestMatch) matchType = 'manual';
    }

    // 2. Fuzzy Search (Si pas de mapping)
    if (!bestMatch) {
        let bestScore = 0;
        for (const member of discordMembers) {
            const scores = [
                similarity(searchName.toLowerCase(), member.username.toLowerCase()),
                similarity(searchName.toLowerCase(), member.displayName.toLowerCase()),
                member.nickname ? similarity(searchName.toLowerCase(), member.nickname.toLowerCase()) : 0
            ];
            const maxScore = Math.max(...scores);
            if (maxScore > bestScore) {
                bestScore = maxScore;
                bestMatch = member;
            }
        }
        // Seuil strict pour l'automatique
        if (bestScore > 0.85) matchType = 'fuzzy';
        else if (bestScore > 0.5) {
            uncertainMatches.push({
                challongeName: searchName,
                discordProposal: bestMatch?.displayName,
                discordId: bestMatch?.id,
                score: bestScore
            });
            bestMatch = null; // Rejeté
        } else {
            bestMatch = null;
        }
    }

    if (bestMatch) {
      console.log(`🔗 [${matchType.toUpperCase()}] "${searchName}" -> "${bestMatch.username}"`);
      
      // Vérifier si un autre utilisateur a déjà ce discordId
      const existingUser = await prisma.user.findUnique({
        where: { discordId: bestMatch.id }
      });

      if (existingUser && existingUser.id !== user.id) {
        console.log(`🔀 Fusion : Stub (${user.id}) -> Existant (${existingUser.id})`);
        
        // 1. Mettre à jour les participations pour pointer vers l'utilisateur existant
        await prisma.tournamentParticipant.updateMany({
            where: { userId: user.id },
            data: { userId: existingUser.id }
        });

        // 2. Mettre à jour les matchs (Player 1)
        await prisma.tournamentMatch.updateMany({
            where: { player1Id: user.id },
            data: { player1Id: existingUser.id }
        });

        // 3. Mettre à jour les matchs (Player 2)
        await prisma.tournamentMatch.updateMany({
            where: { player2Id: user.id },
            data: { player2Id: existingUser.id }
        });

        // 4. Mettre à jour les matchs (Winner)
        await prisma.tournamentMatch.updateMany({
            where: { winnerId: user.id },
            data: { winnerId: existingUser.id }
        });

        // 5. Supprimer l'utilisateur stub
        await prisma.user.delete({
            where: { id: user.id }
        });

      } else {
        // Mise à jour classique
        await prisma.user.update({
            where: { id: user.id },
            data: {
            discordId: bestMatch.id,
            image: bestMatch.avatar || bestMatch.serverAvatar || user.image,
            discordTag: bestMatch.username,
            globalName: bestMatch.globalName,
            nickname: bestMatch.nickname,
            joinedAt: bestMatch.joinedAt ? new Date(bestMatch.joinedAt) : undefined,
            serverAvatar: bestMatch.serverAvatar,
            roles: bestMatch.roles
            }
        });
      }
      linkedCount++;
    }
  }

  // Sauvegarde des incertitudes
  const uncertainPath = path.resolve(process.cwd(), 'data/uncertain_matches.json');
  await Bun.write(uncertainPath, JSON.stringify(uncertainMatches, null, 2));
  
  console.log(`
📊 Bilan :
   - Liés : ${linkedCount}
   - Incertains : ${uncertainMatches.length} (Voir data/uncertain_matches.json)
   - Total Participants : ${tournament.participants.length}`);
}

linkParticipants()
  .catch(console.error)
  .finally(() => prisma.$disconnect());