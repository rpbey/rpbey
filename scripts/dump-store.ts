import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

puppeteer.use(StealthPlugin());

async function dumpStore() {
    const browser = await (puppeteer as any).launch({headless: true, args: ['--no-sandbox']});
    const page = await browser.newPage();
    
    // We try to grab B_TS2 data
    console.log(`🚀 Fetching B_TS2 module...`);
    await page.goto(`https://challonge.com/fr/B_TS2/module`, { waitUntil: 'networkidle2' });
    
    const store = await page.evaluate(() => (window as any)._initialStoreState);
    if (store) {
        writeFileSync(resolve(process.cwd(), 'data/exports/B_TS2_STORE.json'), JSON.stringify(store, null, 2));
        console.log(`✅ Saved B_TS2 store!`);
    } else {
        console.log(`❌ No store found in module.`);
        // Try fallback on main page script tags
        await page.goto(`https://challonge.com/fr/B_TS2`, { waitUntil: 'networkidle2' });
        const html = await page.content();
        if (html.includes('_initialStoreState = ')) {
             const jsonStr = html.split('_initialStoreState = ')[1].split('};')[0] + '}';
             try {
                 const parsed = JSON.parse(jsonStr);
                 writeFileSync(resolve(process.cwd(), 'data/exports/B_TS2_STORE.json'), JSON.stringify(parsed, null, 2));
                 console.log(`✅ Saved B_TS2 store from HTML!`);
             } catch(e) {
                 console.log(`❌ Parse error`);
             }
        }
    }
    await browser.close();
}

dumpStore();
