
import { prisma } from '../src/lib/prisma';

async function main() {
    const tournamentId = 'cm-bts2-auto-imported';
    const participants = await prisma.tournamentParticipant.findMany({
        where: { tournamentId },
        include: { user: { include: { profile: true } } }
    });

    console.log(`Checking profiles for ${participants.length} participants...`);

    let createdCount = 0;
    for (const p of participants) {
        if (!p.user.profile) {
            console.log(`Creating profile for ${p.user.name || p.user.username}...`);
            await prisma.profile.create({
                data: {
                    userId: p.userId,
                    bladerName: p.user.name || p.user.username || 'Blader Inconnu',
                    rankingPoints: 0
                }
            });
            createdCount++;
        }
    }

    console.log(`✅ Created ${createdCount} missing profiles.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
