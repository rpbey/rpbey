import { ScraperService } from '../src/lib/scraper/index.js';

async function main() {
  const url = 'https://beyblade.fandom.com/wiki/List_of_Beyblade_X_products_(Takara_Tomy)';
  console.log(`🚀 Scraping Fandom: ${url}`);

  const scraper = new ScraperService({
    headless: true,
  });

  try {
    const results = await scraper.scrape([url]);
    if (results.length > 0) {
      console.log('✅ Success!');
      console.log('Title:', results[0]?.title);
      console.log('Markdown length:', results[0]?.markdown?.length);
      
      // Save to file to inspect for pagination
      const fs = await import('node:fs/promises');
      await fs.writeFile('fandom_dump.md', results[0]?.markdown || '');
      console.log('💾 Saved markdown to fandom_dump.md');
    } else {
      console.error('❌ No data scraped.');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
}

main();
