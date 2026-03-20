import type { Metadata } from 'next';
import {
  getAnimeSeriesByGeneration,
  getFeaturedAnimeSeries,
} from '@/server/actions/anime';
import { AnimeCarousel } from './_components/AnimeCarousel';
import { AnimeLanding } from './_components/AnimeLanding';

export const metadata: Metadata = {
  title: 'Anime Beyblade | RPB',
  description:
    "Regardez toutes les séries anime Beyblade : de l'Original à Beyblade X, en streaming gratuit sur la RPB.",
};

export const dynamic = 'force-dynamic';

export default async function AnimePage() {
  const [featured, seriesByGeneration] = await Promise.all([
    getFeaturedAnimeSeries(),
    getAnimeSeriesByGeneration(),
  ]);

  const generationOrder = ['ORIGINAL', 'METAL', 'BURST', 'X'];

  return (
    <AnimeLanding featured={featured}>
      {generationOrder.map((gen) => {
        const series = seriesByGeneration[gen];
        if (!series || series.length === 0) return null;
        return <AnimeCarousel key={gen} generation={gen} series={series} />;
      })}
    </AnimeLanding>
  );
}
