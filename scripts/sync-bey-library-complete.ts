
import { PrismaPg } from '@prisma/adapter-pg';
import { BeyType, PartType, PrismaClient } from '@/generated/prisma/client';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import pg from 'pg';

// Create a direct pg pool for script usage
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DATA_FILE = 'data/bey-library/bey-library-complete.json';
const PUBLIC_IMG_DIR = 'public/images/parts';
const CONCURRENCY = 10;

interface BeyLibraryPart {
  id: string;
  category: string;
  name: string;
  code: string;
  type: string | null;
  spin: string | null;
  weight: number | null;
  specs: Record<string, string | number>;
  imageUrl: string;
  variantCount: number;
  variants: { name: string; imageUrl: string }[];
  sourceUrl: string;
}

const CATEGORY_TO_PART_TYPE: Record<string, PartType> = {
  blade: 'BLADE',
  'over-blade': 'BLADE',
  'assist-blade': 'ASSIST_BLADE',
  'lock-chip': 'LOCK_CHIP',
  'x-over': 'BLADE',
  ratchet: 'RATCHET',
  bit: 'BIT',
};

function mapBeyType(typeStr: string | null | undefined): BeyType | null {
  if (!typeStr) return null;
  const t = typeStr.toUpperCase();
  if (t.includes('ATTACK')) return 'ATTACK';
  if (t.includes('DEFENSE')) return 'DEFENSE';
  if (t.includes('STAMINA')) return 'STAMINA';
  if (t.includes('BALANCE')) return 'BALANCE';
  return null;
}

function extractSystem(code: string): string {
  if (code.startsWith('UX')) return 'UX';
  if (code.startsWith('CX')) return 'CX';
  if (code.startsWith('BX')) return 'BX';
  if (code.includes('Collab')) return 'COLLAB';
  return 'BX';
}

function parseHeight(specs: Record<string, string | number>): number | null {
  const raw = specs?.Height;
  if (!raw) return null;
  const match = String(raw).match(/([\d.]+)/);
  return match ? Math.round(parseFloat(match[1])) : null;
}

function parseContactPoints(specs: Record<string, string | number>): number | null {
  const raw = specs?.['Contact Points'];
  if (raw === undefined || raw === null) return null;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw));
  return isNaN(n) ? null : n;
}

