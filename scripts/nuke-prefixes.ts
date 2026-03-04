import { prisma } from '../src/lib/prisma';
import { recalculateRankings } from '../src/server/actions/ranking';

function ultraClean(s: string | null | undefined): string {
    if (!s) return 'Blader';
    return s
        .replace(/^(@@|@)/, '')
        .replace(/^(fr_b_ts[1-3]_|bts[1-3]_|satr_|teamarc|team arc |rnsx_|rnsx|user_|Team_Arc )/i, '')
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .replace(/[0-9]+$/, '') // Enlever chiffres à la fin (inazo13 -> inazo)
        .trim()
        .split(' ')[0] // Ne garder que le premier mot pour plus de propreté
        .charAt(0).toUpperCase() + s.toLowerCase().replace(/[^a-z]/g, '').slice(1); // Capitalisation simple
}

// Version plus simple pour éviter de casser les noms : on enlève juste les trucs moches
function simpleClean(s: string | null | undefined): string {
    if (!s) return 'Blader';
    let res = s.replace(/^(@@|@|fr_b_ts[1-3]_|bts[1-3]_|satr_|teamarc|team arc |rnsx_|rnsx|user_|Team_Arc )/i, '')
               .replace(/[0-9]+$/, '')
               .trim();
    if (res.length > 0) return res.charAt(0).toUpperCase() + res.slice(1);
    return s;
}

async function nukeAllPrefixes() {
    console.log("🧨 Éradication de TOUS les préfixes et @...");

    const users = await prisma.user.findMany({ include: { profile: true } });
    
    for (const u of users) {
        if (u.role === 'admin' || u.role === 'superadmin') continue;

        const newName = simpleClean(u.name);
        const newUsername = simpleClean(u.username || u.name).toLowerCase();

        await prisma.user.update({
            where: { id: u.id },
            data: { 
                name: newName,
                username: newUsername
            }
        });

        if (u.profile) {
            await prisma.profile.update({
                where: { userId: u.id },
                data: { 
                    bladerName: newName,
                    challongeUsername: newName
                }
            });
        }
        console.log(`✅ [${u.name}] -> [${newName}]`);
    }

    console.log("🔄 Recalcul final sans les @...");
    await recalculateRankings();
    console.log("🏁 Base de données purifiée.");
}

nukeAllPrefixes().finally(() => prisma.$disconnect());
