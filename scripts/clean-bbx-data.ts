import fs from 'node:fs';
import path from 'node:path';

const inputFile = path.join(process.cwd(), 'public/data/bbx_data.json');
const outputDir = path.join(process.cwd(), 'data/cleaned');

// Helper to safely parse numbers
const parseNum = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const clean = val.replace(',', '.').replace(/[^0-9.]/g, '');
    return parseFloat(clean) || 0;
  }
  return 0;
};

// Helper to normalize strings (remove extra spaces, fix case if needed)
const cleanStr = (val: any): string => {
  return String(val || '').trim();
};

async function cleanData() {
  console.log('🧹 Cleaning BBX Data...');
  
  if (!await Bun.file(inputFile).exists()) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  const rawData = await Bun.file(inputFile).json();
  const partList = rawData['Bey X Part List'];

  if (!partList || !Array.isArray(partList)) {
    console.error('❌ "Bey X Part List" not found or invalid format.');
    process.exit(1);
  }

  // Remove the header row
  const dataRows = partList.filter(row => row['Blades'] !== 'Name' && row['Blades']);

  const blades: any[] = [];
  const ratchets: any[] = [];
  const bits: any[] = [];

  const bladesSeen = new Set<string>();
  const ratchetsSeen = new Set<string>();
  const bitsSeen = new Set<string>();

  for (const row of dataRows) {
    // --- BLADES ---
    const bladeName = cleanStr(row['Blades']);
    if (bladeName && !bladesSeen.has(bladeName)) {
      bladesSeen.add(bladeName);
      blades.push({
        name: bladeName,
        type: cleanStr(row['50'] || 'Balance'),
        stats: {
          attack: parseNum(row['__EMPTY_1']), 
          defense: parseNum(row['__EMPTY_2']),
          stamina: parseNum(row['__EMPTY_3']),
          weight: parseNum(row['13']), // Verified: Column 13 is Blade Weight
        },
        spin: cleanStr(row['__EMPTY']),
      });
    }

    // --- RATCHETS ---
    const ratchetName = cleanStr(row['Ratchets']);
    if (ratchetName && !ratchetsSeen.has(ratchetName)) {
      ratchetsSeen.add(ratchetName);
      // Heuristic for Ratchet Weight: Column 15 seems to track Ratchet Weight in stock combos.
      // Since lists might be independent, this is best effort.
      // Defaulting to 6g if 0 or suspiciously low/high.
      let weight = parseNum(row['15']);
      if (weight < 4 || weight > 10) weight = 6.0;

      ratchets.push({
        name: ratchetName,
        code: cleanStr(row['__EMPTY_17']),
        stats: {
          attack: parseNum(row['__EMPTY_18']),
          defense: parseNum(row['__EMPTY_19']),
          stamina: parseNum(row['__EMPTY_20']),
          weight: weight, 
        },
        spin: cleanStr(row['__EMPTY_16']),
      });
    }

    // --- BITS ---
    const bitName = cleanStr(row['Bits']);
    if (bitName && !bitsSeen.has(bitName)) {
      bitsSeen.add(bitName);
      bits.push({
        name: bitName,
        code: cleanStr(row['__EMPTY_23']),
        id: cleanStr(row['__EMPTY_21']),
        stats: {
          attack: parseNum(row['__EMPTY_24']),
          defense: parseNum(row['__EMPTY_25']),
          stamina: parseNum(row['__EMPTY_26']),
          dash: parseNum(row['__EMPTY_27']),
          burstResistance: parseNum(row['__EMPTY_28']),
          weight: parseNum(row['__EMPTY_29']), // Verified: __EMPTY_29 is Bit Weight
        },
        spin: cleanStr(row['__EMPTY_22']),
      });
    }
  }

  // Save to files
  await Bun.write(path.join(outputDir, 'blades.json'), JSON.stringify(blades, null, 2));
  await Bun.write(path.join(outputDir, 'ratchets.json'), JSON.stringify(ratchets, null, 2));
  await Bun.write(path.join(outputDir, 'bits.json'), JSON.stringify(bits, null, 2));

  console.log(`✅ Extracted:`);
  console.log(`   - ${blades.length} Blades`);
  console.log(`   - ${ratchets.length} Ratchets`);
  console.log(`   - ${bits.length} Bits`);
}

cleanData();