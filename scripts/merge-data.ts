
import * as fs from 'fs/promises';
import { PartType } from '@prisma/client';

const BEY_LIBRARY_FILE = 'data/bey-library/bey-library.json';
const PLANNER_FILE = 'data/planner/parts.json';
const OUTPUT_FILE = 'data/master-parts.json';

interface MasterPart {
  id: string; // Slug
  name: string;
  type: PartType;
  image: string;
  weight?: number;
  system?: string;
  spin?: string;
  sources: string[];
}

async function merge() {
  const libData = JSON.parse(await fs.readFile(BEY_LIBRARY_FILE, 'utf-8'));
  const plannerData = JSON.parse(await fs.readFile(PLANNER_FILE, 'utf-8'));

  const masterMap = new Map<string, MasterPart>();

  // 1. Process Bey Library (Primary Source)
  for (const item of libData) {
    const type = mapCategory(item.category);
    const id = generateId(type, item.name);
    
    // Parse weight "35g" -> 35
    let weight = item.specs?.Weight ? parseFloat(item.specs.Weight.replace(/[^0-9.]/g, '')) : undefined;

    masterMap.set(id, {
      id,
      name: item.name,
      type,
      image: item.localImagePath ? `/${item.localImagePath}` : item.imageUrl,
      weight,
      system: item.specs?.['Product Line'] || item.specs?.System || 'BX',
      spin: item.specs?.Spin,
      sources: ['bey-library']
    });
  }

  // 2. Process Planner (Secondary Source)
  for (const item of plannerData) {
    const type = mapCategory(item.category);
    const id = generateId(type, item.name);

    if (masterMap.has(id)) {
      // Enrich existing
      const existing = masterMap.get(id)!;
      existing.sources.push('planner');
      // Could add alternate image here
    } else {
      // Add new
      masterMap.set(id, {
        id,
        name: item.name,
        type,
        image: item.image, // URL from planner
        sources: ['planner']
      });
    }
  }

  const result = Array.from(masterMap.values());
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(result, null, 2));
  console.log(`Merged ${result.length} unique parts.`);
}

function mapCategory(cat: string): PartType {
  const c = cat.toUpperCase();
  if (c.includes('BLADE')) return 'BLADE';
  if (c.includes('RATCHET')) return 'RATCHET';
  if (c.includes('BIT')) return 'BIT';
  return 'BLADE'; // Default fallback
}

function generateId(type: string, name: string) {
  return `${type}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

merge();
