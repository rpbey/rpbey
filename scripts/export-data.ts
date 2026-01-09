
import { prisma } from '../src/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  console.log('📦 Starting Data Export...');
  
  // Create exports directory
  const exportDir = path.join(process.cwd(), 'exports');
  await fs.mkdir(exportDir, { recursive: true });

  // Fetch Data
  const products = await prisma.product.findMany({
    include: {
      beyblades: {
        include: {
          blade: true,
          ratchet: true,
          bit: true
        }
      }
    },
    orderBy: { releaseDate: 'desc' }
  });

  console.log(`📊 Found ${products.length} products.`);

  // 1. JSON Export
  const jsonPath = path.join(exportDir, 'products.json');
  await fs.writeFile(jsonPath, JSON.stringify(products, null, 2));
  console.log(`✅ JSON Export: ${jsonPath}`);

  // 2. CSV Export (Google Sheets compatible)
  const csvHeaders = ['Code', 'Name', 'Line', 'Type', 'Price', 'Release Date', 'Limited?', 'Blade', 'Ratchet', 'Bit', 'Description', 'Image URL'];
  const csvRows = products.map(p => {
    // Determine parts from linked Beyblade or includedParts
    let blade = '', ratchet = '', bit = '';
    const firstBeyblade = p.beyblades[0];
    if (firstBeyblade) {
      blade = firstBeyblade.blade.name;
      ratchet = firstBeyblade.ratchet.name;
      bit = firstBeyblade.bit.name;
    } else if (p.includedParts.length >= 3) {
      // Fallback if not linked but string array exists (though we didn't populate it yet in previous steps fully)
      // Actually we mostly populated includedParts in the link script but didn't commit it? 
      // Wait, the link script DID update includedParts.
      blade = p.includedParts[0] || '';
      ratchet = p.includedParts[1] || '';
      bit = p.includedParts[2] || '';
    }

    return [
      p.code,
      `"${p.name.replace(/"/g, '""')}"`, // Escape quotes
      p.productLine,
      p.productType,
      p.price || 0,
      p.releaseDate ? p.releaseDate.toISOString().split('T')[0] : '',
      p.isLimited ? 'Yes' : 'No',
      blade,
      ratchet,
      bit,
      `"${(p.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`, // Single line description for CSV
      p.imageUrl || ''
    ].join(',');
  });

  const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
  const csvPath = path.join(exportDir, 'products.csv');
  await fs.writeFile(csvPath, csvContent);
  console.log(`✅ CSV Export: ${csvPath}`);

  // 3. Markdown Export (LLM Optimized)
  let mdContent = '# RPB Product Catalog\n\n';
  mdContent += `Generated on: ${new Date().toISOString()}\n`;
  mdContent += `Total Products: ${products.length}\n\n`;

  for (const p of products) {
    mdContent += `## ${p.code}: ${p.name}\n`;
    mdContent += `- **Line**: ${p.productLine}\n`;
    mdContent += `- **Type**: ${p.productType}\n`;
    mdContent += `- **Price**: ¥${p.price?.toLocaleString() || '?'}\n`;
    if (p.releaseDate) mdContent += `- **Release Date**: ${p.releaseDate.toISOString().split('T')[0]}\n`;
    if (p.isLimited) mdContent += `- **Limited**: ${p.limitedNote || 'Yes'}\n`;
    
    const b = p.beyblades[0];
    if (b) {
      mdContent += `- **Parts**:\n`;
      mdContent += `  - **Blade**: ${b.blade.name} (Type: ${b.blade.beyType})\n`;
      mdContent += `  - **Ratchet**: ${b.ratchet.name}\n`;
      mdContent += `  - **Bit**: ${b.bit.name}\n`;
    }

    if (p.description) {
      mdContent += `- **Description**:\n${p.description.split('\n').map(l => `  > ${l}`).join('\n')}\n`;
    }
    
    if (p.imageUrl) {
      mdContent += `\n![Product Image](${p.imageUrl})\n`;
    }

    mdContent += '\n---\n\n';
  }

  const mdPath = path.join(exportDir, 'products_llm.md');
  await fs.writeFile(mdPath, mdContent);
  console.log(`✅ Markdown Export: ${mdPath}`);
  
  console.log('✨ All exports completed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
