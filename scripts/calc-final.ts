import { prisma } from '../src/lib/prisma';

async function calculateFinalPoints() {
    console.log("ATTRIBUTION DES PODIUMS ET CALCUL FINAL...");

    const podiums = [
        { t: 'cm-fr_b_ts2-auto', name: 'chadlight', rank: 1 },
        { t: 'cm-fr_b_ts2-auto', name: 'skarngamemaster', rank: 2 },
        { t: 'cm-fr_b_ts2-auto', name: 'inazo', rank: 3 },
        { t: 'cm-fr_b_ts3-auto', name: 'kreepy', rank: 1 },
        { t: 'cm-fr_b_ts3-auto', name: 'azurekun', rank: 2 },
        { t: 'cm-fr_b_ts3-auto', name: 'kamenz', rank: 3 },
        { t: 'cm-fr_b_ts3-auto', name: 'inazo', rank: 4 }
    ];

    for (const pod of podiums) {
        const user = await prisma.user.findFirst({ 
            where: { username: { equals: pod.name, mode: 'insensitive' } } 
        });
        
        if (user) {
            await prisma.tournamentParticipant.updateMany({
                where: { tournamentId: pod.t, userId: user.id },
                data: { finalPlacement: pod.rank }
            });
            console.log("OK: " + user.username + " -> " + pod.rank);
        } else {
            console.log("ERREUR: " + pod.name);
        }
    }

    console.log("RECALCUL DU MOTEUR...");
    
    // Recalcul en direct
    const config = await prisma.rankingSystem.findFirst();
    const ts = await prisma.tournament.findMany({ include: { participants: true, matches: true } });
    const playerPoints = new Map<string, number>();

    for (const t of ts) {
        for (const p of t.participants) {
            let pts = config!.participation;
            if (p.finalPlacement === 1) pts += config!.firstPlace;
            else if (p.finalPlacement === 2) pts += config!.secondPlace;
            else if (p.finalPlacement === 3) pts += config!.thirdPlace;
            else if (p.finalPlacement! <= 8) pts += config!.top8;

            const matchWins = t.matches.filter(m => m.winnerId === p.userId && m.state === 'complete');
            for (const m of matchWins) pts += (m.round < 0 ? config!.matchWinLoser : config!.matchWinWinner);

            playerPoints.set(p.userId, (playerPoints.get(p.userId) || 0) + pts);
        }
    }

    await prisma.profile.updateMany({ data: { rankingPoints: 0 } });
    for (const [uid, pts] of playerPoints.entries()) {
        await prisma.profile.update({ where: { userId: uid }, data: { rankingPoints: pts } });
    }
    
    console.log("TOP 10 FINAL:");
    const tops = await prisma.profile.findMany({ 
        where: { rankingPoints: { gt: 0 } }, 
        include: { user: true }, 
        orderBy: { rankingPoints: 'desc' }, 
        take: 10 
    });
    
    tops.forEach((p, i) => console.log((i+1) + ". " + p.user.name + " : " + p.rankingPoints + " pts"));
}

calculateFinalPoints().finally(() => prisma.$disconnect());
