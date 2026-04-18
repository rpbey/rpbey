/**
 * Seed QuadStrike episodes + update missing French titles + poster/banner
 * Run: pnpm tsx scripts/seed-quadstrike-and-titles.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── QuadStrike episodes ──
const QUADSTRIKE_EPISODES = [
  { number: 1, title: 'Thunder and Lightning! Elemental Power!' },
  { number: 2, title: 'The Rebirth! Divine Belfyre!' },
  { number: 3, title: 'Rise Up! Gambit Dragon Soars!' },
  { number: 4, title: 'Depths Below! Abyssal Tournament!' },
  { number: 5, title: 'Dragon vs. Pandora! Rising Tides!' },
  { number: 6, title: 'Howls of Terror! Kerbeus Returns!' },
  { number: 7, title: 'Theater of the Dark Prince! Monstrous Missions!' },
  { number: 8, title: 'Peerless! Xiphoid Xcalius!' },
  { number: 9, title: 'Striking Flames! Ferocious Battle!' },
  { number: 10, title: 'Dark Devotion! Mighty Sword!' },
  { number: 11, title: 'Surge Ahead! Battle Camp Clash!' },
  { number: 12, title: 'Hurricane Winds! Twister Pandora!' },
  { number: 13, title: 'Tag-Team! Break the Limit!' },
  { number: 14, title: 'Turbo Time! Zeal Achilles!' },
  { number: 15, title: 'Chivalry Unbound! Whirl Knight!' },
  { number: 16, title: 'Wild Dash! Battle Marathon!' },
  { number: 17, title: 'Blazing Battles! Aether Stadium!' },
  { number: 18, title: 'Darkness Unleashed! Winds of Change!' },
  { number: 19, title: "Champion's Challenge! Radiant Finals!" },
  { number: 20, title: 'Invincible Shadows! Aiger vs. Bel!' },
  { number: 21, title: 'Dire Destiny! Ruin Pandemonium!' },
  { number: 22, title: 'Shining Stars! Lodestar Battle Tournament!' },
  { number: 23, title: "Vroom-Vroom Revolution! A Hero's Journey!" },
  { number: 24, title: 'Achilles vs. Pandemonium! Clashes of Light!' },
  { number: 25, title: 'Resonance vs. Elemental!' },
  { number: 26, title: 'Elemental Battle! Ultimate Showdown!' },
];

// ── Burst Superking/Surge French titles ──
const SURGE_FR: Record<number, string> = {
  1: 'La révolution du Beyblade !',
  2: 'Accrochez-vous ! Propulsion Foudre !',
  3: 'La persévérance : une Frappe Colossale !',
  4: 'Écoute la voix de ta toupie !',
  5: 'Mirage Fafnir, le dragon illusoire !',
  6: 'Combats en duo et équipes de rêves !',
  7: "À la conquête du donjon de l'ogre !",
  8: "Vex Lucius, le soleil d'un noir de jais !",
  9: 'Est-ce un rêve ? Ou un cauchemar ?',
  10: 'Triumph Dragon, en route vers la victoire !',
  11: 'Le Festival des Légendes : la grande révolution !',
  12: 'Hyuga et Lain contre Hikaru et Aiger !',
  13: 'Le héros des combats en duo !',
  14: 'Tout pour la victoire !',
  15: 'Comment vaincre Valt ?',
  16: 'La grande finale ! Valt contre Lain !',
  17: 'World Spryzen ! Une volonté de feu !',
  18: 'La contre-attaque de Lucius Endbringer !',
  19: 'Combats en duo : des équipes formidables !',
  20: 'Un combat enragé pour vaincre la tempête !',
  21: "L'explosion du combat des légendes !",
  22: 'Un tir ami ?! Rupture de Limite Finale !',
  23: 'Combat acharné et bravoure sans merci !',
  24: "Y arriver ou non, telle est la question !",
  25: 'Confiance, insouciance et couardise !',
  26: "Révolution ! L'ultime affrontement",
};

// ── Burst Dynamite Battle/QuadDrive French titles (partial) ──
const QUADDRIVE_FR: Record<number, string> = {
  1: 'Le Prince des Ténèbres et Destruction Belfyre !',
  2: 'Le Passage Fantôme : le Cimetière des Toupies !',
  3: 'Changement de mode ! De bas en haut !',
  4: "Le théâtre de l'abysse : Bel contre Valt !",
  5: "Jusqu'au ciel, pour dominer le monde !",
  6: "L'autre Valtryek !",
  7: 'Retournement de situation ! Belfyre contre Fafnir !',
  8: 'Roar Balkesh, le rugissement du dragon !',
  9: 'On décolle ! Le grand voyage aérien !',
  10: 'Collision frontale ! Bel contre Rashad !',
  11: 'Le Prince des Ténèbres frappe encore ! Bel contre Free !',
  12: 'Prince des Ténèbres un jour, serviteur le lendemain !',
  13: 'Guilty Luinor, le chevalier des dragons !',
  14: 'Le Grand Voyage Aérien revient sur terre !',
  15: 'Devastate Belfyre, le retour du Prince des Ténèbres !',
};

async function main() {
  console.log('🎬 Seeding QuadStrike episodes + French titles...\n');

  // 1. Update QuadStrike poster
  const qs = await prisma.animeSeries.findUnique({ where: { slug: 'beyblade-burst-quadstrike' } });
  if (qs) {
    await prisma.animeSeries.update({
      where: { slug: 'beyblade-burst-quadstrike' },
      data: {
        posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/b166062-TMMGelSGcWJu.jpg',
        bannerUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/b166062-TMMGelSGcWJu.jpg',
      },
    });
    console.log('✅ QuadStrike poster/banner mis à jour');

    // 2. Seed QuadStrike episodes
    let added = 0;
    for (const ep of QUADSTRIKE_EPISODES) {
      await prisma.animeEpisode.upsert({
        where: { seriesId_number: { seriesId: qs.id, number: ep.number } },
        create: {
          seriesId: qs.id,
          number: ep.number,
          title: ep.title,
          duration: 0,
          isPublished: true,
        },
        update: { title: ep.title },
      });
      added++;
    }
    console.log(`✅ ${added} épisodes QuadStrike ajoutés\n`);
  } else {
    console.log('❌ Série QuadStrike non trouvée\n');
  }

  // 3. Update Burst Superking FR titles
  const superking = await prisma.animeSeries.findUnique({ where: { slug: 'beyblade-burst-superking' } });
  if (superking) {
    let updated = 0;
    for (const [num, titleFr] of Object.entries(SURGE_FR)) {
      const ep = await prisma.animeEpisode.findUnique({
        where: { seriesId_number: { seriesId: superking.id, number: Number(num) } },
      });
      if (ep) {
        await prisma.animeEpisode.update({
          where: { id: ep.id },
          data: { titleFr },
        });
        updated++;
      }
    }
    console.log(`✅ ${updated} titres FR mis à jour pour Burst Superking`);
  }

  // 4. Update Burst Dynamite Battle FR titles
  const db = await prisma.animeSeries.findUnique({ where: { slug: 'beyblade-burst-db' } });
  if (db) {
    let updated = 0;
    for (const [num, titleFr] of Object.entries(QUADDRIVE_FR)) {
      const ep = await prisma.animeEpisode.findUnique({
        where: { seriesId_number: { seriesId: db.id, number: Number(num) } },
      });
      if (ep) {
        await prisma.animeEpisode.update({
          where: { id: ep.id },
          data: { titleFr },
        });
        updated++;
      }
    }
    console.log(`✅ ${updated} titres FR mis à jour pour Burst Dynamite Battle`);
  }

  // 5. Summary
  console.log('\n📊 Résumé :');
  const allSeries = await prisma.animeSeries.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { episodes: true } },
      episodes: { select: { titleFr: true } },
    },
  });
  for (const s of allSeries) {
    const frCount = s.episodes.filter((e) => e.titleFr).length;
    const status = s._count.episodes === s.episodeCount ? '✅' : '❌';
    console.log(
      `  ${status} ${s.title.padEnd(40)} eps: ${s._count.episodes}/${s.episodeCount}  FR: ${frCount}/${s._count.episodes}`,
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
