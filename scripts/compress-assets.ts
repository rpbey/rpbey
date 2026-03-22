#!/usr/bin/env tsx
/**
 * Compress all PNG assets to WebP using Sharp.
 * - Textures/Sprites/VFX: WebP quality 80, resize large images to max 1024px
 * - Icons: WebP quality 90, keep original size
 * - Marketing: WebP quality 85
 * - Meshes: skip (OBJ text files)
 * Keeps original PNGs as backup, creates .webp alongside.
 * Then deletes originals to save disk space.
 */

import { readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

interface CompressionConfig {
  dir: string;
  quality: number;
  maxWidth: number;
  maxHeight: number;
}

const configs: CompressionConfig[] = [
  {
    dir: 'public/app-assets/textures',
    quality: 75,
    maxWidth: 1024,
    maxHeight: 1024,
  },
  {
    dir: 'public/app-assets/sprites',
    quality: 80,
    maxWidth: 1024,
    maxHeight: 1024,
  },
  {
    dir: 'public/app-assets/vfx',
    quality: 78,
    maxWidth: 800,
    maxHeight: 800,
  },
  {
    dir: 'public/app-assets/marketing',
    quality: 85,
    maxWidth: 1920,
    maxHeight: 1920,
  },
  {
    dir: 'public/bbx-icons',
    quality: 90,
    maxWidth: 512,
    maxHeight: 512,
  },
];

async function compressDir(config: CompressionConfig) {
  const fullDir = path.join(process.cwd(), config.dir);
  let files: string[];
  try {
    files = await readdir(fullDir);
  } catch {
    console.log(`  [SKIP] ${config.dir} not found`);
    return { converted: 0, savedBytes: 0 };
  }

  const pngs = files.filter((f) => /\.png$/i.test(f));
  let converted = 0;
  let savedBytes = 0;

  for (const png of pngs) {
    const inputPath = path.join(fullDir, png);
    const outputPath = path.join(fullDir, png.replace(/\.png$/i, '.webp'));

    try {
      const inputStat = await stat(inputPath);
      const inputSize = inputStat.size;

      await sharp(inputPath)
        .resize(config.maxWidth, config.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: config.quality, effort: 4 })
        .toFile(outputPath);

      const outputStat = await stat(outputPath);
      const outputSize = outputStat.size;

      // Delete original PNG
      await unlink(inputPath);

      savedBytes += inputSize - outputSize;
      converted++;
    } catch {
      // Skip files that fail (corrupted, etc.)
    }
  }

  return { converted, savedBytes };
}

async function main() {
  console.log('Compressing assets with Sharp...\n');

  let totalConverted = 0;
  let totalSaved = 0;

  for (const config of configs) {
    const startTime = Date.now();
    console.log(`Processing ${config.dir}...`);
    const { converted, savedBytes } = await compressDir(config);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const savedMB = (savedBytes / 1024 / 1024).toFixed(1);
    console.log(
      `  ${converted} files → WebP (saved ${savedMB} MB) in ${duration}s`,
    );
    totalConverted += converted;
    totalSaved += savedBytes;
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Total: ${totalConverted} files compressed`);
  console.log(`Total saved: ${(totalSaved / 1024 / 1024).toFixed(1)} MB`);
}

main().catch(console.error);
