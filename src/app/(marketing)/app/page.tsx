import { type Metadata } from 'next';
import { loadJsonSafe } from '@/lib/data-cache';
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

export default async function AppPage() {
  const [blades, ratchets, bits, lockChips, assistBlades, products] =
    await Promise.all([
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
      loadJsonSafe<ProductEntry[]>('data/fandom_products.json').then(
        (p) => p ?? [],
      ),
    ]);

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
