import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { AppClient } from './_components/AppClient';

export const metadata: Metadata = {
  title: 'BEYBLADE X APP | Assets, Animations & Produits',
  description:
    "Toutes les ressources extraites de l'app Beyblade X : textures, sprites, animations VFX, catalogue produits complet et codes.",
  openGraph: {
    title: 'BEYBLADE X APP | RPB',
    description:
      "Assets, animations et catalogue produits extraits de l'application officielle Beyblade X.",
    images: ['/app-assets/marketing/Marketing.webp'],
  },
};

export const dynamic = 'force-dynamic';

interface ProductEntry {
  code: string;
  name: string;
  date: string;
}

function loadProducts(): ProductEntry[] {
  try {
    const raw = readFileSync(
      path.join(process.cwd(), 'data', 'fandom_products.json'),
      'utf-8',
    );
    return JSON.parse(raw) as ProductEntry[];
  } catch {
    return [];
  }
}

export default async function AppPage() {
  const [blades, ratchets, bits, lockChips, assistBlades] = await Promise.all([
    prisma.part.findMany({
      where: { type: { in: ['BLADE', 'OVER_BLADE'] } },
      orderBy: { name: 'asc' },
    }),
    prisma.part.findMany({
      where: { type: 'RATCHET' },
      orderBy: { name: 'asc' },
    }),
    prisma.part.findMany({
      where: { type: 'BIT' },
      orderBy: { name: 'asc' },
    }),
    prisma.part.findMany({
      where: { type: 'LOCK_CHIP' },
      orderBy: { name: 'asc' },
    }),
    prisma.part.findMany({
      where: { type: 'ASSIST_BLADE' },
      orderBy: { name: 'asc' },
    }),
  ]);

  const products = loadProducts();

  return (
    <AppClient
      blades={blades}
      ratchets={ratchets}
      bits={bits}
      lockChips={lockChips}
      assistBlades={assistBlades}
      products={products}
    />
  );
}
