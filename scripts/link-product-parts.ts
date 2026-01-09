
import { prisma } from '../src/lib/prisma';
import { PartType } from '@prisma/client';

async function main() {
  console.log('🔗 Linking Products to Parts...');

  const products = await prisma.product.findMany();
  const allParts = await prisma.part.findMany();

  const blades = allParts.filter(p => p.type === PartType.BLADE);
  const ratchets = allParts.filter(p => p.type === PartType.RATCHET);
  const bits = allParts.filter(p => p.type === PartType.BIT);

  console.log(`📊 Found ${products.length} products and ${allParts.length} parts.`);

  let linkedCount = 0;

  for (const product of products) {
    // Try to find Beyblade components in product name or description
    // Example: "ドランブレイブS6-60V" -> Dran Brave, 6-60, V
    
    // Pattern: [BladeName] [Ratchet] [Bit]
    // Japanese often doesn't have spaces: ドランブレイブS6-60V
    
    // 1. Identify Ratchet (e.g., 3-60, 5-80, 9-60)
    const ratchetMatch = product.name.match(/(\d-\d{2})/);
    const foundRatchet = ratchetMatch ? ratchets.find(r => r.name === ratchetMatch[1]) : null;

    if (foundRatchet) {
      // 2. Everything before ratchet is likely the Blade
      const splitParts = product.name.split(foundRatchet.name);
      const beforeRatchet = splitParts[0];
      
      if (beforeRatchet !== undefined) {
        // Clean up common prefixes like "BX-01 スターター"
        const cleanBladeSearch = beforeRatchet.replace(/^[A-Z]{2}-\d{2,3}/, '').replace(/スターター|ブースター|セット|【[^\\\]]+】/, '').trim();
        
        const foundBlade = blades.find(b => 
          cleanBladeSearch.includes(b.name) || 
          b.nameJp && cleanBladeSearch.includes(b.nameJp)
        );

        // 3. Everything after ratchet is likely the Bit
        const afterRatchet = splitParts[1];
        const cleanBitSearch = afterRatchet?.split(' ')[0]?.split('\n')[0]?.trim();
      
        const foundBit = cleanBitSearch ? bits.find(b => 
          cleanBitSearch === b.name || 
          (b.name.length > 1 && cleanBitSearch.startsWith(b.name))
        ) : null;

        if (foundBlade && foundRatchet && foundBit) {
          console.log(`✨ Matched ${product.code}: ${foundBlade.name} ${foundRatchet.name}${foundBit.name}`);
          
          await prisma.product.update({
            where: { id: product.id },
            data: {
              includedParts: [foundBlade.name, foundRatchet.name, foundBit.name]
            }
          });

          // Create a Beyblade record linked to this product if it doesn't exist
          await prisma.beyblade.upsert({
            where: { code: product.code },
            update: {
              name: `${foundBlade.name} ${foundRatchet.name}${foundBit.name}`,
              productId: product.id,
              bladeId: foundBlade.id,
              ratchetId: foundRatchet.id,
              bitId: foundBit.id,
            },
            create: {
              code: product.code,
              name: `${foundBlade.name} ${foundRatchet.name}${foundBit.name}`,
              productId: product.id,
              bladeId: foundBlade.id,
              ratchetId: foundRatchet.id,
              bitId: foundBit.id,
            }
          });

          linkedCount++;
        }
      }
    }
  }

  console.log(`✅ Linked ${linkedCount} products to their parts!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
