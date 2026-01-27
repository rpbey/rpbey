
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const DATA_DIR = path.resolve(process.cwd(), 'temp_extract');
const OUTPUT_DIR = path.resolve(process.cwd(), 'data/cleaned_new');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function parseWeight(str: string): number | null {
  if (!str) return null;
  const match = str.replace(',', '.').match(/([\d\.]+)/);
  return match ? parseFloat(match[1]) : null;
}

function cleanText(str: string): string {
  return str ? str.trim() : '';
}

async function extractParts() {
  console.log('📦 Extracting Parts from "Bey X Part List.html"...');
  const html = fs.readFileSync(path.join(DATA_DIR, 'Bey X Part List.html'), 'utf-8');
  const $ = cheerio.load(html);

  const parts = {
    blades: [] as any[],
    ratchets: [] as any[],
    bits: [] as any[],
  };

  // The sheet structure seems to be one giant table.
  // Based on the grep output:
  // Blades: Cols A-E (Indices 1-5, but cheerio uses 0-based index on tr children usually, but checking headers)
  // Let's iterate rows and try to map columns.
  
  // Note: Google Sheets HTML export often uses specific column indices.
  // We'll traverse rows and look at specific offsets.
  // Rows start effectively at row index 3 (Header is row 3 in 1-based, so index 2). Data starts at index 3?
  
  const rows = $('tr').toArray();
  
  // Skipping header rows. Inspecting row 4 (index 3) onwards for data.
  // Based on previous grep:
  // Col 0 (Header cell)
  // Col 1 (A): Blade Name
  // Col 2 (B): Spin
  // Col 3 (C): ATT
  // Col 4 (D): DEF
  // Col 5 (E): STM
  // Col 6 (F): Weight
  
  // RATCHETS:
  // Col 24 (X): Name (e.g. 0-70)
  // Col 25 (Y): Spin (R) - wait, Ratchets don't usually have spin unless unique? 
  // Let's re-examine the grep output for Ratchets.
  // "0-70" is in the grep output.
  // The grep showed: `<td class="s6">0-70</td>...`
  // It's tricky to guess the exact column index from just grep. 
  // Strategy: Find the header row, identify column indices for "Blades", "Ratchets", "Bits".
  
  // However, since I can't interactively debug easily, I'll assume the standard layout from the grep:
  // Blade Name is at index 1 (A).
  // Ratchet Name is at index 23 (X) ? (A=1... X=24)
  // Bit Name is at index 29 (AD) ?
  
  // Let's try to grab data by checking if the cell has content.
  
  for (let i = 3; i < rows.length; i++) {
    const cells = $(rows[i]).find('td');
    if (cells.length === 0) continue;

    // --- BLADES ---
    // Col A is index 0.
    const bladeName = cleanText($(cells[0]).text()); // Col A
    if (bladeName && bladeName !== 'Name' && bladeName !== 'Spin' && !bladeName.includes('Blades')) {
      parts.blades.push({
        name: bladeName,
        spin: cleanText($(cells[1]).text()), // Col B
        stats: {
          attack: cleanText($(cells[2]).text()), // Col C
          defense: cleanText($(cells[3]).text()), // Col D
          stamina: cleanText($(cells[4]).text()), // Col E
          weight: parseWeight($(cells[5]).text()), // Col F
        }
      });
    }

    // --- RATCHETS ---
    // Col X is index 23.
    const ratchetName = cleanText($(cells[23]).text());
    if (ratchetName && ratchetName.match(/^\d+-\d+/) && ratchetName !== 'Name') {
       parts.ratchets.push({
        name: ratchetName,
        stats: {
          attack: cleanText($(cells[25]).text()), // Z (25)
          defense: cleanText($(cells[26]).text()), // AA (26)
          stamina: cleanText($(cells[27]).text()), // AB (27)
          weight: parseWeight($(cells[28]).text()), // AC (28)
        }
       });
    }

    // --- BITS ---
    // Col AD is index 29.
    const bitName = cleanText($(cells[29]).text()); 
    if (bitName && bitName.length > 0 && bitName !== 'Name') {
       // Check if it looks like a bit (Name + ID)
       const bitId = cleanText($(cells[30]).text()); // AE (30)
       if (bitId.length > 0 && bitId.length <= 3 && bitId !== 'ID') {
         parts.bits.push({
           name: bitName,
           code: bitId,
           stats: {
             attack: cleanText($(cells[32]).text()), // AG (32)
             defense: cleanText($(cells[33]).text()), // AH (33)
             stamina: cleanText($(cells[34]).text()), // AI (34)
             dash: cleanText($(cells[35]).text()), // AJ (35)
             burst: cleanText($(cells[36]).text()), // AK (36)
             weight: parseWeight($(cells[37]).text()), // AL (37)
             type: cleanText($(cells[38]).text()) // AM (38)
           }
         });
       }
    }
  }

  console.log(`   Found ${parts.blades.length} blades.`);
  console.log(`   Found ${parts.ratchets.length} ratchets.`);
  console.log(`   Found ${parts.bits.length} bits.`);

  fs.writeFileSync(path.join(OUTPUT_DIR, 'blades_new.json'), JSON.stringify(parts.blades, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ratchets_new.json'), JSON.stringify(parts.ratchets, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'bits_new.json'), JSON.stringify(parts.bits, null, 2));
}

async function extractBeys() {
    console.log('🌪️ Extracting Beys from "Beys List.html"...');
    const html = fs.readFileSync(path.join(DATA_DIR, 'Beys List.html'), 'utf-8');
    const $ = cheerio.load(html);
    
    const beys = [];
    const rows = $('tr').toArray();

    // Mapping based on previous grep:
    // A: ID (BX-01)
    // B: Image?
    // D: Blade Name
    // G: Ratchet
    // I: Bit Code?
    // J: Bit Name?
    
    // Let's refine based on grep:
    // id="...C0" (Col A) -> ID (BX-01)
    // id="...C3" (Col D) -> Blade Name (DranSword)
    // id="...C6" (Col G) -> Ratchet (3-60)
    // id="...C7" (Col H) -> Bit Code (F)
    // id="...C8" (Col I) -> Bit Name (Flat)
    
    for (let i = 2; i < rows.length; i++) { // Data starts row 3 (index 2)
        const cells = $(rows[i]).find('td');
        if (cells.length === 0) continue;

        const id = cleanText($(cells[1]).text()); // Col A
        if (!id.startsWith('BX') && !id.startsWith('UX') && !id.startsWith('CX')) continue;

        beys.push({
            code: id,
            blade: cleanText($(cells[3]).text()), // Col D
            ratchet: cleanText($(cells[6]).text()), // Col G
            bit: cleanText($(cells[8]).text()), // Col I (Name) - wait, header said I is Bit Name?
            // Grep said: <td class="s13">F</td> (Col H) <td class="s13">Flat</td> (Col I)
            // So Col H (index 7) is Code, Col I (index 8) is Name.
            bitCode: cleanText($(cells[7]).text()),
            type: cleanText($(cells[9]).text()), // Col J (Type? OG/Recolor)
            productType: cleanText($(cells[15]).text()) // Col P (Starter/Booster) - roughly
        });
    }

    console.log(`   Found ${beys.length} beys.`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'beys_new.json'), JSON.stringify(beys, null, 2));
}

async function main() {
  await extractParts();
  await extractBeys();
}

main();
