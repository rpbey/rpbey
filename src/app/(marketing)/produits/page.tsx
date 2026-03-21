import type { Metadata } from 'next';
import { ProductBrowser } from './ProductBrowser';

export const metadata: Metadata = {
  title: 'Produits | Catalogue Beyblade X',
  description:
    'Catalogue complet des produits Beyblade X : Starters, Boosters, Sets et plus. Prix, dates de sortie et contenu.',
  openGraph: {
    title: 'Produits | Catalogue Beyblade X - RPB',
    description:
      'Découvrez tous les produits Beyblade X avec leurs détails et contenu.',
    images: ['/main-banner.webp'],
  },
};

export default function ProductsPage() {
  return <ProductBrowser />;
}
