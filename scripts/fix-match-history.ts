import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

puppeteer.use(StealthPlugin());

async function fixMatchHistory() {
    const browser = await (puppeteer as any).launch({headless: true, args: ['--no-sandbox']});
    const page = await browser.newPage();
    
    const slugs = ['fr/B_TS2', 'fr/B_TS3'];
    
    for (const slug of slugs) {
        console.log(`🚀 Scraping Match History for ${slug}...`);
        await page.goto(`https://challonge.com/${slug}/standings`, { waitUntil: 'networkidle2' });
        
        const stats = await page.evaluate(() => {
            const results: Record<string, {history: string[]}> = {};
            const rows = Array.from(document.querySelectorAll('.standings-table tr, table tr'));
            rows.forEach(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                if (cells.length >= 2) {
                    const nameCell = cells[1];
                    const name = nameCell.querySelector('a')?.textContent?.trim() || nameCell.textContent?.trim() || '';
                    
                    if (name && name !== 'Player' && name !== 'Participant Name') {
                        let history: string[] = [];
                        for (let i = 2; i < cells.length; i++) {
                            const text = cells[i].textContent || '';
                            const spans = Array.from(cells[i].querySelectorAll('span, div'));
                            if (spans.length > 0) {
                                spans.forEach(span => {
                                    const t = span.textContent?.trim();
                                    if (t === 'W' || t === 'L') history.push(t);
                                });
                            } else {
                                const matches = text.match(/\b(W|L)\b/g);
                                if (matches) history.push(...matches);
                            }
                        }
                        results[name] = { history };
                    }
                }
            });
            return results;
        });
        
        console.log(`✅ Extracted history for ${Object.keys(stats).length} players`);
        
        const filePath = resolve(process.cwd(), `data/exports/${slug.split('/').pop()}.json`);
        try {
            const data = JSON.parse(readFileSync(filePath, 'utf-8'));
            
            let matched = 0;
            data.participants.forEach((p: any) => {
                const st = stats[p.name] || stats[p.name.replace(/✅/g, '').trim()];
                if (st) {
                    p.matchHistory = st.history;
                    matched++;
                } else {
                    p.matchHistory = [];
                }
            });
            
            console.log(`✅ Matched ${matched}/${data.participants.length} players to their history.`);
            writeFileSync(filePath, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error(e);
        }
    }
    
    await browser.close();
}

fixMatchHistory();
