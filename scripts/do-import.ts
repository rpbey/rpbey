import { ChallongeScraper } from '../src/lib/scrapers/challonge-scraper';
import { prisma } from '../src/lib/prisma';

function getSlug(s: string | null | undefined): string {
  if (!s) return 'blader';
  let res = s.toLowerCase()
          .replace(/^(satr_|satr |teamarc|team arc |bts[1-3]_|fr_b_ts[1-3]_|@|rnsx_|rnsx|user_|team_arc )/i, '')
          .replace(/[^a-z0-9]/g, '')
          .replace(/[0-9]+$/, '')
          .trim();
  return res || 'blader';
}

async function doImport() {
    console.log("📥 IMPORTATION DES DONNEES...");
    const scraper = new ChallongeScraper();
    const slugs = ['fr/B_TS2', 'fr/B_TS3'];

    for (const slug of slugs) {
        console.log("Scraping " + slug + "...");
        const res = await scraper.scrape(slug);
        
        const dbT = await prisma.tournament.create({
            data: {
                id: "cm-" + slug.replace(/\//g, '_').toLowerCase() + "-auto",
                name: res.metadata.name,
                challongeId: String(res.metadata.id),
                date: new Date(),
                status: 'COMPLETE',
                categoryId: 'cmkxcqif90000rma3yonpba8r'
            }
        });

        const idMap = new Map<number, {userId: string | null, playerName: string}>();
        for (const p of res.participants) {
            const pure = getSlug(p.name);
            const user = await prisma.user.findFirst({ where: { username: pure } });
            
            const cleanName = p.name || pure.charAt(0).toUpperCase() + pure.slice(1);
            
            idMap.set(p.id, { 
                userId: user?.id || null, 
                playerName: cleanName 
            });

            const std = res.standings.find(s => getSlug(s.name) === pure);
            const rank = p.finalRank || (std ? std.rank : 999);
            const wins = res.matches.filter(m => m.winnerId === p.id && m.state === 'complete').length;

            await prisma.tournamentParticipant.create({
                data: {
                    tournamentId: dbT.id,
                    userId: user?.id || null,
                    playerName: cleanName,
                    challongeParticipantId: String(p.id),
                    finalPlacement: rank,
                    wins: wins,
                    losses: 0,
                    checkedIn: true
                }
            });
        }

        for (const m of res.matches) {
            const p1 = idMap.get(m.player1Id!);
            const p2 = idMap.get(m.player2Id!);
            const winner = idMap.get(m.winnerId!);
            if (!p1 && !p2) continue;

            await prisma.tournamentMatch.create({
                data: {
                    id: "tm-" + dbT.id + "-" + m.id,
                    tournamentId: dbT.id,
                    challongeMatchId: String(m.id),
                    round: m.round,
                    player1Id: p1?.userId || null,
                    player2Id: p2?.userId || null,
                    winnerId: winner?.userId || null,
                    player1Name: p1?.playerName || null,
                    player2Name: p2?.playerName || null,
                    winnerName: winner?.playerName || null,
                    score: m.scores,
                    state: m.state
                }
            });
        }
    }
    
    await scraper.close();
    console.log("✅ IMPORTATION TERMINEE.");
}

doImport().finally(() => prisma.$disconnect());
