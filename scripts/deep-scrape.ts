import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

puppeteer.use(StealthPlugin());

async function deepScrape() {
    const cookiePath = resolve(process.cwd(), 'storage/cookies/challonge_cookie.json');
    let cookies = [];
    try {
        const raw = JSON.parse(readFileSync(cookiePath, 'utf-8'));
        cookies = raw.map((c: any) => ({
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
            httpOnly: c.httpOnly,
            secure: c.secure,
            sameSite: c.sameSite || 'Lax'
        }));
    } catch (e) {
        console.error("Failed to load cookies");
    }

    const browser = await (puppeteer as any).launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    if (cookies.length > 0) await page.setCookie(...cookies);
    
    const slug = 'fr/B_TS2';
    console.log(`🚀 Deep scraping for ${slug}...`);
    
    await page.goto(`https://challonge.com/${slug}/module`, { waitUntil: 'networkidle2' });
    
    const data = await page.evaluate(() => {
        const store = (window as any)._initialStoreState;
        if (!store) return null;
        
        // On cherche partout dans le store pour des objets avec id et name/display_name
        const participants: any[] = [];
        const seen = new Set();
        
        function traverse(obj: any) {
            if (!obj || typeof obj !== 'object') return;
            
            if (obj.id && (obj.name || obj.display_name)) {
                if (!seen.has(obj.id)) {
                    participants.push({
                        id: obj.id,
                        name: obj.display_name || obj.name,
                        rank: obj.rank || obj.final_rank
                    });
                    seen.add(obj.id);
                }
            }
            
            Object.values(obj).forEach(v => traverse(v));
        }
        
        traverse(store);
        return participants;
    });
    
    if (data && data.length > 0) {
        console.log(`✅ Found ${data.length} participants for ${slug} via deep traversal`);
        const filePath = resolve(process.cwd(), 'data/exports/B_TS2.json');
        const existing = JSON.parse(readFileSync(filePath, 'utf-8'));
        existing.participants = data;
        existing.participantsCount = data.length;
        writeFileSync(filePath, JSON.stringify(existing, null, 2));
        console.log(`✅ Updated ${filePath}`);
    } else {
        console.log(`❌ Still no participants found for ${slug}`);
    }
    
    await browser.close();
}

deepScrape();
