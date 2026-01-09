import fs from 'node:fs/promises';
import path from 'node:path';
import { ScraperService } from '../src/lib/scraper/index.js';

async function main() {
  console.log('🚀 Starting Fandom Detail Scraper...');

  // 1. Read the dump file
  let content = '';
  try {
    content = await fs.readFile('fandom_dump.md', 'utf-8');
  } catch {
    console.error('❌ Could not read fandom_dump.md. Run scripts/scrape-fandom.ts first.');
    process.exit(1);
  }

  // 2. Extract Links mapped to Product Codes
  const products = new Map<string, string>();
  const lines = content.split('\n');
  
  let lastCode: string | null = null;
  // Limit the search distance for a link after a code to avoid false positives
  let linesSinceCode = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for Code
    const codeMatch = trimmed.match(/^(BX|UX|CX|BX-00|UX-00|CX-00)(?:-\d{2,3})?$/);
    if (codeMatch) {
        lastCode = codeMatch[0];
        linesSinceCode = 0;
        continue;
    }

    if (lastCode) {
        linesSinceCode++;
        // If we found a code, look for a link in the next few non-empty lines (e.g. within 3 lines)
        if (linesSinceCode > 5) {
            lastCode = null; // Give up if no link found nearby
            continue;
        }

        const urlMatch = trimmed.match(/\(\/wiki\/([^")\s]+)/);
        if (urlMatch) {
            const relativeUrl = `/wiki/${urlMatch[1]}`;
            const url = `https://beyblade.fandom.com${relativeUrl}`;
            
            // Only add if we haven't processed this code or URL yet?
            // Actually, we might have duplicates in the list (Limited vs Basic), but the URL might be the same.
            // We want to map URL to Code. If URL is same, we keep the first code found.
            if (!products.has(url)) {
                products.set(url, lastCode);
                // console.log(`Found: ${lastCode} -> ${relativeUrl}`);
            }
            
            // We found the link for this code, reset
            lastCode = null; 
        }
    }
  }

  console.log(`found ${products.size} unique product pages to scrape.`);
  
  const urls = Array.from(products.keys());
  
  if (urls.length === 0) {
      console.log("⚠️ No URLs found. Check regex.");
      process.exit(0);
  }

  // 3. Scrape in batches
  const scraper = new ScraperService({
    headless: true,
    maxRequestsPerCrawl: 200,
  });

  try {
    console.log(`🕷️  Scraping ${urls.length} pages...`);
    const results = await scraper.scrape(urls);
    
    console.log(`✅ Scraped ${results.length} pages.`);

    // 4. Save results
    for (const page of results) {
      const code = products.get(page.url);
      if (code) {
        const safeCode = code.replace(/[^a-zA-Z0-9-]/g, '_');
        // If multiple products map to same URL, we might overwrite, but that's fine (same content).
        // Wait, if BX-01 and BX-02 share a page (unlikely for Beyblade X), we'd lose one.
        // But here we mapped URL -> Code, so each URL has one Code.
        // If multiple codes point to same URL, `products.set` logic kept the *first* one.
        
        const filename = `${safeCode}.json`;
        const filePath = path.join('data/fandom_details', filename);
        
        await fs.writeFile(filePath, JSON.stringify(page, null, 2));
        console.log(`💾 Saved ${code} -> ${filename}`);
      } else {
          // Fuzzy match for redirects
          let found = false;
          for (const [pUrl, pCode] of products.entries()) {
              // Check if the scraped URL is related to the requested URL
              // e.g. requested /wiki/DranSword_3-60F, got /wiki/Dran_Sword_3-60F
              if (page.url.includes(pUrl.replace('https://beyblade.fandom.com/wiki/', ''))) {
                  const safeCode = pCode.replace(/[^a-zA-Z0-9-]/g, '_');
                  const filename = `${safeCode}.json`;
                  const filePath = path.join('data/fandom_details', filename);
                  await fs.writeFile(filePath, JSON.stringify(page, null, 2));
                  console.log(`💾 Saved ${pCode} (fuzzy) -> ${filename}`);
                  found = true;
                  break;
              }
          }
          if (!found) {
            console.warn(`⚠️  Could not find code for URL: ${page.url}`);
          }
      }
    }

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
}

main();
