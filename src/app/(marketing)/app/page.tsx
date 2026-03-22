import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { AppClient } from './_components/AppClient';

export const metadata: Metadata = {
  title: 'BEYBLADE X APP | Ressources & Explorateur 3D',
  description:
    'Explorez toutes les pièces Beyblade X : modèles 3D, textures, sprites et statistiques complètes. Ressources officielles du jeu.',
  openGraph: {
    title: 'BEYBLADE X APP | RPB',
    description:
      'Hub de ressources Beyblade X — explorateur de pièces avec modèles 3D, textures haute résolution et statistiques.',
    images: ['/app-assets/marketing/Marketing.png'],
  },
};

export const dynamic = 'force-dynamic';

export default async function AppPage() {
  const [blades, ratchets, bits, totalParts] = await Promise.all([
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
    prisma.part.count(),
  ]);

  return (
    <AppClient
      blades={blades}
      ratchets={ratchets}
      bits={bits}
      totalParts={totalParts}
    />
  );
}
