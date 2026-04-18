import { ChallongeScraper } from '../src/lib/scrapers/challonge-scraper';
import { prisma } from '../src/lib/prisma';
import fs from 'node:fs';

const LOCK_FILE = '/tmp/sync-bts2.lock';

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
  const tournamentId = 'cm-bts2-auto-imported';
  const tournamentName = 'Bey-Tamashii Séries #2';

  try {
    console.log(`🚀 Sync BTS2...`);
    const result = await scraper.scrape('fr/B_TS2');
    
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

    for (const p of result.participants) {
      const normalizedPName = normalize(p.name);
      let matchedUser = allUsers.find(u => 
        normalize(u.name) === normalizedPName || 
        normalize(u.username) === normalizedPName || 
        normalize(u.profile?.bladerName) === normalizedPName ||
        u.username === `bts2_${normalizedPName}`
      );

      if (!matchedUser) {
        matchedUser = await prisma.user.create({
          data: {
            name: p.name,
            username: `bts2_${normalizedPName}`,
            email: `bts2_${normalizedPName}@placeholder.rpb`,
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
        finalPlacement: standing?.rank || 999,
        wins: stats.wins,
        losses: stats.losses,
        checkedIn: true
      });
    }

    // Update DB
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'COMPLETE', standings: result.standings as any }
    });

    await prisma.tournamentParticipant.deleteMany({ where: { tournamentId } });
    for (const pData of participantsData) {
      await prisma.tournamentParticipant.create({ data: pData });
    }

    for (const m of result.matches) {
      const p1Id = m.player1Id ? challongeIdToUserId.get(m.player1Id) : null;
      const p2Id = m.player2Id ? challongeIdToUserId.get(m.player2Id) : null;
      const winnerId = m.winnerId ? challongeIdToUserId.get(m.winnerId) : null;
      await prisma.tournamentMatch.upsert({
        where: { tournamentId_challongeMatchId: { tournamentId, challongeMatchId: String(m.id) } },
        create: {
          id: `tm-${tournamentId}-${m.id}`,
          tournamentId,
          challongeMatchId: String(m.id),
          round: m.round,
          player1Id: p1Id,
          player2Id: p2Id,
          winnerId: winnerId,
          score: m.scores,
          state: m.state
        },
        update: { player1Id: p1Id, player2Id: p2Id, winnerId, score: m.scores, state: m.state }
      });
    }

    console.log(`✅ Sync terminée.`);
  } catch (err: any) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await scraper.close();
    await prisma.$disconnect();
    if (await Bun.file(LOCK_FILE).exists()) fs.unlinkSync(LOCK_FILE);
  }
}

main();
