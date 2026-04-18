/**
 * Second pass: sync weight data from cleaned JSON files (blades, ratchets, bits)
 * into the database. These have more precise weights than master-parts.json.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

function loadJson(filename: string) {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), 'data', 'cleaned', filename), 'utf-8'),
  );
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function main() {
  const blades: { name: string; stats: { weight?: number } }[] =
    loadJson('blades.json');
  const ratchets: { name: string; stats: { weight?: number } }[] =
    loadJson('ratchets.json');
  const bits: { name: string; code?: string; stats: { weight?: number } }[] =
    loadJson('bits.json');

  // Build lookup maps
  const weightByNormalizedName = new Map<string, number>();

  for (const b of blades) {
    if (b.stats.weight != null) {
      weightByNormalizedName.set(normalize(b.name), b.stats.weight);
    }
  }

  for (const r of ratchets) {
    if (r.stats.weight != null) {
      weightByNormalizedName.set(normalize(r.name), r.stats.weight);
    }
  }

  for (const b of bits) {
    if (b.stats.weight != null) {
      // Bits in cleaned data use name like "Accel" but DB has "A (Accel)" format
      weightByNormalizedName.set(normalize(b.name), b.stats.weight);
      if (b.code) {
        // Also store by code pattern matching DB format
        const dbName = `${b.code} (${b.name})`.toLowerCase().replace(/[^a-z0-9]/g, '');
        weightByNormalizedName.set(dbName, b.stats.weight);
      }
    }
  }

  console.log(`Weight entries from cleaned data: ${weightByNormalizedName.size}`);

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  // Get all parts still missing weight
  const { rows: partsWithoutWeight } = await pool.query<{
    id: string;
    name: string;
    type: string;
  }>('SELECT id, name, type FROM parts WHERE weight IS NULL');

  console.log(`DB parts still missing weight: ${partsWithoutWeight.length}`);

  let updated = 0;

  for (const part of partsWithoutWeight) {
    const norm = normalize(part.name);
    let weight = weightByNormalizedName.get(norm);

    // Try removing parenthetical for bits: "A (Accel)" → "accel"
    if (weight == null) {
      const parenMatch = part.name.match(/\((\w+)\)/);
      if (parenMatch?.[1]) {
        weight = weightByNormalizedName.get(normalize(parenMatch[1]));
      }
    }

    // Try the code+name combo: "A (Accel)" → "aaccel"
    if (weight == null) {
      const codeMatch = part.name.match(/^(\w+)\s*\(/);
      if (codeMatch?.[1]) {
        weight = weightByNormalizedName.get(normalize(part.name));
      }
    }

    if (weight != null) {
      await pool.query('UPDATE parts SET weight = $1 WHERE id = $2', [
        weight,
        part.id,
      ]);
      updated++;
      console.log(`  ✓ ${part.type} "${part.name}" → ${weight}g`);
    }
  }

  // Final state
  const { rows: summary } = await pool.query(
    "SELECT type, COUNT(*) as total, COUNT(weight) as with_weight FROM parts GROUP BY type ORDER BY type",
  );
  console.log(`\nUpdated: ${updated} parts`);
  console.log('\nFinal state:');
  for (const row of summary) {
    const pct = Math.round((Number(row.with_weight) / Number(row.total)) * 100);
    console.log(`  ${row.type}: ${row.with_weight}/${row.total} (${pct}%)`);
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
