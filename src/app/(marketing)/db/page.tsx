import type { Metadata } from 'next';
import { PartsBrowser } from './PartsBrowser';

export const metadata: Metadata = {
  title: 'BEY DATA | Encyclopédie Beyblade X',
  description:
    'Base de données complète des pièces Beyblade X : Lames, Ratchets, Bits, Stats et Combos.',
  openGraph: {
    title: 'BEY DATA | Encyclopédie RPB',
    description:
      'Explorez toutes les pièces Beyblade X avec leurs statistiques détaillées.',
    images: ['/main-banner.webp'],
  },
};

export default function DatabasePage() {
  return <PartsBrowser />;
}
