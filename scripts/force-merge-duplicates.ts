import { prisma } from '../src/lib/prisma';

const MAPPING = {
    // bts stub name -> real username
    "Inazo13 ": "inazo",
    "Inazo13": "inazo",
    "Berserk91": "berserk5691",
    "SnowPye": "snowpye78",
    "Tategamii": "tategami",
    "Kiiro": "kiirohhh",
    "Kineria": "kineriachan",
    "Vincent___": "vincentmp4",
    "_Equalizer_": "dim00455",
    "Hyakutakee": "hyakutake.",
    "09Illu": "illuca",
    "09illu": "illuca",
    "SAtR | Zeikuo": "zeikuo",
    "Team_Arc Kreepy": "kreepy95400",
    "sewpoo_0192": "sewpoo",
    "sewpoo": "sewpoo",
    "Twii_": "twiimbler",
    "Twii": "twiimbler",
    "Philou": "philouragan",
    "SAtRMewxy": "mewxyb",
    "Gelofy": "gelofy_2207",
    "azurekun": ".kenun",
    "Shishi": "shishi4272",
    "Sabo": "sabo0451",
    "Marina": "harislad0401",
    "Oro": "orotchi",
    "Levroi": "levroi0388",
    "Lurssafveutsonargent": "urssaf",
    "Tigre_ss": "tigress"
};

async function forceMerge() {
    console.log("🚀 Lancement de la fusion FORCÉE des doublons...");
    
    const allUsers = await prisma.user.findMany({
        include: { profile: true, tournaments: true, decks: true, seasonEntries: true }
    });

    let count = 0;

    for (const [stubName, realUsername] of Object.entries(MAPPING)) {
        const stub = allUsers.find(u => 
            (u.username?.startsWith('bts') && (u.name === stubName || u.username?.replace(/^bts[1-3]_/, '') === stubName)) ||
            (u.username === `bts2_${stubName.toLowerCase().replace(/ /g, '')}`) ||
            (u.username === `bts3_${stubName.toLowerCase().replace(/ /g, '')}`)
        );

        const real = allUsers.find(u => 
            u.username === realUsername || 
            u.discordTag === realUsername ||
            u.profile?.bladerName === realUsername
        );

        if (stub && real && stub.id !== real.id) {
            console.log(`🔗 Fusion FORCÉE: "${stubName}" (${stub.id}) -> "${realUsername}" (${real.id})`);
            
            try {
                // 1. Tournaments
                for (const part of stub.tournaments) {
                    const existing = await prisma.tournamentParticipant.findFirst({
                        where: { tournamentId: part.tournamentId, userId: real.id }
                    });
                    if (!existing) {
                        await prisma.tournamentParticipant.update({ where: { id: part.id }, data: { userId: real.id }});
                    } else {
                        await prisma.tournamentParticipant.update({
                            where: { id: existing.id },
                            data: {
                                wins: Math.max(existing.wins, part.wins),
                                losses: Math.max(existing.losses, part.losses),
                                finalPlacement: Math.min(existing.finalPlacement || 999, part.finalPlacement || 999)
                            }
                        });
                        await prisma.tournamentParticipant.delete({ where: { id: part.id } });
                    }
                }

                // 2. Matches
                await prisma.tournamentMatch.updateMany({ where: { player1Id: stub.id }, data: { player1Id: real.id } });
                await prisma.tournamentMatch.updateMany({ where: { player2Id: stub.id }, data: { player2Id: real.id } });
                await prisma.tournamentMatch.updateMany({ where: { winnerId: stub.id }, data: { winnerId: real.id } });

                // 3. Decks & Seasons
                await prisma.deck.updateMany({ where: { userId: stub.id }, data: { userId: real.id } });
                for (const entry of stub.seasonEntries) {
                    const existingEntry = await prisma.seasonEntry.findFirst({ where: { seasonId: entry.seasonId, userId: real.id } });
                    if (!existingEntry) {
                        await prisma.seasonEntry.update({ where: { id: entry.id }, data: { userId: real.id } });
                    } else {
                        await prisma.seasonEntry.delete({ where: { id: entry.id } });
                    }
                }

                // 4. Cleanup
                if (stub.profile) await prisma.profile.delete({ where: { id: stub.profile.id } });
                await prisma.user.delete({ where: { id: stub.id } });
                
                count++;
            } catch (e: any) {
                console.error(`  ❌ Échec:`, e.message);
            }
        }
    }

    console.log(`✅ ${count} stubs fusionnés.`);
}

forceMerge().finally(() => prisma.$disconnect());
