import { ChallongeScraper } from '../src/lib/scrapers/challonge-scraper';
import { prisma } from '../src/lib/prisma';

function getPureUsername(s: string | null | undefined): string {
  if (!s) return 'anonyme';
  return s.toLowerCase()
          .replace(/^(satr_|satr |teamarc|team arc |bts[1-3]_|fr_b_ts[1-3]_|@|rnsx_|rnsx)/g, '')
          .replace(/[^a-z0-9]/g, '')
          .replace(/[0-9]+$/, '')
          .trim() || 'blader';
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npx tsx scripts/import-challonge-generic.ts <slug>");
    process.exit(1);
  }

  const scraper = new ChallongeScraper();
  const normalizedSlug = slug.replace(/[^a-z0-9]/gi, '_');
  const tournamentId = `cm-${normalizedSlug.toLowerCase()}-auto`;
  const categoryId = 'cmkxcqif90000rma3yonpba8r'; 

  try {
    console.log(`🚀 Scraping ${slug}...`);
    const result = await scraper.scrape(slug);
    const challongeId = String(result.metadata.id || '');

    const existingTournament = await prisma.tournament.findUnique({ where: { challongeId } });
    const finalTournamentId = existingTournament?.id || tournamentId;
    
    await prisma.tournament.upsert({
      where: { id: finalTournamentId },
      update: { name: result.metadata.name, status: 'COMPLETE', standings: result.standings as any, categoryId },
      create: {
        id: finalTournamentId,
        name: result.metadata.name,
        challongeUrl: result.metadata.url,
        challongeId: challongeId,
        date: new Date(), 
        status: 'COMPLETE',
        standings: result.standings as any,
        categoryId
      }
    });

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

    for (const p of result.participants) {
      const pure = getPureUsername(p.name);
      let matchedUser = allUsers.find(u => u.username === pure || getPureUsername(u.name) === pure);

      if (!matchedUser) {
        matchedUser = await (prisma.user.create({
          data: {
            name: pure.charAt(0).toUpperCase() + pure.slice(1),
            username: pure,
            email: `${pure}@rpbey.fr`,
            image: p.portraitUrl || '/logo.png',
            profile: { create: { bladerName: pure.charAt(0).toUpperCase() + pure.slice(1), challongeUsername: pure } }
          },
          include: { profile: true }
        }) as any);
        allUsers.push(matchedUser!);
      }

      challongeIdToUserId.set(p.id, matchedUser!.id);
      const stats = statsMap.get(p.id) || { wins: 0, losses: 0 };
      const standing = result.standings.find(s => getPureUsername(s.name) === pure);

      await prisma.tournamentParticipant.upsert({
        where: { tournamentId_userId: { tournamentId: finalTournamentId, userId: matchedUser!.id } },
        update: {
            wins: stats.wins,
            losses: stats.losses,
            finalPlacement: standing?.rank || p.finalRank || 999
        },
        create: {
            tournamentId: finalTournamentId,
            userId: matchedUser!.id,
            challongeParticipantId: String(p.id),
            finalPlacement: standing?.rank || p.finalRank || 999,
            wins: stats.wins,
            losses: stats.losses,
            checkedIn: true
        }
      });
    }

    for (const m of result.matches) {
      const p1Id = m.player1Id ? challongeIdToUserId.get(m.player1Id) : null;
      const p2Id = m.player2Id ? challongeIdToUserId.get(m.player2Id) : null;
      const winnerId = m.winnerId ? challongeIdToUserId.get(m.winnerId) : null;
      if (!p1Id && !p2Id) continue;

      await prisma.tournamentMatch.upsert({
        where: { tournamentId_challongeMatchId: { tournamentId: finalTournamentId, challongeMatchId: String(m.id) } },
        create: {
          id: `tm-${finalTournamentId}-${m.id}`,
          tournamentId: finalTournamentId,
          challongeMatchId: String(m.id),
          round: m.round,
          player1Id: p1Id || null,
          player2Id: p2Id || null,
          winnerId: winnerId || null,
          score: m.scores,
          state: m.state
        },
        update: { player1Id: p1Id, player2Id: p2Id, winnerId, score: m.scores, state: m.state }
      });
    }
    console.log(`✅ Importation terminée pour ${slug}.`);
  } catch (err: any) {
    console.error("❌ Erreur:", err);
  } finally {
    await scraper.close();
    await prisma.$disconnect();
  }
}
main();
