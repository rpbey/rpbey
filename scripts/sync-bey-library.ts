import * as dotenv from 'dotenv';
dotenv.config();

import { PartType, BeyType, PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { prisma } from '../src/lib/prisma';

const DATA_FILE = 'data/bey-library/bey-library.json';
const PUBLIC_IMG_DIR = 'public/images/parts';

interface ScrapedPart {
  id: string;
  category: string;
  name: string;
  code: string;
  specs: Record<string, string>;
  imageUrl: string;
  localImagePath: string;
  sourceUrl: string;
}

const CATEGORY_MAP: Record<string, PartType> = {
  'blade': 'BLADE',
  'ratchet': 'RATCHET',
  'bit': 'BIT',
  'assist-blade': 'ASSIST_BLADE',
  'lock-chip': 'LOCK_CHIP',
  'over-blade': 'BLADE',
  'x-over': 'BLADE'
};

async function main() {
  console.log('🚀 Starting Sync from Scraped Library Data...');

  // Ensure public dir exists
  await fs.mkdir(PUBLIC_IMG_DIR, { recursive: true });

  if (!(await fs.stat(DATA_FILE).catch(() => null))) {
    console.error(`❌ Data file not found: ${DATA_FILE}`);
    return;
  }

  const rawData = await fs.readFile(DATA_FILE, 'utf-8');
  const scrapedParts: ScrapedPart[] = JSON.parse(rawData);

  console.log(`Found ${scrapedParts.length} parts in scraped data.`);

  let updated = 0;
  let created = 0;

  for (const part of scrapedParts) {
    const partType = CATEGORY_MAP[part.category];
    if (!partType) {
      // console.log(`Skipping unknown category: ${part.category}`);
      continue;
    }

    // 1. Image handling
    // If localImagePath exists, we should use it. 
    // It's relative to data/bey-library/
    let finalImageUrl = part.imageUrl;
    if (part.localImagePath) {
        const srcPath = path.join('data/bey-library', part.localImagePath);
        const destFilename = `${part.category}_${part.id.toLowerCase()}${path.extname(part.localImagePath) || '.webp'}`.replace(/[^a-z0-9._-]/gi, '_');
        const destPath = path.join(PUBLIC_IMG_DIR, destFilename);
        
        try {
            await fs.access(srcPath);
            await fs.copyFile(srcPath, destPath);
            finalImageUrl = `/images/parts/${destFilename}`;
        } catch (e) {
            // Local file not found, keep original URL
        }
    }

    // 2. Metadata extraction
    const system = part.code?.startsWith('UX') ? 'UX' : part.code?.startsWith('CX') ? 'CX' : 'BX';
    const beyTypeStr = part.specs['Type'] || part.specs['Bey Type'] || 'BALANCE';
    const beyType = mapBeyType(beyTypeStr) || 'BALANCE';
    const weight = parseFloat(part.specs['Weight'] || '0') || null;
    
    const stats = getHeuristicStats(beyType);

    try {
        await prisma.part.upsert({
            where: { externalId: part.id },
            update: {
                name: part.name,
                type: partType,
                weight: weight,
                imageUrl: finalImageUrl,
                system: system,
                beyType: beyType,
                // Optional: update stats if needed, or leave existing
            },
            create: {
                externalId: part.id,
                name: part.name,
                type: partType,
                weight: weight,
                imageUrl: finalImageUrl,
                system: system,
                beyType: beyType,
                attack: part.specs['Attack'] || String(stats.attack),
                defense: part.specs['Defense'] || String(stats.defense),
                stamina: part.specs['Stamina'] || String(stats.stamina),
                dash: part.specs['Dash'] || String(stats.dash),
                burst: part.specs['Burst'] || String(stats.burst),
            }
        });
        updated++;
        process.stdout.write('.');
    } catch (err) {
        console.error(`\nError syncing ${part.name}:`, (err as any).message);
    }
  }

  console.log(`\n✅ Sync Complete! Updated/Created: ${updated}`);
}

function mapBeyType(typeStr: string | undefined): BeyType | null {
    if (!typeStr) return null;
    const t = typeStr.toUpperCase();
    if (t.includes('ATTACK')) return 'ATTACK';
    if (t.includes('DEFENSE')) return 'DEFENSE';
    if (t.includes('STAMINA')) return 'STAMINA';
    if (t.includes('BALANCE')) return 'BALANCE';
    return null;
}

function getHeuristicStats(type: BeyType) {
    const base = { attack: 50, defense: 50, stamina: 50, dash: 50, burst: 80 };
    switch (type) {
        case 'ATTACK': return { ...base, attack: 85, defense: 30, stamina: 25, dash: 80 };
        case 'DEFENSE': return { ...base, attack: 30, defense: 85, stamina: 55, dash: 20 };
        case 'STAMINA': return { ...base, attack: 25, defense: 40, stamina: 85, dash: 30 };
        case 'BALANCE': return { ...base, attack: 65, defense: 65, stamina: 65, dash: 50 };
        default: return base;
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
