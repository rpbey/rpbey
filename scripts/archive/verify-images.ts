import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🧐 Verifying Image URLs in Database...');

  const products = await prisma.product.findMany({
    select: { code: true, imageUrl: true }
  });

  const beyblades = await prisma.beyblade.findMany({
    select: { code: true, imageUrl: true }
  });

  const parts = await prisma.part.findMany({
    select: { externalId: true, imageUrl: true }
  });

  const stats = {
    products: { total: products.length, takara: 0, drive: 0, other: 0, null: 0 },
    beyblades: { total: beyblades.length, takara: 0, drive: 0, other: 0, null: 0 },
    parts: { total: parts.length, takara: 0, drive: 0, other: 0, null: 0 },
  };

  const categorize = (url: string | null) => {
    if (!url) return 'null';
    if (url.includes('takaratomy.co.jp')) return 'takara';
    if (url.includes('google.com') || url.includes('googleapis.com') || url.includes('drive.google.com')) return 'drive';
    return 'other';
  };

  products.forEach(p => {
    const cat = categorize(p.imageUrl);
    stats.products[cat]++;
  });

  beyblades.forEach(b => {
    const cat = categorize(b.imageUrl);
    stats.beyblades[cat]++;
  });

  parts.forEach(p => {
    const cat = categorize(p.imageUrl);
    stats.parts[cat]++;
  });

  console.log('\n📊 Database Image URL Statistics:');
  console.log('---------------------------------');
  console.log('Products:', stats.products);
  console.log('Beyblades:', stats.beyblades);
  console.log('Parts:', stats.parts);

  console.log('\n🔍 Sample URLs:');
  const sampleProduct = products.find(p => p.imageUrl);
  if (sampleProduct) console.log(`Product ${sampleProduct.code}: ${sampleProduct.imageUrl}`);
  
  const samplePart = parts.find(p => p.imageUrl);
  if (samplePart) console.log(`Part ${samplePart.externalId}: ${samplePart.imageUrl}`);

  // Check if any URLs are known to be broken (placeholder check)
  const brokenCount = products.filter(p => p.imageUrl?.includes('error') || p.imageUrl?.includes('broken')).length;
  if (brokenCount > 0) console.log(`\n⚠️ Found ${brokenCount} potentially broken URLs in products.`);

}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
