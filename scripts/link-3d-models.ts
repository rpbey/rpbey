import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import type { BeyManifest } from '../src/types/bey';

const MANIFEST_PATH = path.join(process.cwd(), 'public/bey-manifest.json');
const OUTPUT_PATH = path.join(process.cwd(), 'public/data/part-model-map.json');

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function link() {
  console.log('🔗 Linking DB Parts with 3D Models...');

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ Manifest not found');
    process.exit(1);
  }

  const manifest: BeyManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const parts = await prisma.part.findMany();
  
  const mapping: Record<string, { model?: string; texture?: string }> = {};
  let matches = 0;

  for (const part of parts) {
    const normName = normalize(part.name);
    
    // Find Model
    const model = manifest.models.find(m => {
      const mName = normalize(m.name);
      // Try exact match or inclusion
      return mName === normName || mName.includes(normName) || normName.includes(mName);
    });

    // Find Texture (try to find one that matches the part name)
    const texture = manifest.textures.find(t => {
      const tName = normalize(t.name);
      return tName === normName || tName.includes(normName);
    });

    if (model || texture) {
      mapping[part.id] = {
        model: model?.path,
        texture: texture?.path
      };
      matches++;
      // console.log(`✅ Linked ${part.name} -> Model: ${model?.name}, Texture: ${texture?.name}`);
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2));
  console.log(`✅ Linked ${matches} / ${parts.length} parts.`);
  console.log(`📂 Mapping saved to ${OUTPUT_PATH}`);
}

link()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
