
import { recalculateRankings } from '../src/server/actions/ranking';
import { prisma } from '../src/lib/prisma';

// Simple wrapper to run recalculateRankings outside of Next.js context
// Note: revalidatePath will fail but the DB update will work.
async function run() {
    console.log('🔄 Starting automated ranking recalculation...');
    try {
        // We bypass the server action to avoid Next.js specific errors (revalidatePath)
        // and just run the logic if needed, but actually the logic in ranking.ts 
        // is quite tied to the action.
        
        // Let's just trigger the recalculation logic manually here to be safe.
        const res = await recalculateRankings();
        console.log(`✅ ${res.message}`);
    } catch (error) {
        console.error('❌ Error during ranking recalculation:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

run();
