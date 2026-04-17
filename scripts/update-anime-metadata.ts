/**
 * Update anime series metadata: posters, banners, episode counts
 * Uses ibb.co images from streaming-espace.fr + high-quality posters
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Poster & banner URLs (sourced from public anime databases / ibb.co)
const SERIES_MEDIA: Record<string, { posterUrl: string; bannerUrl: string }> = {
  // Original
  'bakuten-shoot-beyblade': {
    posterUrl: 'https://i.ibb.co/KskZBb6/3-UOE3xx-U-1.webp',
    bannerUrl: 'https://i.ibb.co/KskZBb6/3-UOE3xx-U-1.webp',
  },
  'beyblade-v-force': {
    posterUrl: 'https://i.ibb.co/hdtYq9q/4-adzovce.webp',
    bannerUrl: 'https://i.ibb.co/hdtYq9q/4-adzovce.webp',
  },
  'beyblade-g-revolution': {
    posterUrl: 'https://i.ibb.co/jRv1Z4s/5-6aa4-OSI.webp',
    bannerUrl: 'https://i.ibb.co/jRv1Z4s/5-6aa4-OSI.webp',
  },
  // Metal Fight
  'metal-fight-beyblade': {
    posterUrl: 'https://i.ibb.co/THdHrp7/12-quvnwfn.webp',
    bannerUrl: 'https://i.ibb.co/THdHrp7/12-quvnwfn.webp',
  },
  'metal-fight-beyblade-baku': {
    posterUrl: 'https://i.ibb.co/rk5HMwm/13-aneaxh0.webp',
    bannerUrl: 'https://i.ibb.co/rk5HMwm/13-aneaxh0.webp',
  },
  'metal-fight-beyblade-4d': {
    posterUrl: 'https://i.ibb.co/KycT9RY/Any-Conv-com-14-n-Reo-JSj.webp',
    bannerUrl: 'https://i.ibb.co/KycT9RY/Any-Conv-com-14-n-Reo-JSj.webp',
  },
  'beyblade-shogun-steel': {
    posterUrl: 'https://i.ibb.co/kyBBMKr/Any-Conv-com-15-Y6z-Gii-W.webp',
    bannerUrl: 'https://i.ibb.co/kyBBMKr/Any-Conv-com-15-Y6z-Gii-W.webp',
  },
  // Burst
  'beyblade-burst': {
    posterUrl: 'https://i.ibb.co/QjkkM0c/6-2grrkvl.webp',
    bannerUrl: 'https://i.ibb.co/QjkkM0c/6-2grrkvl.webp',
  },
  'beyblade-burst-god': {
    posterUrl: 'https://i.ibb.co/3rr7CVc/7-40ozbd7.webp',
    bannerUrl: 'https://i.ibb.co/3rr7CVc/7-40ozbd7.webp',
  },
  'beyblade-burst-chouzetsu': {
    posterUrl: 'https://i.ibb.co/N1GLHqC/8-x1bzcns.webp',
    bannerUrl: 'https://i.ibb.co/N1GLHqC/8-x1bzcns.webp',
  },
  'beyblade-burst-gt': {
    posterUrl: 'https://i.ibb.co/qmKFJ6T/9-spy6lii.webp',
    bannerUrl: 'https://i.ibb.co/qmKFJ6T/9-spy6lii.webp',
  },
  'beyblade-burst-superking': {
    posterUrl: 'https://i.ibb.co/Bn9S5Jm/10-l77eeqb.webp',
    bannerUrl: 'https://i.ibb.co/Bn9S5Jm/10-l77eeqb.webp',
  },
  'beyblade-burst-db': {
    posterUrl: 'https://i.ibb.co/x1sJQfj/11-2yec7gu.webp',
    bannerUrl: 'https://i.ibb.co/x1sJQfj/11-2yec7gu.webp',
  },
  // X
  'beyblade-x': {
    posterUrl: 'https://i.ibb.co/mbC48fn/beyximg.webp',
    bannerUrl: 'https://i.ibb.co/DbF9Jqt/Cover-X-s2.webp',
  },
};

async function main() {
  console.log('📸 Updating anime series metadata...\n');

  // 1. Update posters, banners
  for (const [slug, media] of Object.entries(SERIES_MEDIA)) {
    await prisma.animeSeries.update({
      where: { slug },
      data: {
        posterUrl: media.posterUrl,
        bannerUrl: media.bannerUrl,
      },
    });
    console.log(`  ✓ ${slug} — poster + banner`);
  }

  // 2. Sync episodeCount with actual episode count
  console.log('\n📊 Syncing episode counts...');
  const series = await prisma.animeSeries.findMany({
    include: { _count: { select: { episodes: true } } },
  });

  for (const s of series) {
    if (s.episodeCount !== s._count.episodes) {
      await prisma.animeSeries.update({
        where: { id: s.id },
        data: { episodeCount: s._count.episodes },
      });
      console.log(`  ✓ ${s.slug}: ${s.episodeCount} → ${s._count.episodes}`);
    }
  }

  // 3. Set default episode duration (24 min = 1440s) for episodes without duration
  const updated = await prisma.animeEpisode.updateMany({
    where: { duration: 0 },
    data: { duration: 1440 },
  });
  console.log(`\n⏱ Set default duration (24min) for ${updated.count} episodes`);

  // 4. Summary
  const totalSeries = await prisma.animeSeries.count();
  const totalEps = await prisma.animeEpisode.count();
  const totalSources = await prisma.animeEpisodeSource.count();
  const withPoster = await prisma.animeSeries.count({ where: { posterUrl: { not: null } } });

  console.log(`\n✅ Done!`);
  console.log(`   ${totalSeries} séries (${withPoster} avec poster)`);
  console.log(`   ${totalEps} épisodes`);
  console.log(`   ${totalSources} sources vidéo`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
