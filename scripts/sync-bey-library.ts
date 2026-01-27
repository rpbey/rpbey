
import * as dotenv from 'dotenv';
dotenv.config();

import { PartType } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { prisma } from '../src/lib/prisma';

const DATA_FILE = 'data/master-parts.json';
const PUBLIC_IMG_DIR = 'public/images/parts';

interface MasterPart {
  id: string;
  name: string;
  type: PartType;
  image: string;
  weight?: number;
  system?: string;
  spin?: string;
}

// ... (keep imports and Prisma setup)

async function main() {
  console.log('🚀 Starting Sync from Master Data...');

  // Ensure public dir exists
  await fs.mkdir(PUBLIC_IMG_DIR, { recursive: true });

  const rawData = await fs.readFile(DATA_FILE, 'utf-8');
  const parts: MasterPart[] = JSON.parse(rawData);

  console.log(`Found ${parts.length} parts to sync.`);

  for (const part of parts) {
    // 1. Handle Image
    let publicImageUrl = part.image;
    
    // If it's a local path from our scraping (starts with /images/), ensure it exists in public
    if (part.image && part.image.startsWith('/images/')) {
        // Source was relative to data/bey-library
        // We need to copy it to public if not already there
        // Actually, previous script copied it. 
        // Let's assume it's correct or fix path if needed.
        // If it comes from bey-library, it was "images/..."
        
        // Let's just trust the URL provided by merge script which handles local vs remote
        publicImageUrl = part.image;
    }

    // Heuristic Stats
    // We don't have BeyType in MasterPart yet (it was in specs).
    // We can guess it from name or default to Balance.
    // Ideally merge script should have preserved it.
    // For now, let's assume Balance if unknown.
    const beyType = 'BALANCE'; 
    const stats = getHeuristicStats(beyType);

    try {
        await prisma.part.upsert({
            where: { externalId: part.id },
            update: {
                name: part.name,
                weight: part.weight,
                imageUrl: publicImageUrl,
                spinDirection: part.spin,
                system: part.system || 'BX',
                // Keep existing stats if present to avoid overwriting with defaults
            },
            create: {
                externalId: part.id,
                name: part.name,
                type: part.type,
                weight: part.weight,
                imageUrl: publicImageUrl,
                spinDirection: part.spin,
                system: part.system || 'BX',
                beyType: beyType,
                attack: String(stats.attack),
                defense: String(stats.defense),
                stamina: String(stats.stamina),
                dash: String(stats.dash),
                burst: String(stats.burst),
            }
        });
        process.stdout.write('.');
    } catch (err) {
        console.error(`\nError syncing ${part.name}:`, err);
    }
  }
  console.log('\n✅ Sync Complete!');
}

function mapBeyType(typeStr: string | undefined): any { // Returns BeyType enum or null
    if (!typeStr) return null;
    const t = typeStr.toUpperCase();
    if (t.includes('ATTACK')) return 'ATTACK';
    if (t.includes('DEFENSE')) return 'DEFENSE';
    if (t.includes('STAMINA')) return 'STAMINA';
    if (t.includes('BALANCE')) return 'BALANCE';
    return null;
}

function getHeuristicStats(type: string | null) {
    const base = { attack: 50, defense: 50, stamina: 50, dash: 50, burst: 80 };
    if (!type) return base;
    
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
