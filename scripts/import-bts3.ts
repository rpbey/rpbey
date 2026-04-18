import { ChallongeScraper } from '../src/lib/scrapers/challonge-scraper';
import { prisma } from '../src/lib/prisma';
import fs from 'node:fs';

const LOCK_FILE = '/tmp/sync-bts3.lock';

function normalize(s: string | null | undefined): string {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

async function main() {
  if (await Bun.file(LOCK_FILE).exists()) {
    fs.unlinkSync(LOCK_FILE);
  }
  await Bun.write(LOCK_FILE, process.pid.toString());

  const scraper = new ChallongeScraper();
  const slug = 'fr/B_TS3';
  const tournamentId = 'cm-bts3-auto-imported';
  const categoryId = 'cmkxcqif90000rma3yonpba8r'; // BEY-TAMASHII SERIES

  try {
    console.log(`🚀 Importation de ${slug}...`);
    const result = await scraper.scrape(slug);
    console.log(`📝 Nom: ${result.metadata.name}, Etat: ${result.metadata.state}`);
    
    // Create tournament if it doesn't exist
    await prisma.tournament.upsert({
      where: { id: tournamentId },
      update: {
        name: result.metadata.name,
        challongeUrl: result.metadata.url,
        challongeId: String(result.metadata.id),
        status: 'COMPLETE',
        standings: result.standings as any,
        categoryId: categoryId
      },
      create: {
        id: tournamentId,
        name: result.metadata.name,
        challongeUrl: result.metadata.url,
        challongeId: String(result.metadata.id),
        date: new Date('2025-02-23'), // Ajusté manuellement ou à extraire si possible
        status: 'COMPLETE',
        standings: result.standings as any,
        categoryId: categoryId
      }
    });

    // 1. Calculer les stats à partir des matchs
    const statsMap = new Map<number, { wins: number, losses: number }>();
    for (const m of result.matches) {
      if (m.state === 'complete' && m.winnerId) {
        const w = statsMap.get(m.winnerId) || { wins: 0, losses: 0 };
        w.wins++;
        statsMap.set(m.winnerId, w);
        if (m.loserId) {
          const l = statsMap.get(m.loserId) || { wins: 0, losses: 0 };
          l.losses++;
          statsMap.set(m.loserId, l);
        }
      }
    }

    const allUsers = await prisma.user.findMany({ include: { profile: true } });
    const challongeIdToUserId = new Map<number, string>();
    const participantsData = [];

    console.log(`👥 Mapping de ${result.participants.length} participants...`);
    for (const p of result.participants) {
      const normalizedPName = normalize(p.name);
      
      // Try to match existing user
      let matchedUser = allUsers.find(u => 
        normalize(u.name) === normalizedPName || 
        normalize(u.username) === normalizedPName || 
        normalize(u.profile?.bladerName) === normalizedPName ||
        (p.challongeUsername && normalize(u.username) === normalize(p.challongeUsername))
      );

      if (!matchedUser) {
        // console.log(`👤 Création de l'utilisateur pour ${p.name}...`);
        matchedUser = await prisma.user.create({
          data: {
            name: p.name,
            username: p.challongeUsername || `bts3_${normalizedPName}`,
            email: `${p.challongeUsername || normalizedPName}@placeholder.rpb`,
            profile: { create: { bladerName: p.name, rankingPoints: 0 } }
          }
        });
      }

      challongeIdToUserId.set(p.id, matchedUser.id);
      const stats = statsMap.get(p.id) || { wins: 0, losses: 0 };
      const standing = result.standings.find(s => normalize(s.name) === normalizedPName);

      participantsData.push({
        id: `tp-${tournamentId}-${matchedUser.id}`,
        tournamentId,
        userId: matchedUser.id,
        challongeParticipantId: String(p.id),
        finalPlacement: standing?.rank || p.finalRank || 999,
        wins: stats.wins,
        losses: stats.losses,
        checkedIn: true
      });
    }

    // Update Participants
    await prisma.tournamentParticipant.deleteMany({ where: { tournamentId } });
    for (const pData of participantsData) {
      await prisma.tournamentParticipant.create({ data: pData });
    }

    // Update Matches
    console.log(`🏟️ Traitement de ${result.matches.length} matchs...`);
    const matchesWithPlayers = result.matches.filter(m => m.player1Id || m.player2Id).length;
    console.log(`🧐 Matchs avec au moins un joueur défini: ${matchesWithPlayers}`);
    let importedMatches = 0;
    for (const m of result.matches) {
      const p1Id = m.player1Id ? challongeIdToUserId.get(m.player1Id) : null;
      const p2Id = m.player2Id ? challongeIdToUserId.get(m.player2Id) : null;
      const winnerId = m.winnerId ? challongeIdToUserId.get(m.winnerId) : null;
      
      if (!p1Id && !p2Id) continue;

      await prisma.tournamentMatch.upsert({
        where: { tournamentId_challongeMatchId: { tournamentId, challongeMatchId: String(m.id) } },
        create: {
          id: `tm-${tournamentId}-${m.id}`,
          tournamentId,
          challongeMatchId: String(m.id),
          round: m.round,
          player1Id: p1Id || null,
          player2Id: p2Id || null,
          winnerId: winnerId || null,
          score: m.scores,
          state: m.state
        },
        update: { 
          player1Id: p1Id || null, 
          player2Id: p2Id || null, 
          winnerId: winnerId || null, 
          score: m.scores, 
          state: m.state 
        }
      });
      importedMatches++;
    }
    console.log(`✅ ${importedMatches} matchs importés.`);

    console.log(`✅ Importation de B_TS3 terminée avec succès.`);
  } catch (err: any) {
    console.error("❌ Erreur lors de l'importation:", err);
  } finally {
    await scraper.close();
    await prisma.$disconnect();
    if (await Bun.file(LOCK_FILE).exists()) fs.unlinkSync(LOCK_FILE);
  }
}

main();
