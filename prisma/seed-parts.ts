/**
 * RPB - Seed Parts Database (Local)
 * Imports cleaned Beyblade X parts from local JSON files (derived from new HTML extraction)
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient, PartType, type BeyType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CLEANED_DATA_DIR = path.join(process.cwd(), 'data/cleaned');

// ============================================================================ 
// Types (matching NEW cleaned JSONs)
// ============================================================================ 

interface CleanedBlade {
  name: string;
  spin: string;
  stats: {
    attack: string;
    defense: string;
    stamina: string;
    weight: number;
  };
}

interface CleanedRatchet {
  name: string;
  stats: {
    attack: string;
    defense: string;
    stamina: string;
    weight: number;
  };
}

interface CleanedBit {
  name: string;
  code: string;
  stats: {
    attack: string;
    defense: string;
    stamina: string;
    dash: string;
    burst: string; // burstResistance in DB
    weight: number;
    type: string;
  };
}

interface CleanedBey {
  blade: string;
  type: string;
}

// ============================================================================ 
// Utility Functions
// ============================================================================ 

function mapBeyType(typeStr: string): BeyType {
  if (!typeStr) return 'BALANCE';
  const t = typeStr.toUpperCase().trim();
  if (t === 'ATTACK') return 'ATTACK';
  if (t === 'DEFENSE') return 'DEFENSE';
  if (t === 'STAMINA') return 'STAMINA';
  return 'BALANCE';
}

function normalizeId(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function readJson<T>(filename: string): T {
  const filePath = path.join(CLEANED_DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeName(name: string): string {
  return name
    .replace(/\[R\]/g, '(Rush)')
    .replace(/\[U\]/g, '(Upper)')
    .replace(/\[A\]/g, '(Attack)')
    .replace(/\[D\]/g, '(Defense)')
    .replace(/\[3\]/g, '3')
    .replace(/\[6\]/g, '6')
    .trim();
}

async function seedBlades(): Promise<number> {
  const blades = readJson<CleanedBlade[]>('blades.json');
  const beys = readJson<CleanedBey[]>('beys.json');
  const images = readJson<{ blades: Record<string, string> }>('images.json').blades;
  
  // Create a map of Blade Name -> Type from the Beys list
  const bladeTypeMap = new Map<string, string>();
  beys.forEach(b => {
      // Clean bey blade name to match
      const key = normalizeName(b.blade).toLowerCase();
      if (b.type) bladeTypeMap.set(key, b.type);
  });

  console.log(`  → Found ${blades.length} blades from local data`);

  let count = 0;
  for (const blade of blades) {
    try {
      const cleanName = normalizeName(blade.name);
      const id = normalizeId(cleanName);
      
      // Lookup type
      let typeStr = bladeTypeMap.get(cleanName.toLowerCase());
      if (!typeStr) {
          typeStr = bladeTypeMap.get(cleanName.replace(/\s+/g, '').toLowerCase());
      }
      
      // Lookup image
      // Try exact name, then clean name
      let imgUrl = images[blade.name.toLowerCase()] || images[cleanName.toLowerCase()];
      // Some might have different spacing in Pic Bank vs Part List
      if (!imgUrl) imgUrl = images[cleanName.replace(/\s+/g, '').toLowerCase()];

      await prisma.part.upsert({
        where: { externalId: id },
        update: {
          name: cleanName,
          type: PartType.BLADE,
          beyType: mapBeyType(typeStr || 'BALANCE'),
          attack: blade.stats.attack,
          defense: blade.stats.defense,
          stamina: blade.stats.stamina,
          weight: blade.stats.weight,
          imageUrl: imgUrl || null,
        },
        create: {
          externalId: id,
          name: cleanName,
          type: PartType.BLADE,
          beyType: mapBeyType(typeStr || 'BALANCE'),
          attack: blade.stats.attack,
          defense: blade.stats.defense,
          stamina: blade.stats.stamina,
          weight: blade.stats.weight,
          imageUrl: imgUrl || null,
        },
      });
      count++;
    } catch (err) {
      console.error(`  ⚠️ Failed to upsert blade ${blade.name}:`, err);
    }
  }
  return count;
}

async function seedRatchets(): Promise<number> {
  const ratchets = readJson<CleanedRatchet[]>('ratchets.json');
  const images = readJson<{ ratchets: Record<string, string> }>('images.json').ratchets;

  console.log(`  → Found ${ratchets.length} ratchets from local data`);

  let count = 0;
  for (const ratchet of ratchets) {
    try {
      const cleanName = normalizeName(ratchet.name);
      const id = normalizeId(cleanName);
      
      const match = cleanName.match(/^(\d+)-(\d+)/);
      const protrusions = match?.[1] ? parseInt(match[1], 10) : null;
      const height = match?.[2] ? parseInt(match[2], 10) : null;

      const imgUrl = images[ratchet.name.toLowerCase()] || images[cleanName.toLowerCase()];

      await prisma.part.upsert({
        where: { externalId: id },
        update: {
          name: cleanName,
          type: PartType.RATCHET,
          attack: ratchet.stats.attack,
          defense: ratchet.stats.defense,
          stamina: ratchet.stats.stamina,
          weight: ratchet.stats.weight,
          protrusions,
          height,
          imageUrl: imgUrl || null,
        },
        create: {
          externalId: id,
          name: cleanName,
          type: PartType.RATCHET,
          attack: ratchet.stats.attack,
          defense: ratchet.stats.defense,
          stamina: ratchet.stats.stamina,
          weight: ratchet.stats.weight,
          protrusions,
          height,
          imageUrl: imgUrl || null,
        },
      });
      count++;
    } catch (err) {
      console.error(`  ⚠️ Failed to upsert ratchet ${ratchet.name}:`, err);
    }
  }
  return count;
}

async function seedBits(): Promise<number> {
  const bits = readJson<CleanedBit[]>('bits.json');
  const images = readJson<{ bits: Record<string, string> }>('images.json').bits;

  console.log(`  → Found ${bits.length} bits from local data`);

  let count = 0;
  for (const bit of bits) {
    try {
      const cleanName = normalizeName(bit.name);
      const id = normalizeId(cleanName);
      
      const imgUrl = images[bit.name.toLowerCase()] || images[cleanName.toLowerCase()];

      await prisma.part.upsert({
        where: { externalId: id },
        update: {
          name: cleanName,
          type: PartType.BIT,
          attack: bit.stats.attack,
          defense: bit.stats.defense,
          stamina: bit.stats.stamina,
          dash: bit.stats.dash,
          burst: bit.stats.burst,
          weight: bit.stats.weight,
          tipType: bit.code,
          beyType: mapBeyType(bit.stats.type),
          imageUrl: imgUrl || null,
        },
        create: {
          externalId: id,
          name: cleanName,
          type: PartType.BIT,
          attack: bit.stats.attack,
          defense: bit.stats.defense,
          stamina: bit.stats.stamina,
          dash: bit.stats.dash,
          burst: bit.stats.burst,
          weight: bit.stats.weight,
          tipType: bit.code,
          beyType: mapBeyType(bit.stats.type),
          imageUrl: imgUrl || null,
        },
      });
      count++;
    } catch (err) {
      console.error(`  ⚠️ Failed to upsert bit ${bit.name}:`, err);
    }
  }
  return count;
}

// ============================================================================ 
// Main
// ============================================================================ 

async function main() {
  console.log('🌀 RPB Local Parts Database Seeder (Updated)');
  console.log('==========================================\n');

  console.log('📦 Seeding Blades...');
  const bladeCount = await seedBlades();
  console.log(`  ✅ ${bladeCount} blades seeded\n`);

  console.log('⚙️ Seeding Ratchets...');
  const ratchetCount = await seedRatchets();
  console.log(`  ✅ ${ratchetCount} ratchets seeded\n`);

  console.log('💫 Seeding Bits...');
  const bitCount = await seedBits();
  console.log(`  ✅ ${bitCount} bits seeded\n`);

  console.log('==========================================');
  console.log(`🎉 Total: ${bladeCount + ratchetCount + bitCount} parts seeded!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });