
import { ScraperService } from '../src/lib/scraper/index.js';

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('Please provide a URL to scrape.');
    process.exit(1);
  }

  const scraper = new ScraperService({
    headless: true,
    // Maximize reuse of existing optimized config
  });

  try {
    const results = await scraper.scrape([url]);
    if (results.length > 0) {
      console.log(JSON.stringify(results[0], null, 2));
    } else {
      console.error('No data scraped.');
    }
  } catch (error) {
    console.error('Scraping failed:', error);
    process.exit(1);
  }
}

main();
