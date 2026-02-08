
import { prisma } from '../src/lib/prisma';

function normalize(s: string | null): string {
    if (!s) return '';
    return s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

async function main() {
    const tournamentId = 'cm-bts2-auto-imported';
    const participants = await prisma.tournamentParticipant.findMany({
        where: { tournamentId },
        include: { user: true }
    });

    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId }
    });

    if (!tournament) return;
    const standings = (tournament.standings as any[]) || [];

    // Get all users
    const allUsers = await prisma.user.findMany({
        include: { profile: true }
    });

    console.log(`Fixing links for ${standings.length} participants...`);

    let fixedCount = 0;
    for (const standing of standings) {
        const challongeName = standing.name;
        const normalizedChallonge = normalize(challongeName);

        // Find current participant record in DB for this tournament
        const currentP = participants.find(p => {
            if (p.user.name === challongeName) return true;
            if (normalize(p.user.name) === normalizedChallonge) return true;
            if (p.user.username === `bts2_${normalizedChallonge}`) return true;
            return false;
        });

        if (!currentP) continue;
        
        // Look for better match among ALL users
        // A "better" match is a user who:
        // 1. Matches normalized name
        // 2. IS NOT a bts2_ stub
        // 3. OR has a discordId
        
        const possibleMatches = allUsers.filter(u => {
            const names = [
                normalize(u.name),
                normalize(u.username),
                normalize(u.profile?.bladerName || ''),
                normalize(u.discordTag || '')
            ];
            return names.includes(normalizedChallonge);
        });

        // Sort candidates: real users first, then by discordId presence
        const bestMatch = possibleMatches.sort((a, b) => {
            const aIsStub = a.username?.startsWith('bts2_') ? 1 : 0;
            const bIsStub = b.username?.startsWith('bts2_') ? 1 : 0;
            if (aIsStub !== bIsStub) return aIsStub - bIsStub;
            
            const aHasDiscord = a.discordId ? 0 : 1;
            const bHasDiscord = b.discordId ? 0 : 1;
            return aHasDiscord - bHasDiscord;
        })[0];

        if (bestMatch && currentP.userId !== bestMatch.id) {
            console.log(`🔗 Re-linking "${challongeName}": ${currentP.user.username} (${currentP.userId}) -> ${bestMatch.username} (${bestMatch.id})`);
            
            const currentUser = currentP.user;
            const currentIsStub = currentUser.username?.startsWith('bts2_');

            // 1. Update participant link
            await prisma.tournamentParticipant.update({
                where: { id: currentP.id },
                data: { userId: bestMatch.id }
            });

            // 2. Update match links
            await prisma.tournamentMatch.updateMany({
                where: { tournamentId, player1Id: currentUser.id },
                data: { player1Id: bestMatch.id }
            });
            await prisma.tournamentMatch.updateMany({
                where: { tournamentId, player2Id: currentUser.id },
                data: { player2Id: bestMatch.id }
            });
            await prisma.tournamentMatch.updateMany({
                where: { tournamentId, winnerId: currentUser.id },
                data: { winnerId: bestMatch.id }
            });

            // 3. Cleanup stub user ONLY IF it's a stub and different from the target
            if (currentIsStub && currentUser.id !== bestMatch.id) {
                console.log(`  🗑️ Cleaning up stub user: ${currentUser.id}`);
                await prisma.profile.deleteMany({ where: { userId: currentUser.id } });
                await prisma.user.delete({ where: { id: currentUser.id } });
            }

            fixedCount++;
        }
    }

    console.log(`✅ Fixed ${fixedCount} links.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
