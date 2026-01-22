import { prisma } from '../src/lib/prisma.js';
import { TakaraTomyScraper } from '../src/lib/scraper/takaratomy.js';
import { ProductSearch } from '../src/lib/ml/product-search.js';

async function main() {
  console.log('🚀 Starting Takara Tomy Product Sync (Stealth Mode)...');
  
  try {
    // 1. Sync Products
    const scraper = new TakaraTomyScraper(prisma);
    const { total, updated } = await scraper.syncLineup();
    
    console.log('✅ Sync Complete!');
    console.log(`📊 Total Products: ${total}`);
    console.log(`✨ Updated/Created: ${updated}`);

    // 2. Test ML Search
    console.log('\n🧠 Testing ML Knowledge Base...');
    const searchEngine = new ProductSearch(prisma);
    await searchEngine.init();

    const query = "red attack blade";
    console.log(`🔍 Searching for: "${query}"`);
    const results = searchEngine.search(query);
    
    results.forEach(r => {
        console.log(`   - [${r.score.toFixed(2)}] ${r.product.code} ${r.product.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync Failed:', error);
    process.exit(1);
  }
}

main();