function getHeuristicStats(type: BeyType | null) {
  const base = { attack: 50, defense: 50, stamina: 50, dash: 50, burst: 80 };
  if (!type) return base;
  switch (type) {
    case 'ATTACK':
      return { ...base, attack: 85, defense: 30, stamina: 25, dash: 80 };
    case 'DEFENSE':
      return { ...base, attack: 30, defense: 85, stamina: 55, dash: 20 };
    case 'STAMINA':
      return { ...base, attack: 25, defense: 40, stamina: 85, dash: 30 };
    case 'BALANCE':
      return { ...base, attack: 65, defense: 65, stamina: 65, dash: 50 };
    default:
      return base;
  }
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

function encodeImageUrl(url: string): string {
  // URLs from bey-library have spaces in paths — encode them properly
  try {
    const u = new URL(url);
    return u.toString();
  } catch {
    // If URL constructor fails (e.g. unencoded spaces), encode the path
    const [base, ...rest] = url.split('://');
    const fullPath = rest.join('://');
    const slashIdx = fullPath.indexOf('/');
    const host = fullPath.slice(0, slashIdx);
    const pathPart = fullPath.slice(slashIdx);
    return `${base}://${host}${encodeURI(pathPart)}`;
  }
}

async function downloadImage(url: string, dest: string): Promise<boolean> {
  try {
    const encoded = encodeImageUrl(url);
    const response = await fetch(encoded);
    if (!response.ok) {
      console.error(`\n  WARNING: HTTP ${response.status} for ${url}`);
      return false;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(dest, buffer);
    return true;
  } catch (err) {
    console.error(`\n  WARNING: Failed to download ${url}:`, (err as Error).message);
    return false;
  }
}

async function downloadWithConcurrency(
  tasks: { url: string; dest: string }[],
  concurrency: number,
): Promise<void> {
  let index = 0;
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      const { url, dest } = tasks[i];

      // Skip if file already exists (idempotent)
      try {
        await fs.access(dest);
        skipped++;
        continue;
      } catch {
        // File doesn't exist, proceed to download
      }

      const ok = await downloadImage(url, dest);
      if (ok) downloaded++;
      else failed++;
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => worker(),
  );
  await Promise.all(workers);

  console.log(
    `  Downloaded: ${downloaded}, Skipped (existing): ${skipped}, Failed: ${failed}`,
  );
}

function buildImageFilename(category: string, id: string, url: string, variantIndex?: number): string {
  const prefix = sanitizeFilename(category);
  const partId = sanitizeFilename(id);
  // Detect extension from URL (default .webp)
  let ext = '.webp';
  try {
    const pathname = decodeURIComponent(new URL(encodeImageUrl(url)).pathname);
    const urlExt = path.extname(pathname);
    if (urlExt) ext = urlExt.toLowerCase();
  } catch { /* keep .webp default */ }

  if (variantIndex !== undefined) {
    return `${prefix}_${partId}_v${variantIndex}${ext}`;
  }
  return `${prefix}_${partId}${ext}`;
}

async function main() {
  console.log('--- Sync bey-library-complete -> Prisma DB + images ---\n');

  await fs.mkdir(PUBLIC_IMG_DIR, { recursive: true });

  const rawData = await fs.readFile(DATA_FILE, 'utf-8');
  const allParts: BeyLibraryPart[] = JSON.parse(rawData);

  const parts = allParts.filter((p) => p.category !== 'other');
  const skippedCount = allParts.length - parts.length;
  console.log(
    `Found ${allParts.length} total parts, ${parts.length} to import (skipping ${skippedCount} "other")`,
  );

  // === Step 1: Download images ===
  console.log('\n[Step 1] Downloading images...');

  const downloadTasks: { url: string; dest: string }[] = [];

  for (const part of parts) {
    if (part.imageUrl) {
      const filename = buildImageFilename(part.category, part.id, part.imageUrl);
      downloadTasks.push({
        url: part.imageUrl,
        dest: path.join(PUBLIC_IMG_DIR, filename),
      });
    }

    for (let i = 0; i < part.variants.length; i++) {
      const variant = part.variants[i];
      if (variant.imageUrl) {
        const filename = buildImageFilename(part.category, part.id, variant.imageUrl, i + 1);
        downloadTasks.push({
          url: variant.imageUrl,
          dest: path.join(PUBLIC_IMG_DIR, filename),
        });
      }
    }
  }

  console.log(`  ${downloadTasks.length} images to process...`);
  await downloadWithConcurrency(downloadTasks, CONCURRENCY);

  // === Step 2: Upsert in Prisma ===
  console.log('\n[Step 2] Upserting parts in database...');

  // Pre-load all existing parts for name-based matching
  const allExisting = await prisma.part.findMany({
    select: { id: true, externalId: true, name: true, type: true,
      beyType: true, weight: true, imageUrl: true, spinDirection: true,
      height: true, protrusions: true, gearRatio: true, tipType: true },
  });

  // Build lookup maps
  const byExternalId = new Map(allExisting.map((p) => [p.externalId, p]));
  // Name+type map (normalized: lowercase, no spaces)
  const byNameType = new Map<string, typeof allExisting[0]>();
  for (const p of allExisting) {
    const key = `${p.name.toLowerCase().replace(/\s+/g, '')}::${p.type}`;
    // Keep the first match (avoid overwriting with duplicates)
    if (!byNameType.has(key)) byNameType.set(key, p);
  }

  console.log(`  Loaded ${allExisting.length} existing parts for matching`);

  let created = 0;
  let updated = 0;
  let matched = 0;
  let errors = 0;

  for (const part of parts) {
    const partType = CATEGORY_TO_PART_TYPE[part.category];
    if (!partType) {
      console.error(`\n  WARNING: Unknown category "${part.category}" for ${part.id}`);
      errors++;
      continue;
    }

    const beyType = mapBeyType(part.type);
    const system = extractSystem(part.code);
    const stats = getHeuristicStats(beyType);

    // Local image path (relative to public/)
    const imageFilename = part.imageUrl
      ? buildImageFilename(part.category, part.id, part.imageUrl)
      : null;
    const localImageUrl = imageFilename ? `/images/parts/${imageFilename}` : null;

    // Ratchet-specific
    const height = partType === 'RATCHET' ? parseHeight(part.specs) : null;
    const protrusions = partType === 'RATCHET' ? parseContactPoints(part.specs) : null;

    // Bit-specific
    const gearRatio =
      partType === 'BIT' && part.specs?.Gears ? String(part.specs.Gears) : null;
    const tipType =
      partType === 'BIT' && part.specs?.['Burst Resistance']
        ? String(part.specs['Burst Resistance'])
        : null;

    try {
      // 1. Try exact externalId match (for re-runs after migration)
      let existing = byExternalId.get(part.id);

      // 2. Fallback: match by normalized name + type
      if (!existing) {
        const nameKey = `${part.name.toLowerCase().replace(/\s+/g, '')}::${partType}`;
        existing = byNameType.get(nameKey);
        if (existing) matched++;
      }

      if (existing) {
        await prisma.part.update({
          where: { id: existing.id },
          data: {
            externalId: part.id, // Normalize to bey-library ID
            name: part.name,
            type: partType,
            beyType: beyType ?? existing.beyType,
            weight: part.weight ?? existing.weight,
            imageUrl: localImageUrl ?? existing.imageUrl,
            spinDirection: part.spin ?? existing.spinDirection,
            system,
            height: height ?? existing.height,
            protrusions: protrusions ?? existing.protrusions,
            gearRatio: gearRatio ?? existing.gearRatio,
            tipType: tipType ?? existing.tipType,
          },
        });
        updated++;
      } else {
        await prisma.part.create({
          data: {
            externalId: part.id,
            name: part.name,
            type: partType,
            beyType,
            weight: part.weight,
            imageUrl: localImageUrl,
            spinDirection: part.spin,
            system,
            height,
            protrusions,
            gearRatio,
            tipType,
            attack: String(stats.attack),
            defense: String(stats.defense),
            stamina: String(stats.stamina),
            dash: String(stats.dash),
            burst: String(stats.burst),
          },
        });
        created++;
      }

      process.stdout.write('.');
    } catch (err) {
      console.error(
        `\n  ERROR syncing ${part.name} (${part.id}):`,
        (err as Error).message,
      );
      errors++;
    }
  }

  console.log('\n');
  console.log('=== Sync complete! ===');
  console.log(`  Updated: ${updated} (${matched} matched by name)`);
  console.log(`  Created: ${created}`);
  console.log(`  Errors:  ${errors}`);
  console.log(`  Total parts in DB: ${await prisma.part.count()}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
