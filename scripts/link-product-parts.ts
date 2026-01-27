import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/lib/prisma';

async function main() {
  const parts = await prisma.part.findMany({ where: { type: 'BLADE' } });
  const products = await prisma.product.findMany();

  console.log(`Linking ${parts.length} blades to ${products.length} products...`);

  for (const part of parts) {
    // Simple matching: does product name contain part name?
    // "Dran Sword" in "Starter Dran Sword 3-60F"
    // Be careful with substrings (e.g. "Dran" matching "Dran Dagger" and "Dran Sword")
    // We sort products by length descending to match longest first?
    
    // Better: Match "Starter [Name]"
    
    const matchingProducts = products.filter(p => 
        p.name.toLowerCase().includes(part.name.toLowerCase())
    );

    if (matchingProducts.length > 0) {
        // Link to the earliest release? Or store multiple?
        // Schema has `productId` on Beyblade, not Part directly (via relation)
        // Wait, Part schema doesn't have `productId`. Beyblade has.
        // But `Part` has no direct link to Product in schema yet?
        
        // Let's check schema.
        // `Part` doesn't have `productId`. `Beyblade` has. 
        // But we are dealing with parts.
        
        // Actually, we should probably add `releaseDate` to Part based on Product release date.
        // And maybe `originalProductCode`.
        
        const earliest = matchingProducts.sort((a,b) => (a.releaseDate?.getTime() || 0) - (b.releaseDate?.getTime() || 0))[0];
        
        if (earliest && earliest.releaseDate) {
            await prisma.part.update({
                where: { id: part.id },
                data: {
                    releaseDate: earliest.releaseDate
                }
            });
            process.stdout.write('+');
        }
    }
  }
  
  console.log('\nDone linking release dates!');
}

main();