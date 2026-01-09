
import { prisma } from '../src/lib/prisma';
import { CheerioCrawler, log, LogLevel } from 'crawlee';

// Set log level
log.setLevel(LogLevel.INFO);

async function main() {
  // 1. Fetch all products
  const products = await prisma.product.findMany({
    where: { productUrl: { not: null } },
    select: { id: true, code: true, productUrl: true }
  });

  console.log(`🚀 Starting enrichment for ${products.length} products...`);

  // 2. Configure Crawler
  const crawler = new CheerioCrawler({
    maxConcurrency: 2,
    requestHandler: async ({ $, request }) => {
      const product = products.find(p => p.productUrl === request.url);
      if (!product) return;

      log.info(`Processing ${product.code}...`);

      // Extract Description
      // .spec p (but skip .midashi which is "Product Features")
      const descriptionEl = $('.spec p').not('.midashi').first();
      // Replace <br> with newlines
      descriptionEl.find('br').replaceWith('\n');
      const description = descriptionEl.text().trim();

      // Extract High Res Image
      // .slider1_2 .slide-item img -> src
      let imageUrl = $('.slider1_2 .slide-item img').first().attr('src');
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = new URL(imageUrl, request.url).href;
      }

      // Extract Parts Image (from modal)
      let partsImageUrl = $('#modal-default img').first().attr('src');
      if (partsImageUrl && !partsImageUrl.startsWith('http')) {
        partsImageUrl = new URL(partsImageUrl, request.url).href;
      }

      // Update Database
      try {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            description: description || undefined,
            imageUrl: imageUrl || undefined,
          }
        });
        
        // Log what we found
        console.log(`✅ Updated ${product.code}:`);
        console.log(`   - Image: ${imageUrl}`);
        if (description) console.log(`   - Desc length: ${description.length}`);
        
      } catch (err) {
        log.error(`Failed to update ${product.code}: ${err}`);
      }
    },
  });

  // 3. Run Crawler
  await crawler.run(products.map(p => p.productUrl).filter((u): u is string => !!u));
  
  console.log('✨ Enrichment complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
