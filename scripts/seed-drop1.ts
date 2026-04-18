/**
 * Seed Drop 1 — "Personnages Principaux"
 *
 * Creates the GachaDrop + 32 GachaCards (16 PNG COMMON + 16 ARTIST varied rarities).
 * Uses data from data/drop1-cards.json.
 *
 * Usage: pnpm tsx scripts/seed-drop1.ts
 *        pnpm tsx scripts/seed-drop1.ts --dry-run   (preview only)
 *        pnpm tsx scripts/seed-drop1.ts --reset      (delete existing drop1 cards first)
 */


import { PrismaPg } from '@prisma/adapter-pg';
import type { CardRarity, CardType } from '@/generated/prisma/client';
import { PrismaClient } from '@/generated/prisma/client';
import * as fs from 'fs/promises';
import pg from 'pg';

// Parse DATABASE_URL into explicit pool config (avoids SCRAM password issue)
const url = new URL(process.env.DATABASE_URL!);
const pool = new pg.Pool({
  host: url.hostname,
  port: Number(url.port) || 5432,
  database: url.pathname.slice(1),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DATA_FILE = 'data/drop1-cards.json';
const DROP_SLUG = 'personnages-principaux';
const DRY_RUN = process.argv.includes('--dry-run');
const RESET = process.argv.includes('--reset');

interface CharacterData {
  id: number;
  name: string;
  nameJp: string;
  series: string;
  beyblade: string;
  element: string;
  specialMove: string;
  pngRarity: string;
  artistRarity: string;
  stats: { att: number; def: number; end: number; equilibre: number };
  description: string;
}

interface DropData {
  drop: {
    slug: string;
    name: string;
    theme: string;
    season: number;
    maxCards: number;
  };
  characters: CharacterData[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Slightly reduce stats for PNG (COMMON) versions vs ARTIST
function pngStats(stats: CharacterData['stats']) {
  return {
    att: Math.round(stats.att * 0.65),
    def: Math.round(stats.def * 0.65),
    end: Math.round(stats.end * 0.65),
    equilibre: Math.round(stats.equilibre * 0.7),
  };
}

async function main() {
  console.log(`\n🎴 RPB TCG — Seed Drop 1\n`);

  // Load data
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  const data: DropData = JSON.parse(raw);
  console.log(`📄 Loaded ${data.characters.length} characters from ${DATA_FILE}`);

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN — no database changes will be made\n');
  }

  // Reset if requested
  if (RESET && !DRY_RUN) {
    const existingDrop = await prisma.gachaDrop.findUnique({
      where: { slug: DROP_SLUG },
    });
    if (existingDrop) {
      const deleted = await prisma.gachaCard.deleteMany({
        where: { dropId: existingDrop.id },
      });
      await prisma.gachaDrop.delete({ where: { slug: DROP_SLUG } });
      console.log(
        `🗑️  Reset: deleted ${deleted.count} cards + drop "${DROP_SLUG}"`,
      );
    }
  }

  // Create or find the GachaDrop
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 3);

  let drop: { id: string; slug: string };
  if (DRY_RUN) {
    drop = { id: 'dry-run-id', slug: DROP_SLUG };
    console.log(`\n📦 Would create drop: "${data.drop.name}" (${DROP_SLUG})`);
    console.log(`   Season: ${data.drop.season}`);
    console.log(`   Duration: ${startDate.toLocaleDateString('fr-FR')} → ${endDate.toLocaleDateString('fr-FR')}`);
  } else {
    drop = await prisma.gachaDrop.upsert({
      where: { slug: DROP_SLUG },
      update: {},
      create: {
        slug: DROP_SLUG,
        name: data.drop.name,
        theme: data.drop.theme,
        season: data.drop.season,
        maxCards: data.drop.maxCards,
        startDate,
        endDate,
        isActive: true,
      },
    });
    console.log(`\n📦 Drop created: "${data.drop.name}" (id: ${drop.id})`);
  }

  // Create cards
  let created = 0;
  let skipped = 0;

  for (const char of data.characters) {
    const baseSlug = slugify(char.name);

    // ── PNG version (COMMON) ──
    const pngSlug = `${baseSlug}-png`;
    const pngCard = {
      slug: pngSlug,
      name: char.name,
      nameJp: char.nameJp || null,
      series: char.series,
      rarity: 'COMMON' as CardRarity,
      cardType: 'PNG' as CardType,
      artistName: null,
      imageUrl: null, // To be filled with actual PNG URLs
      beyblade: char.beyblade,
      description: char.description,
      dropRate: 0,
      isActive: true,
      dropId: drop.id,
      ...pngStats(char.stats),
      element: char.element,
      specialMove: char.specialMove,
    };

    // ── ARTIST version (varied rarity) ──
    const artistSlug = `${baseSlug}-artist`;
    const artistCard = {
      slug: artistSlug,
      name: char.name,
      nameJp: char.nameJp || null,
      series: char.series,
      rarity: char.artistRarity as CardRarity,
      cardType: 'ARTIST' as CardType,
      artistName: null, // To be filled when art is received
      imageUrl: null, // To be filled with artist illustration URL
      beyblade: char.beyblade,
      description: char.description,
      dropRate: 0,
      isActive: true,
      dropId: drop.id,
      ...char.stats,
      element: char.element,
      specialMove: char.specialMove,
    };

    if (DRY_RUN) {
      const pStats = pngStats(char.stats);
      console.log(
        `  📄 ${char.name} PNG [COMMON] — ATT:${pStats.att} DEF:${pStats.def} END:${pStats.end} ÉQU:${pStats.equilibre}`,
      );
      console.log(
        `  🎨 ${char.name} ARTIST [${char.artistRarity}] — ATT:${char.stats.att} DEF:${char.stats.def} END:${char.stats.end} ÉQU:${char.stats.equilibre}`,
      );
      created += 2;
    } else {
      // Upsert to avoid duplicates on re-run
      try {
        await prisma.gachaCard.upsert({
          where: { slug: pngSlug },
          update: { dropId: drop.id },
          create: pngCard,
        });
        await prisma.gachaCard.upsert({
          where: { slug: artistSlug },
          update: { dropId: drop.id },
          create: artistCard,
        });
        created += 2;
        console.log(
          `  ✅ ${char.name} — PNG [COMMON] + ARTIST [${char.artistRarity}]`,
        );
      } catch (err) {
        skipped += 2;
        console.log(`  ⚠️  ${char.name} — skipped (${(err as Error).message})`);
      }
    }
  }

  // Summary
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 Résumé Drop 1 :`);
  console.log(`   Cartes créées : ${created}`);
  if (skipped > 0) console.log(`   Cartes ignorées : ${skipped}`);

  // Rarity breakdown
  const rarities: Record<string, number> = {};
  for (const char of data.characters) {
    rarities['COMMON'] = (rarities['COMMON'] || 0) + 1;
    rarities[char.artistRarity] = (rarities[char.artistRarity] || 0) + 1;
  }
  console.log(`\n   Distribution :`);
  for (const [r, n] of Object.entries(rarities).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${r}: ${n} cartes`);
  }

  if (!DRY_RUN) {
    // Verify
    const total = await prisma.gachaCard.count({ where: { dropId: drop.id } });
    console.log(`\n   ✅ Total cartes liées au drop : ${total}/32`);

    // Show what's missing
    const missing = await prisma.gachaCard.count({
      where: { dropId: drop.id, imageUrl: null },
    });
    if (missing > 0) {
      console.log(
        `   ⚠️  ${missing} cartes sans image (à ajouter quand les artistes livrent)`,
      );
    }
  }

  console.log(`\n🎴 Done!\n`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
