
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🚀 Extracting Part Images from Fandom Data...');

  const detailsDir = 'data/fandom_details';
  const files = await fs.readdir(detailsDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  console.log(`Processing ${jsonFiles.length} files...`);

  let updatedParts = 0;

  for (const file of jsonFiles) {
    const content = await fs.readFile(path.join(detailsDir, file), 'utf-8');
    const page = JSON.parse(content);
    const markdown = page.markdown || "";

    // 1. Extract Blade Image
    // Look for "## Blade - [Name]" followed by an image link
    const bladeMatch = markdown.match(/## Blade - ([^\n]+)\n\n\[!\\[[^\\]]*\\]\([^)]+\)\n\n\]\((https:\/\/static\.wikia\.nocookie\.net\/beyblade\/images\/[^)]+)\)/i);
    if (bladeMatch) {
      const name = bladeMatch[1].trim();
      const imageUrl = bladeMatch[2];
      const result = await prisma.part.updateMany({
        where: { name: { contains: name, mode: 'insensitive' }, type: 'BLADE' },
        data: { imageUrl }
      });
      if (result.count > 0) {
          console.log(`✅ Blade: ${name} -> ${imageUrl.substring(0, 60)}...`);
          updatedParts += result.count;
      }
    }

    // 2. Extract Ratchet Image
    const ratchetMatch = markdown.match(/## Ratchet - ([^\n]+)\n\n\[!\\[[^\\]]*\\]\([^)]+\)\n\n\]\((https:\/\/static\.wikia\.nocookie\.net\/beyblade\/images\/[^)]+)\)/i);
    if (ratchetMatch) {
      const name = ratchetMatch[1].trim();
      const imageUrl = ratchetMatch[2];
      const result = await prisma.part.updateMany({
        where: { name: { contains: name, mode: 'insensitive' }, type: 'RATCHET' },
        data: { imageUrl }
      });
      if (result.count > 0) {
          console.log(`✅ Ratchet: ${name} -> ${imageUrl.substring(0, 60)}...`);
          updatedParts += result.count;
      }
    }

    // 3. Extract Bit Image
    const bitMatch = markdown.match(/## Bit - ([^\n]+)\n\n\[!\\[[^\\]]*\\]\([^)]+\)\]\((https:\/\/static\.wikia\.nocookie\.net\/beyblade\/images\/[^)]+)\)/i);
    if (bitMatch) {
      const name = bitMatch[1].trim();
      const imageUrl = bitMatch[2];
      const result = await prisma.part.updateMany({
        where: { name: { contains: name, mode: 'insensitive' }, type: 'BIT' },
        data: { imageUrl }
      });
      if (result.count > 0) {
          console.log(`✅ Bit: ${name} -> ${imageUrl.substring(0, 60)}...`);
          updatedParts += result.count;
      }
    }
  }

  console.log(`\n✨ Update complete! Updated ${updatedParts} parts.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
