import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';

function getSlug(s: string): string {
    return s.toLowerCase()
        .replace(/^(satr_|satr |teamarc|team arc |bts[1-3]_|fr_b_ts[1-3]_|@|rnsx_|rnsx|user_|team_arc )/i, '')
        .replace(/[^a-z0-9]/g, '')
        .replace(/[0-9]+$/, '')
        .trim();
}

async function restoreBackup() {
    console.log("🚑 RESTAURATION DEPUIS LE BACKUP LOCAL...");

    const backupPath = path.resolve(process.cwd(), 'data/exports/standalone_ranking.json');
    if (!fs.existsSync(backupPath)) {
        return console.error("❌ Fichier de backup introuvable !");
    }

    const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
    console.log(`📄 ${data.length} bladers trouvés dans la sauvegarde.`);

    // Purge de sécurité
    await prisma.profile.deleteMany({ where: { user: { role: 'user' } } });
    await prisma.user.deleteMany({ where: { role: 'user' } });

    // Grouping by slug to ensure no duplicates
    const mergedData = new Map<string, any>();

    for (const p of data) {
        // Appliquer les corrections décidées précédemment (KamenZ 3ème, Azure/Sleepr, etc.)
        let slug = getSlug(p.handle);
        if (slug === 'azurekun') slug = 'sleepr';
        if (slug === 'inazo') slug = 'inazo';
        if (slug === 'kamenz') slug = 'kamenz';
        
        const name = slug.charAt(0).toUpperCase() + slug.slice(1);

        if (!mergedData.has(slug)) {
            mergedData.set(slug, {
                name: name,
                username: slug,
                points: p.points,
                wins: p.wins,
                losses: p.losses,
                tournaments: p.tournaments
            });
        } else {
            const existing = mergedData.get(slug);
            existing.points = Math.max(existing.points, p.points); // Garder le meilleur score en cas de doublon
            existing.wins += p.wins;
            existing.losses += p.losses;
            existing.tournaments = Math.max(existing.tournaments, p.tournaments);
        }
    }

    // Application des corrections de podiums sur les points !
    // Barème : 1er = 10000, 2ème = 7000, 3ème = 5000
    // On force les scores exacts attendus pour le Top
    const corrections: Record<string, number> = {
        'kreepy': 18000,
        'chadlight': 17500,
        'skarngamemaster': 17500,
        'sleepr': 17500, // sleepr + azurekun cumulé
        'inazo': 14500, // 3eme BTS2
        'vincent': 12000,
        'kamenz': 11750, // 3eme BTS3 corrigé
        'berserk': 11250,
        'lewis': 11250,
        'lightyamani': 10500
    };

    let count = 0;
    for (const [slug, p] of mergedData.entries()) {
        const finalPoints = corrections[slug] !== undefined ? corrections[slug] : p.points;

        await prisma.user.create({
            data: {
                name: p.name,
                username: p.username,
                email: `${p.username}@rpbey.fr`,
                image: '/logo.png',
                profile: {
                    create: {
                        bladerName: p.name,
                        challongeUsername: p.username,
                        rankingPoints: finalPoints,
                        wins: p.wins,
                        losses: p.losses,
                        tournamentWins: slug === 'kreepy' || slug === 'chadlight' ? 1 : 0
                    }
                }
            }
        });
        count++;
    }

    // Recréer les dummy tournois pour que l'UI ne plante pas
    await prisma.tournament.deleteMany({});
    await prisma.tournament.createMany({
        data: [
            { id: 'cm-fr_b_ts2-auto', name: 'Bey-Tamashii Séries #2', challongeId: '17428634', status: 'COMPLETE', date: new Date('2026-02-15'), categoryId: 'cmkxcqif90000rma3yonpba8r' },
            { id: 'cm-fr_b_ts3-auto', name: 'Bey-Tamashii Séries #3', challongeId: '17542908', status: 'COMPLETE', date: new Date('2026-03-01'), categoryId: 'cmkxcqif90000rma3yonpba8r' }
        ]
    });

    console.log(`✅ ${count} bladers restaurés et unifiés avec succès.`);
    
    console.log("--- TOP 10 OFFICIEL RESTAURÉ ---");
    const tops = await prisma.profile.findMany({ where: { rankingPoints: { gt: 0 } }, include: { user: true }, orderBy: { rankingPoints: 'desc' }, take: 10 });
    tops.forEach((p, i) => console.log(`${i+1}. ${p.user.name} : ${p.rankingPoints} pts`));
}

restoreBackup().finally(() => prisma.$disconnect());
