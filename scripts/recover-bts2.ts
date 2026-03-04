import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

puppeteer.use(StealthPlugin());

async function deepScrape() {
    const browser = await (puppeteer as any).launch({headless: true, args: ['--no-sandbox']});
    const page = await browser.newPage();
    
    console.log(`🚀 Fetching B_TS2 module...`);
    await page.goto(`https://challonge.com/fr/B_TS2/module`, { waitUntil: 'networkidle2' });
    
    const store = await page.evaluate(() => (window as any)._initialStoreState);
    if (store) {
        const participants = store.ParticipantsStore?.participants || store.TournamentStore?.tournament?.participants || [];
        const matchesRaw = store.TournamentStore?.matches_by_round || {};
        const matches: any[] = [];
        Object.values(matchesRaw).forEach((r: any) => {
            if (Array.isArray(r)) matches.push(...r);
        });

        const exportData = {
            participantsCount: participants.length,
            matchesCount: matches.length,
            participants: participants.map((p: any) => ({
                id: p.id,
                name: p.display_name || p.name,
                rank: p.final_rank || p.rank
            })),
            matches: matches.map((m: any) => ({
                id: m.id,
                round: m.round,
                player1Id: m.player1_id,
                player2Id: m.player2_id,
                winnerId: m.winner_id,
                scores: m.scores_csv,
                state: m.state
            }))
        };
        writeFileSync(resolve(process.cwd(), 'data/exports/B_TS2_RECOVERED.json'), JSON.stringify(exportData, null, 2));
        console.log(`✅ Saved B_TS2 RECOVERED! Participants: ${exportData.participantsCount}`);
    } else {
        console.log(`❌ No store found.`);
    }
    await browser.close();
}

deepScrape();
