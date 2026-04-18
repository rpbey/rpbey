
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const DATA_DIR = path.resolve(process.cwd(), 'temp_extract');
const OUTPUT_DIR = path.resolve(process.cwd(), 'data/cleaned');

function cleanText(str: string): string {
  return str ? str.trim() : '';
}

async function extractImages() {
  console.log('🖼️ Extracting Images from "Pic Bank.html"...');
  const html = fs.readFileSync(path.join(DATA_DIR, 'Pic Bank.html'), 'utf-8');
  const $ = cheerio.load(html);

  const images = {
    blades: {} as Record<string, string>,
    ratchets: {} as Record<string, string>,
    bits: {} as Record<string, string>,
  };

  const rows = $('tr').toArray();

  for (let i = 0; i < rows.length; i++) {
    const cells = $(rows[i]).find('td');
    
    // Blade: Col M (index 12) -> Pic N (index 13)
    const bladeName = cleanText($(cells[12]).text());
    const bladeImg = $(cells[13]).find('img').attr('src');
    if (bladeName && bladeImg && bladeName !== 'Blade') {
        images.blades[bladeName.toLowerCase()] = bladeImg;
    }

    // Ratchet: Col P (15) -> Pic Q (16)
    const ratchetName = cleanText($(cells[15]).text());
    const ratchetImg = $(cells[16]).find('img').attr('src');
    if (ratchetName && ratchetImg && ratchetName !== 'Ratchet') {
        images.ratchets[ratchetName.toLowerCase()] = ratchetImg;
    }

    // Bit: Col S (18) -> Pic T (19)
    const bitName = cleanText($(cells[18]).text());
    const bitImg = $(cells[19]).find('img').attr('src');
    if (bitName && bitImg && bitName !== 'Bit') {
        images.bits[bitName.toLowerCase()] = bitImg;
    }
  }

  await Bun.write(path.join(OUTPUT_DIR, 'images.json'), JSON.stringify(images, null, 2));
  console.log(`   Found ${Object.keys(images.blades).length} blade images.`);
  console.log(`   Found ${Object.keys(images.ratchets).length} ratchet images.`);
  console.log(`   Found ${Object.keys(images.bits).length} bit images.`);
}

async function extractHasbro() {
  console.log('🌍 Extracting Hasbro Data from "Release TT-HASBRO.html"...');
  const html = fs.readFileSync(path.join(DATA_DIR, 'Release TT-HASBRO.html'), 'utf-8');
  const $ = cheerio.load(html);

  const hasbroData = [] as any[];

  const rows = $('tr').toArray();
  // Col A(0): TT ID (BX-01)
  // Col I(8): Hasbro ID (F9580)
  // Col K(10): Hasbro Name
  
  for (let i = 0; i < rows.length; i++) {
    const cells = $(rows[i]).find('td');
    
    const ttId = cleanText($(cells[0]).text());
    const hasbroId = cleanText($(cells[8]).text());
    const hasbroName = cleanText($(cells[10]).text());

    if (ttId && (ttId.startsWith('BX') || ttId.startsWith('UX')) && hasbroId) {
        hasbroData.push({
            ttId,
            hasbroId,
            hasbroName
        });
    }
  }

  await Bun.write(path.join(OUTPUT_DIR, 'hasbro.json'), JSON.stringify(hasbroData, null, 2));
  console.log(`   Found ${hasbroData.length} Hasbro mappings.`);
}

async function main() {
    await extractImages();
    await extractHasbro();
}

main();
