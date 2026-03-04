import { prisma } from '../src/lib/prisma';

async function manualRecalc() {
    console.log("🛠️ CALCUL MANUEL DES POINTS...");
    
    const config = await prisma.rankingSystem.findFirst();
    if (!config) return console.error("Config non trouvée");

    const tournaments = await prisma.tournament.findMany({
        where: { id: { in: ['cm-fr_b_ts2-auto', 'cm-fr_b_ts3-auto'] } },
        include: { participants: true, matches: true }
    });

    const playerPoints = new Map<string, number>();

    for (const t of tournaments) {
        console.log(`
🏆 Tournoi: ${t.name}`);
        for (const p of t.participants) {
            let pts = config.participation;
            if (p.finalPlacement === 1) pts += config.firstPlace;
            else if (p.finalPlacement === 2) pts += config.secondPlace;
            else if (p.finalPlacement === 3) pts += config.thirdPlace;
            else if (p.finalPlacement <= 8) pts += config.top8;

            // Victoires matchs
            const wins = t.matches.filter(m => m.winnerId === p.userId && m.state === 'complete');
            let winPts = 0;
            for (const m of wins) {
                winPts += (m.round < 0 ? config.matchWinLoser : config.matchWinWinner);
            }
            pts += winPts;

            const total = (playerPoints.get(p.userId) || 0) + pts;
            playerPoints.set(p.userId, total);
            
            if (pts > 500) {
                console.log(`  - ${p.userId}: ${pts} pts (Base+Podium: ${pts-winPts}, WinPts: ${winPts})`);
            }
        }
    }

    console.log("
💾 SAUVEGARDE EN BASE...");
    for (const [userId, points] of playerPoints.entries()) {
        await prisma.profile.update({
            where: { userId },
            data: { rankingPoints: points }
        });
    }
    console.log("✅ TERMINÉ.");
}

manualRecalc().finally(() => prisma.$disconnect());
