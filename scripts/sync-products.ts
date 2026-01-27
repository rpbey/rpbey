
import * as dotenv from 'dotenv';
dotenv.config();

import { ProductType, ProductLine } from '@prisma/client';
import * as fs from 'fs/promises';
import { prisma } from '../src/lib/prisma'; // Use existing client

const DATA_FILE = 'data/fandom_products.json';

interface FandomProduct {
  code: string;
  name: string;
  date: string;
  img?: string;
}

function parseDate(dateStr: string): Date | null {
  // "July 15th, 2023" -> Date
  const cleanDate = dateStr.replace(/(st|nd|rd|th)/, '');
  const date = new Date(cleanDate);
  return isNaN(date.getTime()) ? null : date;
}

function determineType(name: string): ProductType {
  const n = name.toUpperCase();
  if (n.includes('RANDOM BOOSTER')) return 'RANDOM_BOOSTER';
  if (n.includes('DOUBLE STARTER')) return 'DOUBLE_STARTER'; // Before Starter to catch doubles
  if (n.includes('STARTER')) return 'STARTER';
  if (n.includes('BOOSTER')) return 'BOOSTER';
  if (n.includes('SET')) return 'SET';
  if (n.includes('TOOL') || n.includes('LAUNCHER')) return 'TOOL';
  if (n.includes('DECK')) return 'SET'; // Deck sets
  return 'BOOSTER'; // Default
}

function determineLine(code: string): ProductLine {
  if (code.startsWith('UX')) return 'UX';
  if (code.startsWith('CX')) return 'CX';
  return 'BX';
}

async function main() {
  const rawData = await fs.readFile(DATA_FILE, 'utf-8');
  const products: FandomProduct[] = JSON.parse(rawData);

  console.log(`Syncing ${products.length} products...`);

  for (const p of products) {
    const type = determineType(p.name);
    const line = determineLine(p.code);
    const releaseDate = parseDate(p.date);

    try {
        await prisma.product.upsert({
            where: { code: p.code },
            update: {
                name: p.name,
                productType: type,
                productLine: line,
                releaseDate: releaseDate,
                imageUrl: p.img,
            },
            create: {
                code: p.code,
                name: p.name,
                productType: type,
                productLine: line,
                releaseDate: releaseDate,
                imageUrl: p.img,
            }
        });
        process.stdout.write('.');
    } catch (e) {
        console.error(`\nError syncing ${p.code}:`, e);
    }
  }
  console.log('\nDone!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
