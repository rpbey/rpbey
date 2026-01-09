
import { prisma } from '../src/lib/prisma.js';
import { TakaraTomyScraper } from '../src/lib/scraper/takaratomy.js';

async function main() {
  console.log('🚀 Starting Takara Tomy Product Sync...');
  
  try {
    const scraper = new TakaraTomyScraper(prisma);
    const { total, updated } = await scraper.syncLineup();
    
    console.log('✅ Sync Complete!');
    console.log(`📊 Total Products: ${total}`);
    console.log(`✨ Updated/Created: ${updated}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync Failed:', error);
    process.exit(1);
  }
}

main();
