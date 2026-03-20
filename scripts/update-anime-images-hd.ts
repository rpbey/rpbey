/**
 * Update anime series with HD images from AniList, MAL, Kitsu, Fandom Wiki
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const HD_IMAGES: Record<string, { posterUrl: string; bannerUrl: string }> = {
  // ── Original ──
  'bakuten-shoot-beyblade': {
    posterUrl: 'https://media.kitsu.app/anime/poster_images/263/large.jpg',
    bannerUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/288-vt6IVT62fuk5.jpg',
  },
  'beyblade-v-force': {
    posterUrl: 'https://media.kitsu.app/anime/poster_images/1499/large.jpg',
    bannerUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/1669-ACAcvmtvUkdR.jpg',
  },
  'beyblade-g-revolution': {
    posterUrl: 'https://media.kitsu.app/anime/poster_images/1498/large.jpg',
    bannerUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/1668-ghcz3mGjyZLD.jpg',
  },

  // ── Metal Fight ──
  'metal-fight-beyblade': {
    posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/b5962-MhsmIFdv4J59.png',
    bannerUrl: 'https://static.wikia.nocookie.net/beyblade/images/2/2e/MFB_Promo_Art.jpg/revision/latest?cb=20221110184954',
  },
  'metal-fight-beyblade-baku': {
    posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/b8410-fXa60HqVggen.png',
    bannerUrl: 'https://static.wikia.nocookie.net/beyblade/images/8/87/MFB_Baku_Promo_Art.jpg/revision/latest?cb=20221110185123',
  },
  'metal-fight-beyblade-4d': {
    posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/b10370-n5ExIZxIvp1P.png',
    bannerUrl: 'https://static.wikia.nocookie.net/beyblade/images/c/c6/MFB_4D_Promo_Art.jpg/revision/latest?cb=20221110185236',
  },
  'beyblade-shogun-steel': {
    posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx13231-l2tS23CDbinP.jpg',
    bannerUrl: 'https://cdn.myanimelist.net/images/anime/1134/116707l.jpg',
  },

  // ── Burst ──
  'beyblade-burst': {
    posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21236-8B4fORbuUp6v.jpg',
    bannerUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21236-MOfj4yGKUvQR.jpg',
  },
  'beyblade-burst-god': {
    posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx98289-JS2P2rGuzKNk.jpg',
    bannerUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/98289-FQgyPczbJwez.jpg',
  },
  'beyblade-burst-chouzetsu': {
    posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101115-D0LrlWZtbOeX.png',
    bannerUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101115-4FLEBjhD8FSJ.jpg',
  },
  'beyblade-burst-gt': {
    posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx108853-ebznx715AJ9x.jpg',
    bannerUrl: 'https://cdn.myanimelist.net/images/anime/1318/99806l.jpg',
  },
  'beyblade-burst-superking': {
    posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx116786-ZIUM2E11AK0y.jpg',
    bannerUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/116786-pFUeB9WaAtJs.jpg',
  },
  'beyblade-burst-db': {
    posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx130253-xGqNj5lKnuwN.png',
    bannerUrl: 'https://cdn.myanimelist.net/images/anime/1156/113543l.jpg',
  },

  // ── X ──
  'beyblade-x': {
    posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx165159-aCFC9Sng7t4M.png',
    bannerUrl: 'https://cdn.myanimelist.net/images/anime/1394/145458l.jpg',
  },
};

async function main() {
  console.log('🖼️  Updating anime series with HD images...\n');

  for (const [slug, images] of Object.entries(HD_IMAGES)) {
    // Verify URLs are accessible
    let posterOk = false;
    let bannerOk = false;

    try {
      const pRes = await fetch(images.posterUrl, { method: 'HEAD' });
      posterOk = pRes.ok;
    } catch { /* skip */ }

    try {
      const bRes = await fetch(images.bannerUrl, { method: 'HEAD' });
      bannerOk = bRes.ok;
    } catch { /* skip */ }

    const updateData: Record<string, string> = {};
    if (posterOk) updateData.posterUrl = images.posterUrl;
    if (bannerOk) updateData.bannerUrl = images.bannerUrl;

    if (Object.keys(updateData).length > 0) {
      await prisma.animeSeries.update({
        where: { slug },
        data: updateData,
      });
      const status = [
        posterOk ? '✓ poster' : '✗ poster',
        bannerOk ? '✓ banner' : '✗ banner',
      ].join(', ');
      console.log(`  ${slug}: ${status}`);
    } else {
      console.log(`  ${slug}: ⚠ no valid URLs`);
    }
  }

  console.log('\n✅ Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
