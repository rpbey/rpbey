import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SERIES = [
  {
    slug: 'bakuten-shoot-beyblade',
    title: 'Bakuten Shoot Beyblade',
    titleFr: 'Beyblade',
    titleJp: '爆転シュート ベイブレード',
    generation: 'ORIGINAL' as const,
    synopsis:
      "Tyson Granger découvre le monde du Beyblade et forme les Bladebreakers pour remporter le championnat mondial.",
    year: 2001,
    episodeCount: 51,
    sortOrder: 1,
  },
  {
    slug: 'beyblade-v-force',
    title: 'Beyblade V-Force',
    titleFr: 'Beyblade V-Force',
    titleJp: '爆転シュート ベイブレード2002',
    generation: 'ORIGINAL' as const,
    synopsis:
      "Les Bladebreakers font face à de nouveaux adversaires et découvrent les puissants Bit-Beasts sacrés.",
    year: 2002,
    episodeCount: 51,
    sortOrder: 2,
  },
  {
    slug: 'beyblade-g-revolution',
    title: 'Beyblade G-Revolution',
    titleFr: 'Beyblade G-Revolution',
    titleJp: '爆転シュート ベイブレード Gレボリューション',
    generation: 'ORIGINAL' as const,
    synopsis:
      "Les Bladebreakers se séparent et s'affrontent dans un nouveau championnat mondial de Beyblade.",
    year: 2003,
    episodeCount: 52,
    sortOrder: 3,
  },
  {
    slug: 'metal-fight-beyblade',
    title: 'Metal Fight Beyblade',
    titleFr: 'Beyblade Metal Fusion',
    titleJp: 'メタルファイト ベイブレード',
    generation: 'METAL' as const,
    synopsis:
      "Gingka Hagane se lance dans une quête pour arrêter la Dark Nebula et protéger le monde du Beyblade.",
    year: 2009,
    episodeCount: 51,
    sortOrder: 4,
  },
  {
    slug: 'metal-fight-beyblade-baku',
    title: 'Metal Fight Beyblade: Baku',
    titleFr: 'Beyblade Metal Masters',
    titleJp: 'メタルファイト ベイブレード 爆',
    generation: 'METAL' as const,
    synopsis:
      "Gingka et ses amis représentent le Japon dans le championnat mondial de Beyblade.",
    year: 2010,
    episodeCount: 51,
    sortOrder: 5,
  },
  {
    slug: 'metal-fight-beyblade-4d',
    title: 'Metal Fight Beyblade 4D',
    titleFr: 'Beyblade Metal Fury',
    titleJp: 'メタルファイト ベイブレード 4D',
    generation: 'METAL' as const,
    synopsis:
      "Les Bladers légendaires s'unissent pour combattre Nemesis et sauver le monde de la destruction.",
    year: 2011,
    episodeCount: 39,
    sortOrder: 6,
  },
  {
    slug: 'beyblade-shogun-steel',
    title: 'Beyblade: Shogun Steel',
    titleFr: 'Beyblade: Shogun Steel',
    titleJp: 'メタルファイト ベイブレード ZERO G',
    generation: 'METAL' as const,
    synopsis:
      "Une nouvelle génération de bladers découvre le système Zero-G et de nouveaux stadiums révolutionnaires.",
    year: 2012,
    episodeCount: 38,
    sortOrder: 7,
  },
  {
    slug: 'beyblade-burst',
    title: 'Beyblade Burst',
    titleFr: 'Beyblade Burst',
    titleJp: 'ベイブレードバースト',
    generation: 'BURST' as const,
    synopsis:
      "Valt Aoi rêve de devenir le meilleur blader avec sa toupie Valtryek dans le système Burst.",
    year: 2016,
    episodeCount: 51,
    sortOrder: 8,
  },
  {
    slug: 'beyblade-burst-god',
    title: 'Beyblade Burst God',
    titleFr: 'Beyblade Burst Evolution',
    titleJp: 'ベイブレードバースト ゴッド',
    generation: 'BURST' as const,
    synopsis:
      "Valt rejoint la ligue espagnole BC Sol et affronte des bladers du monde entier dans le World League.",
    year: 2017,
    episodeCount: 51,
    sortOrder: 9,
  },
  {
    slug: 'beyblade-burst-chouzetsu',
    title: 'Beyblade Burst Chouzetsu',
    titleFr: 'Beyblade Burst Turbo',
    titleJp: 'ベイブレードバースト 超ゼツ',
    generation: 'BURST' as const,
    synopsis:
      "Aiga Akaba découvre le Beyblade et cherche à surpasser Valt avec sa toupie Z Achilles.",
    year: 2018,
    episodeCount: 51,
    sortOrder: 10,
  },
  {
    slug: 'beyblade-burst-gt',
    title: 'Beyblade Burst GT',
    titleFr: 'Beyblade Burst Rise',
    titleJp: 'ベイブレードバースト ガチ',
    generation: 'BURST' as const,
    synopsis:
      "Le système GT introduit les chips et les drivers interchangeables dans un nouveau tournoi mondial.",
    year: 2019,
    episodeCount: 52,
    sortOrder: 11,
  },
  {
    slug: 'beyblade-burst-superking',
    title: 'Beyblade Burst Superking',
    titleFr: 'Beyblade Burst Surge',
    titleJp: 'ベイブレードバースト スパーキング',
    generation: 'BURST' as const,
    synopsis:
      "Hyuga et Hikaru Asahi découvrent les toupies Superking Sparking et affrontent des légendes.",
    year: 2020,
    episodeCount: 54,
    sortOrder: 12,
  },
  {
    slug: 'beyblade-burst-db',
    title: 'Beyblade Burst Dynamite Battle',
    titleFr: 'Beyblade Burst QuadDrive',
    titleJp: 'ベイブレードバースト ダイナマイトバトル',
    generation: 'BURST' as const,
    synopsis:
      "Le système Dynamite Battle permet des combinaisons révolutionnaires dans les combats de Beyblade.",
    year: 2021,
    episodeCount: 52,
    sortOrder: 13,
  },
  {
    slug: 'beyblade-burst-quadstrike',
    title: 'Beyblade Burst QuadStrike',
    titleFr: 'Beyblade Burst QuadStrike',
    titleJp: 'ベイブレードバースト クアッドストライク',
    generation: 'BURST' as const,
    synopsis:
      "La septième et dernière saison de Beyblade Burst. De nouveaux bladers apparaissent avec le système QuadDrive, permettant de basculer entre quatre modes de combat.",
    year: 2023,
    episodeCount: 26,
    sortOrder: 14,
  },
  {
    slug: 'beyblade-x',
    title: 'Beyblade X',
    titleFr: 'Beyblade X',
    titleJp: 'BEYBLADE X',
    generation: 'X' as const,
    synopsis:
      "Multi Nanairo entre dans le monde du Beyblade X avec le système Xtreme et le Xtreme Stadium.",
    year: 2023,
    episodeCount: 52,
    sortOrder: 15,
  },
];

async function main() {
  console.log('Seeding anime series...');

  for (const series of SERIES) {
    const result = await prisma.animeSeries.upsert({
      where: { slug: series.slug },
      create: series,
      update: {
        title: series.title,
        titleFr: series.titleFr,
        titleJp: series.titleJp,
        generation: series.generation,
        synopsis: series.synopsis,
        year: series.year,
        episodeCount: series.episodeCount,
        sortOrder: series.sortOrder,
      },
    });
    console.log(`  ✓ ${result.titleFr || result.title} (${result.year})`);
  }

  console.log(`\nDone! ${SERIES.length} series seeded.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
