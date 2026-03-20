import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type R = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'SECRET';
interface Card { slug: string; name: string; nameJp?: string; series: string; rarity: R; beyblade?: string; description: string; imageUrl: string; }

const CARDS: Card[] = [
  // ── BAKUTEN SHOOT BEYBLADE (Original) ──
  { slug: 'tyson', name: 'Tyson Granger', nameJp: '木ノ宮タカオ', series: 'BAKUTEN', rarity: 'LEGENDARY',
    beyblade: 'Dragoon Storm', description: "Le champion du monde de Beyblade ! Tyson est le blader le plus passionné et déterminé. Son Dragoon est le dragon légendaire qui domine les championnats mondiaux. Jamais il n'abandonne un combat.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/6/66/HD-wallpaper-beyblade-dragoon-metal-storm-beyblade-tyson-granger.jpg/revision/latest/scale-to-width-down/600?cb=20230918015839' },

  { slug: 'kai', name: 'Kai Hiwatari', nameJp: '火渡カイ', series: 'BAKUTEN', rarity: 'LEGENDARY',
    beyblade: 'Dranzer Flame', description: "Le rival ultime de Tyson, froid et calculateur. Kai est l'héritier de l'Abbaye et manie le phénix Dranzer avec une puissance et une élégance incomparables. Le blader le plus respecté au monde.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/0/05/KaiHiwatari%282000%29.jpg/revision/latest/scale-to-width-down/600?cb=20230806103400' },

  { slug: 'ray', name: 'Ray Kon', nameJp: 'レイ・コン', series: 'BAKUTEN', rarity: 'EPIC',
    beyblade: 'Driger Fang', description: "Le tigre blanc du village de Neko-Jin. Ray allie agilité et sagesse avec son Driger, le tigre sacré. Ancien membre des White Tigers devenu pilier des Bladebreakers.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/3/31/RAY_KON_2000_PROMO.png/revision/latest/scale-to-width-down/600?cb=20240301060747' },

  { slug: 'max', name: 'Max Tate', nameJp: 'マックス・ミズハラ', series: 'BAKUTEN', rarity: 'EPIC',
    beyblade: 'Draciel Fortress', description: "L'optimiste incurable des Bladebreakers ! Max est le maître de la défense avec son Draciel, la tortue indestructible. Sa mère dirige le laboratoire de recherche BBA.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/1/10/MaxSeason1.jpg/revision/latest/scale-to-width-down/600?cb=20230816174855' },

  { slug: 'brooklyn', name: 'Brooklyn', series: 'BAKUTEN', rarity: 'SECRET',
    beyblade: 'Zeus', description: "Le prodige naturel absolu. Brooklyn n'a jamais perdu avant d'affronter Tyson. Son Zeus contrôle les forces de la nature — vent, foudre, terre. Le blader le plus talentueux de toute l'histoire.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/1/1d/Brooklyn.png/revision/latest/scale-to-width-down/600?cb=20120728234414' },

  { slug: 'tala', name: 'Tala Valkov', nameJp: 'ユーリ・イヴァーノフ', series: 'BAKUTEN', rarity: 'EPIC',
    beyblade: 'Wolborg', description: "Le capitaine des Demolition Boys et produit de l'Abbaye de Boris. Tala est un combattant cybernétique dont le Wolborg gèle tout sur son passage avec une puissance glaciale terrifiante.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/b/b3/TalaVForceRender.jpg/revision/latest/scale-to-width-down/600?cb=20240629003437' },

  { slug: 'ozuma', name: 'Ozuma', nameJp: 'オズマ', series: 'BAKUTEN', rarity: 'RARE',
    beyblade: 'Flash Leopard', description: "Le leader des Saint Shields, gardien des Bit-Beasts sacrés. Ozuma cherche à sceller les esprits sacrés pour protéger le monde de leur pouvoir destructeur.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/9/91/OzumaRender.jpeg/revision/latest/scale-to-width-down/600?cb=20240530190458' },

  { slug: 'daichi', name: 'Daichi Sumeragi', nameJp: '皇大地', series: 'BAKUTEN', rarity: 'RARE',
    beyblade: 'Strata Dragoon', description: "Le petit sauvage de la montagne ! Daichi est un blader impétueux qui défie Tyson sans cesse. Son Strata Dragoon contrôle la terre et les rochers.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/9/98/Strata_Dragoon_Bit-Beast.png/revision/latest/scale-to-width-down/600?cb=20161124231457' },

  { slug: 'robert', name: 'Robert Jürgens', series: 'BAKUTEN', rarity: 'RARE',
    beyblade: 'Griffolyon', description: "Le noble aristocrate allemand et capitaine des Majestics. Robert combat avec honneur et dignité, son Griffolyon est un griffon majestueux.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/c/cd/Robert_Season_1.png/revision/latest/scale-to-width-down/600?cb=20230713091017' },

  { slug: 'kenny-bakuten', name: 'Kenny', nameJp: 'キョウジュ', series: 'BAKUTEN', rarity: 'COMMON',
    beyblade: 'Hopper', description: "Le génie technique des Bladebreakers ! Kenny analyse chaque combat avec son ordinateur portable Dizzi. Sans lui, l'équipe ne pourrait pas optimiser ses toupies.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/b/be/KennyOriginal.jpeg/revision/latest/scale-to-width-down/600?cb=20230817054020' },

  { slug: 'hilary', name: 'Hilary Tachibana', nameJp: 'タチバナヒロミ', series: 'BAKUTEN', rarity: 'COMMON',
    beyblade: undefined, description: "La manager passionnée des Bladebreakers ! Hilary ne combat pas mais son soutien moral et sa détermination sont essentiels à l'équipe. Elle ne lâche jamais ses amis.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/2/21/HilaryTachibanaVF.jpg/revision/latest/scale-to-width-down/600?cb=20230806113048' },

  { slug: 'mariam', name: 'Mariam', series: 'BAKUTEN', rarity: 'COMMON',
    beyblade: 'Sharkrash', description: "Membre des Saint Shields et sœur de Joseph. Mariam est une combattante féroce dont le Sharkrash attaque avec la puissance d'un requin.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/a/a6/MariamUpdated.jpg/revision/latest/scale-to-width-down/600?cb=20240824163543' },

  { slug: 'lee-bakuten', name: 'Lee Wong', nameJp: 'ライ・チェン', series: 'BAKUTEN', rarity: 'COMMON',
    beyblade: 'Galeon', description: "Le capitaine des White Tigers et rival d'enfance de Ray. Lee est un combattant honorable dont le Galeon, le lion noir, est redoutable.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/6/6a/Lee_Wong.png/revision/latest/scale-to-width-down/600?cb=20230713081754' },

  { slug: 'michael', name: 'Michael Parker', series: 'BAKUTEN', rarity: 'COMMON',
    beyblade: 'Trygle', description: "Le capitaine des All Starz américains et joueur de baseball. Michael combine sport et Beyblade avec son Trygle, l'aigle patriotique.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/2/21/Michael-model-sheet-cropped.png/revision/latest/scale-to-width-down/600?cb=20240316094754' },

  { slug: 'johnny', name: 'Johnny McGregor', series: 'BAKUTEN', rarity: 'COMMON',
    beyblade: 'Salamalyon', description: "Le fougueux écossais des Majestics. Johnny est arrogant mais talentueux, son Salamalyon crache le feu avec la puissance d'une salamandre.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/6/62/1126066803_esenrquee3.jpg/revision/latest/scale-to-width-down/600?cb=20130710022637' },
];

async function main() {
  console.log('🃏 Seeding Bakuten characters...\n');
  let added = 0;
  for (const card of CARDS) {
    const existing = await prisma.gachaCard.findUnique({ where: { slug: card.slug } });
    if (!existing) {
      await prisma.gachaCard.create({ data: card });
      added++;
      const e = { COMMON: '⚪', RARE: '🔵', EPIC: '🟣', LEGENDARY: '🟡', SECRET: '🔴' };
      console.log(`  ${e[card.rarity]} ${card.name} — ${card.beyblade || 'N/A'}`);
    }
  }
  const total = await prisma.gachaCard.count();
  console.log(`\n✅ +${added} Bakuten cards. Total: ${total} cartes.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
