/**
 * Seed gacha cards — Metal Masters + Metal Fury characters
 * with associated Beyblades and rarity tiers
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'SECRET';

interface CardData {
  slug: string;
  name: string;
  nameJp?: string;
  series: string;
  rarity: Rarity;
  beyblade?: string;
  description: string;
  imageUrl: string;
}

const CARDS: CardData[] = [
  // ══════════════ METAL MASTERS ══════════════

  // LEGENDARY
  { slug: 'gingka-masters', name: 'Gingka Hagane', nameJp: '鋼銀河', series: 'METAL_MASTERS', rarity: 'LEGENDARY',
    beyblade: 'Galaxy Pegasus W105R2F', description: "Leader du Gan Gan Galaxy, représentant du Japon au Championnat du Monde. Son Galaxy Pegasus est l'évolution de Storm Pegasus.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/e/e5/GingaHaganeMetalFusion.jpg/revision/latest/scale-to-width-down/320?cb=20230824175306' },

  { slug: 'ryuga-masters', name: 'Ryuga', nameJp: '竜牙', series: 'METAL_MASTERS', rarity: 'LEGENDARY',
    beyblade: 'Meteo L-Drago LW105LF', description: "Le Dragon Emperor, blader solitaire et rival de Gingka. Son Meteo L-Drago peut absorber la puissance des toupies adverses.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/a/ae/Ryuga_Trans.png/revision/latest/scale-to-width-down/286?cb=20111110014832' },

  // EPIC
  { slug: 'kyoya-masters', name: 'Kyoya Tategami', nameJp: '盾神キョウヤ', series: 'METAL_MASTERS', rarity: 'EPIC',
    beyblade: 'Fang Leone 130W2D', description: "Blader féroce et rival de Gingka. Son Fang Leone est une toupie d'endurance avec une puissance dévastatrice.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/3/3b/Kyoya_Tategami_Trans.png/revision/latest/scale-to-width-down/265?cb=20111103202601' },

  { slug: 'masamune', name: 'Masamune Kadoya', nameJp: '角谷正宗', series: 'METAL_MASTERS', rarity: 'EPIC',
    beyblade: 'Ray Striker D125CS', description: "Membre du Gan Gan Galaxy, blader impulsif qui rêve d'être le numéro 1. Son Ray Striker est rapide et agile.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/c/cd/MasamuneKadoya.png/revision/latest/scale-to-width-down/182?cb=20210318055417' },

  { slug: 'tsubasa', name: 'Tsubasa Otori', nameJp: '大鳥翼', series: 'METAL_MASTERS', rarity: 'EPIC',
    beyblade: 'Earth Eagle 145WD', description: "Agent de la WBBA et membre du Gan Gan Galaxy. Calme et stratégique, son Earth Eagle excelle en endurance.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/d/dc/Tsubasa_Otori_Trans.png/revision/latest/scale-to-width-down/131?cb=20111022015635' },

  { slug: 'julian', name: 'Julian Konzern', series: 'METAL_MASTERS', rarity: 'EPIC',
    beyblade: 'Gravity Destroyer AD145WD', description: "Capitaine de l'équipe européenne Excalibur. Aristocrate et génie, sa Gravity Destroyer est redoutable.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/3/34/Julian_Konzern.png/revision/latest/scale-to-width-down/211?cb=20120905141952' },

  { slug: 'damian', name: 'Damian Heart', series: 'METAL_MASTERS', rarity: 'EPIC',
    beyblade: 'Hades Kerbecs BD145DS', description: "Membre de l'équipe Star Breaker. Blader mystérieux au pouvoir destructeur, entraîné par le Dr. Ziggurat.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/3/3a/Damian_Hart_Trans.png/revision/latest/scale-to-width-down/316?cb=20111019180541' },

  // RARE
  { slug: 'yu-tendo', name: 'Yu Tendo', nameJp: '天童遊', series: 'METAL_MASTERS', rarity: 'RARE',
    beyblade: 'Flame Libra T125ES', description: "Jeune prodige et membre du Gan Gan Galaxy. Malgré son âge, son Flame Libra est un adversaire redoutable.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/1/1e/Yu_Tendo_Trans.png/revision/latest/scale-to-width-down/344?cb=20111103202731' },

  { slug: 'nile', name: 'Nile', series: 'METAL_MASTERS', rarity: 'RARE',
    beyblade: 'Vulcan Horuseus 145D', description: "Blader égyptien, membre de l'équipe Wild Fang. Son Horuseus est inspiré du dieu Horus.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/6/6e/NileAnimeUpdated.png/revision/latest/scale-to-width-down/202?cb=20260222185237' },

  { slug: 'dashan', name: 'Dashan Wang', series: 'METAL_MASTERS', rarity: 'RARE',
    beyblade: 'Rock Zurafa R145WB', description: "Capitaine de l'équipe Wang Hu Zhong (Chine). Maître du Kung-fu Beyblading.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/1/1f/Dashan_Wang.png/revision/latest/scale-to-width-down/261?cb=20120813160945' },

  { slug: 'jack', name: 'Jack', series: 'METAL_MASTERS', rarity: 'RARE',
    beyblade: 'Evil Befall UW145EWD', description: "Artiste excentrique et membre de Star Breaker. Considère le Beyblade comme une forme d'art.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/a/a1/Jack_Trans.png/revision/latest/scale-to-width-down/302?cb=20111021212216' },

  // COMMON
  { slug: 'kenta-masters', name: 'Kenta Yumiya', nameJp: '弓矢ケンタ', series: 'METAL_MASTERS', rarity: 'COMMON',
    beyblade: 'Flame Sagittario C145S', description: "Ami fidèle de Gingka et supporter du Gan Gan Galaxy. Son Flame Sagittario est fiable et endurant.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/6/63/Kenta12-0.jpg/revision/latest/scale-to-width-down/230?cb=20200328085735' },

  { slug: 'benkei-masters', name: 'Benkei Hanawa', series: 'METAL_MASTERS', rarity: 'COMMON',
    beyblade: 'Dark Bull H145SD', description: "Ancien chasseur de têtes devenu allié de Gingka. Sa force brute et son Dark Bull sont impressionnants.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/9/96/Benkei_Hanawa.png/revision/latest/scale-to-width-down/231?cb=20120906181457' },

  { slug: 'madoka', name: 'Madoka Amano', series: 'METAL_MASTERS', rarity: 'COMMON',
    beyblade: undefined, description: "Mécanicienne et analyste du Gan Gan Galaxy. Experte en réparation et analyse des toupies.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/4/49/MadokaOriginal.png/revision/latest/scale-to-width-down/320?cb=20230817053108' },

  { slug: 'hikaru', name: 'Hikaru Hasama', series: 'METAL_MASTERS', rarity: 'COMMON',
    beyblade: 'Storm Aquario 100HF/S', description: "Assistante du directeur Ryo à la WBBA. Ancienne bladeur talentueuse.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/1/13/HikaruUpdated2.png/revision/latest/scale-to-width-down/208?cb=20251203130111' },

  { slug: 'mei-mei', name: 'Mei-Mei', series: 'METAL_MASTERS', rarity: 'COMMON',
    beyblade: 'Aquario 105F', description: "Membre de l'équipe Wang Hu Zhong. Spécialiste du combat acrobatique.",
    imageUrl: '' },

  { slug: 'chiyun', name: 'Chiyun Li', series: 'METAL_MASTERS', rarity: 'COMMON',
    beyblade: 'Thermal Lacerta WA130HF', description: "Membre de Wang Hu Zhong, sage et réfléchi dans ses combats.",
    imageUrl: '' },

  // ══════════════ METAL FURY ══════════════

  // SECRET (ultra rare)
  { slug: 'ryuga-fury', name: 'Ryuga (L-Drago Destructor)', nameJp: '竜牙', series: 'METAL_FURY', rarity: 'SECRET',
    beyblade: 'L-Drago Destructor F:S', description: "Le Dragon Emperor à son apogée. Son L-Drago Destructor est la forme ultime du dragon, capable de détruire n'importe quelle toupie.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/a/ae/Ryuga_Trans.png/revision/latest/scale-to-width-down/286?cb=20111110014832' },

  // LEGENDARY
  { slug: 'gingka-fury', name: 'Gingka Hagane (Cosmic)', nameJp: '鋼銀河', series: 'METAL_FURY', rarity: 'LEGENDARY',
    beyblade: 'Cosmic Pegasus F:D', description: "Gingka avec sa toupie ultime Cosmic Pegasus. Le Blader légendaire choisi par les étoiles pour combattre Nemesis.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/e/e5/GingaHaganeMetalFusion.jpg/revision/latest/scale-to-width-down/320?cb=20230824175306' },

  { slug: 'kyoya-fury', name: 'Kyoya Tategami (Fang Leone)', series: 'METAL_FURY', rarity: 'LEGENDARY',
    beyblade: 'Fang Leone 130W2D', description: "Kyoya, plus puissant que jamais, cherche à prouver que Fang Leone est la toupie la plus forte du monde.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/3/3b/Kyoya_Tategami_Trans.png/revision/latest/scale-to-width-down/265?cb=20111103202601' },

  // EPIC
  { slug: 'chris', name: 'Chris', series: 'METAL_FURY', rarity: 'EPIC',
    beyblade: 'Phantom Orion B:D', description: "Blader mercenaire et Blader légendaire. Son Phantom Orion possède une endurance quasiment infinie.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/3/31/Chris.png/revision/latest/scale-to-width-down/320?cb=20230622135042' },

  { slug: 'aguma', name: 'Aguma', series: 'METAL_FURY', rarity: 'EPIC',
    beyblade: 'Scythe Kronos T125EDS', description: "Blader légendaire du feu, manipulé par Pluto puis allié de Gingka. Son Scythe Kronos contrôle le temps.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/1/1f/Aguma.png/revision/latest/scale-to-width-down/296?cb=20120821131826' },

  { slug: 'dynamis', name: 'Dynamis', series: 'METAL_FURY', rarity: 'EPIC',
    beyblade: 'Jade Jupiter S130RB', description: "Gardien du temple de Jupiter, Blader légendaire. Sage et mystérieux, il protège les secrets des étoiles.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/b/be/Dynamis.png/revision/latest/scale-to-width-down/255?cb=20120821132855' },

  { slug: 'king-fury', name: 'King', series: 'METAL_FURY', rarity: 'EPIC',
    beyblade: 'Variares D:D', description: "Blader légendaire de Mars, combattant passionné. Son Variares peut changer entre modes attaque et endurance.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/0/0a/KingFury.jpg/revision/latest/scale-to-width-down/345?cb=20210222092755' },

  // RARE
  { slug: 'yuki', name: 'Yuki Mizusawa', series: 'METAL_FURY', rarity: 'RARE',
    beyblade: 'Mercury Anubius 85XF', description: "Astronome et Blader légendaire. C'est lui qui découvre la prophétie du Fragment d'Étoile et recrute les légendaires.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/d/d3/Yuki.png/revision/latest/scale-to-width-down/151?cb=20120820194143' },

  { slug: 'tithi', name: 'Tithi', series: 'METAL_FURY', rarity: 'RARE',
    beyblade: 'Death Quetzalcoatl 125RDF', description: "Le plus jeune Blader légendaire. Timide mais puissant, son Quetzalcoatl est inspiré du serpent à plumes.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/b/b9/Tithi.png/revision/latest/scale-to-width-down/252?cb=20120821130954' },

  { slug: 'bao', name: 'Bao', series: 'METAL_FURY', rarity: 'RARE',
    beyblade: 'Hell Crown 130FB', description: "Disciple d'Aguma et membre des Beylin Fist. Loyal et déterminé.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/c/c8/BaoBeyblade.png/revision/latest/scale-to-width-down/400?cb=20180126064257' },

  // COMMON
  { slug: 'johannes', name: 'Johannes', series: 'METAL_FURY', rarity: 'COMMON',
    beyblade: 'Beat Lynx TH170WD', description: "Espion de Pluto, fourbe et rusé. Se transforme en chat pour espionner ses adversaires.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/e/ef/Johannes4D.jpg/revision/latest/scale-to-width-down/278?cb=20230713082331' },

  { slug: 'pluto', name: 'Pluto', series: 'METAL_FURY', rarity: 'COMMON',
    beyblade: 'Firefuse Darkhelm', description: "Antagoniste principal de Metal Fury. Cherche à ressusciter le dieu de la destruction Nemesis.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/f/f7/Pluto4D.jpg/revision/latest/scale-to-width-down/282?cb=20230713081856' },

  { slug: 'hyoma-fury', name: 'Hyoma', series: 'METAL_FURY', rarity: 'COMMON',
    beyblade: 'Rock Aries ED145B', description: "Ami d'enfance de Gingka, originaire du village de Koma. Calme et sage.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/7/76/HyomaUpdated.png/revision/latest/scale-to-width-down/256?cb=20251203130105' },

  { slug: 'doji-fury', name: 'Doji', series: 'METAL_FURY', rarity: 'COMMON',
    beyblade: 'Dark Wolf DF145FS', description: "Ancien leader de la Dark Nebula, revenu sous une forme robotique au service de Pluto.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/8/8d/DojiAnimeUpdated.jpg/revision/latest/scale-to-width-down/248?cb=20230623010712' },
];

async function main() {
  console.log('🃏 Seeding gacha cards...\n');

  for (const card of CARDS) {
    await prisma.gachaCard.upsert({
      where: { slug: card.slug },
      create: card,
      update: {
        name: card.name,
        nameJp: card.nameJp,
        rarity: card.rarity,
        beyblade: card.beyblade,
        description: card.description,
        imageUrl: card.imageUrl,
      },
    });
    const rarityEmoji = { COMMON: '⚪', RARE: '🔵', EPIC: '🟣', LEGENDARY: '🟡', SECRET: '🔴' };
    console.log(`  ${rarityEmoji[card.rarity]} ${card.name} (${card.rarity})`);
  }

  console.log(`\n✅ ${CARDS.length} cards seeded!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
