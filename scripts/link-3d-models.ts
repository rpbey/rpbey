import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';
import type { BeyManifest } from '../src/types/bey';
import { PartType } from '@/generated/prisma/client';

const MANIFEST_PATH = path.join(process.cwd(), 'public/bey-manifest.json');
const OUTPUT_PATH = path.join(process.cwd(), 'public/data/part-model-map.json');

function normalize(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function link() {
  console.log('🔗 Linking DB Parts with 3D Models (Strict Mode)...');

  if (!await Bun.file(MANIFEST_PATH).exists()) {
    console.error('❌ Manifest not found');
    process.exit(1);
  }

  const manifest: BeyManifest = await Bun.file(MANIFEST_PATH).json();
  const parts = await prisma.part.findMany();
  
  const mapping: Record<string, { model?: string; texture?: string }> = {};
  let matches = 0;

  for (const part of parts) {
    let model = undefined;
    let texture = undefined;

    // ========================================================================
    // BLADE LOGIC (Match Parent Folder Name)
    // ========================================================================
    if (part.type === PartType.BLADE) {
      const normName = normalize(part.name);

      model = manifest.models.find(m => {
        if (!m.category?.toLowerCase().includes('blade')) return false;
        const parts = m.path.split('/');
        const folderName = parts[parts.length - 2]; 
        return normalize(folderName) === normName;
      });

      if (!model) {
        model = manifest.models.find(m => {
           if (!m.category?.toLowerCase().includes('blade')) return false;
           return normalize(m.name) === normName;
        });
      }

      texture = manifest.textures.find(t => {
        if (!t.category?.toLowerCase().includes('blade')) return false;
        const parts = t.path.split('/');
        const folderName = parts[parts.length - 2];
        return normalize(folderName) === normName;
      });
    }

    // ========================================================================
    // RATCHET LOGIC (Match File Name)
    // ========================================================================
    else if (part.type === PartType.RATCHET) {
      const normName = normalize(part.name);

      model = manifest.models.find(m => {
        if (!m.category?.toLowerCase().includes('ratchet')) return false;
        return normalize(m.name) === normName;
      });

      texture = manifest.textures.find(t => {
        if (!t.category?.toLowerCase().includes('ratchet')) return false;
        return normalize(t.name) === normName;
      });
    }

    // ========================================================================
    // BIT LOGIC (Match Code/TipType)
    // ========================================================================
    else if (part.type === PartType.BIT) {
      const searchKey = part.tipType ? normalize(part.tipType) : normalize(part.name);

      model = manifest.models.find(m => {
        if (!m.category?.toLowerCase().includes('bit')) return false;
        return normalize(m.name) === searchKey;
      });

      texture = manifest.textures.find(t => {
        if (!t.category?.toLowerCase().includes('bit')) return false;
        return normalize(t.name) === searchKey;
      });
    }

    if (model || texture) {
      mapping[part.id] = {
        model: model?.path,
        texture: texture?.path
      };
      
      // Update DB
      await prisma.part.update({
        where: { id: part.id },
        data: {
            modelUrl: model?.path || null,
            textureUrl: texture?.path || null
        }
      });

      matches++;
    } else {
        // Reset DB if no match found (to clean up old bad links)
        await prisma.part.update({
            where: { id: part.id },
            data: {
                modelUrl: null,
                textureUrl: null
            }
        });
    }
  }

  await Bun.write(OUTPUT_PATH, JSON.stringify(mapping, null, 2));
  console.log(`✅ Linked ${matches} / ${parts.length} parts.`);
  console.log(`📂 Mapping saved to ${OUTPUT_PATH}`);
}

link()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
