import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

puppeteer.use(StealthPlugin());

async function fixWinsLosses() {
    const browser = await (puppeteer as any).launch({headless: true, args: ['--no-sandbox']});
    const page = await browser.newPage();
    
    const slugs = ['fr/B_TS2', 'fr/B_TS3'];
    
    for (const slug of slugs) {
        console.log(`🚀 Scraping W/L for ${slug}...`);
        await page.goto(`https://challonge.com/${slug}/standings`, { waitUntil: 'networkidle2' });
        
        const stats = await page.evaluate(() => {
            const results: Record<string, {wins: number, losses: number}> = {};
            const rows = Array.from(document.querySelectorAll('.standings-table tr, table tr'));
            rows.forEach(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                if (cells.length >= 2) {
                    const nameCell = cells[1];
                    // The name might be inside an 'a' tag
                    const name = nameCell.querySelector('a')?.textContent?.trim() || nameCell.textContent?.trim() || '';
                    
                    if (name && name !== 'Player' && name !== 'Participant Name') {
                        // Look for W and L in all other cells
                        let wCount = 0;
                        let lCount = 0;
                        for (let i = 2; i < cells.length; i++) {
                            const text = cells[i].textContent || '';
                            // Count W and L (but only if they are isolated letters for match history)
                            // Challonge puts them as separate spans usually or text nodes
                            const spans = Array.from(cells[i].querySelectorAll('span, div'));
                            if (spans.length > 0) {
                                spans.forEach(span => {
                                    if (span.textContent?.trim() === 'W') wCount++;
                                    if (span.textContent?.trim() === 'L') lCount++;
                                });
                            } else {
                                // Fallback to raw text matching
                                const matchesW = text.match(/\bW\b/g);
                                const matchesL = text.match(/\bL\b/g);
                                if (matchesW) wCount += matchesW.length;
                                if (matchesL) lCount += matchesL.length;
                            }
                        }
                        
                        results[name] = { wins: wCount, losses: lCount };
                    }
                }
            });
            return results;
        });
        
        console.log(`✅ Extracted stats for ${Object.keys(stats).length} players`);
        
        const filePath = resolve(process.cwd(), `data/exports/${slug.split('/').pop()}.json`);
        try {
            const data = JSON.parse(readFileSync(filePath, 'utf-8'));
            
            let matched = 0;
            data.participants.forEach((p: any) => {
                // Remove checkmarks from name to match if needed, but the scraped name here already includes it for B_TS3
                const st = stats[p.name] || stats[p.name.replace(/✅/g, '').trim()];
                if (st) {
                    p.exactWins = st.wins;
                    p.exactLosses = st.losses;
                    matched++;
                } else {
                    // Fallback approximation if not found
                    p.exactWins = 0;
                    p.exactLosses = p.rank === 1 ? 1 : 2;
                }
            });
            
            console.log(`✅ Matched ${matched}/${data.participants.length} players to their stats.`);
            writeFileSync(filePath, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error(e);
        }
    }
    
    await browser.close();
}

fixWinsLosses();
