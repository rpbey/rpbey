/**
 * Sync weight data from master-parts.json into the database.
 * Uses pg directly to avoid PrismaClient adapter issues in scripts.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

interface MasterPart {
  id: string;
  name: string;
  type: string;
  weight?: number;
}

async function main() {
  const raw = readFileSync(
    path.join(process.cwd(), 'data', 'master-parts.json'),
    'utf-8',
  );
  const masterParts: MasterPart[] = JSON.parse(raw);

  // Build lookup by normalized name
  const weightByName = new Map<string, number>();
  for (const mp of masterParts) {
    if (mp.weight != null && mp.weight > 0) {
      weightByName.set(mp.name.toLowerCase().trim(), mp.weight);
    }
  }

  console.log(`Master parts with weight: ${weightByName.size}`);

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  // Get all parts missing weight from DB
  const { rows: partsWithoutWeight } = await pool.query<{
    id: string;
    name: string;
    type: string;
  }>('SELECT id, name, type FROM parts WHERE weight IS NULL');

  console.log(`DB parts missing weight: ${partsWithoutWeight.length}`);

  let updated = 0;
  let notFound = 0;
  const notFoundParts: string[] = [];

  for (const part of partsWithoutWeight) {
    const normalizedName = part.name.toLowerCase().trim();
    let weight = weightByName.get(normalizedName);

    // Fuzzy match for assist blades: "S (Slash)" → look for "slash"
    if (weight == null) {
      const parenMatch = part.name.match(/\((\w+)\)/);
      if (parenMatch?.[1]) {
        weight = weightByName.get(parenMatch[1].toLowerCase());
      }
    }

    if (weight != null) {
      await pool.query('UPDATE parts SET weight = $1 WHERE id = $2', [
        weight,
        part.id,
      ]);
      updated++;
      console.log(`  ✓ ${part.type} "${part.name}" → ${weight}g`);
    } else {
      notFound++;
      notFoundParts.push(`${part.type}: ${part.name}`);
    }
  }

  console.log(
    `\nResults: ${updated} updated, ${notFound} not found in master data`,
  );
  if (notFoundParts.length > 0 && notFoundParts.length <= 30) {
    console.log('\nNot found:');
    for (const p of notFoundParts) {
      console.log(`  - ${p}`);
    }
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
