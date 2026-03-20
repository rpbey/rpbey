/**
 * Seed gacha cards V2 — All Beyblade generations
 * Metal Fusion + Shogun Steel + Burst + X + Original
 */

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
  // ══════════════════════════════════════════════════════════════════════════
  // METAL FUSION (nouveau)
  // ══════════════════════════════════════════════════════════════════════════
  { slug: 'gingka-fusion', name: 'Gingka Hagane (Storm)', nameJp: '鋼銀河', series: 'METAL_FUSION', rarity: 'LEGENDARY',
    beyblade: 'Storm Pegasus 105RF', description: "Le héros légendaire du Beyblade Metal. Avec Storm Pegasus, il a vaincu la Dark Nebula et sauvé le monde du Beyblade. Son esprit combatif est sans égal.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/e/e5/GingaHaganeMetalFusion.jpg/revision/latest/scale-to-width-down/320?cb=20230824175306' },
  { slug: 'ryuga-fusion', name: 'Ryuga (Lightning)', nameJp: '竜牙', series: 'METAL_FUSION', rarity: 'LEGENDARY',
    beyblade: 'Lightning L-Drago 100HF', description: "Possédé par le pouvoir obscur de L-Drago, Ryuga est le blader le plus dangereux de la Dark Nebula. Son Lightning L-Drago absorbe la puissance de rotation adverse.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/a/ae/Ryuga_Trans.png/revision/latest/scale-to-width-down/286?cb=20111110014832' },
  { slug: 'kyoya-fusion', name: 'Kyoya Tategami (Rock)', nameJp: '盾神キョウヤ', series: 'METAL_FUSION', rarity: 'EPIC',
    beyblade: 'Rock Leone 145WB', description: "Le lion solitaire, ancien leader des Face Hunters devenu rival de Gingka. Son Rock Leone crée des tornades dévastatrices avec son Special Move Lion Gale Force Wall.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/3/3b/Kyoya_Tategami_Trans.png/revision/latest/scale-to-width-down/265?cb=20111103202601' },
  { slug: 'doji-fusion', name: 'Doji', nameJp: '大道寺', series: 'METAL_FUSION', rarity: 'EPIC',
    beyblade: 'Dark Wolf DF145FS', description: "Leader de la Dark Nebula et manipulateur de génie. Il a ressuscité le pouvoir de L-Drago pour dominer le monde du Beyblade.",
    imageUrl: 'https://static.wikia.nocookie.net/beyblade/images/8/8d/DojiAnimeUpdated.jpg/revision/latest/scale-to-width-down/248?cb=20230623010712' },
  { slug: 'phoenix', name: 'Phoenix', series: 'METAL_FUSION', rarity: 'EPIC',
    beyblade: 'Burn Fireblaze 135MS', description: "Blader mystérieux masqué qui aide secrètement Gingka. Son identité est celle de Ryo Hagane, le père de Gingka, ancien champion du monde.",
    imageUrl: '' },
  { slug: 'reiji', name: 'Reiji Mizuchi', series: 'METAL_FUSION', rarity: 'RARE',
    beyblade: 'Poison Serpent SW145SD', description: "Blader sadique de la Dark Nebula au regard de serpent. Son Poison Serpent utilise des techniques sournoises et déstabilisantes.",
    imageUrl: '' },
  { slug: 'teru', name: 'Teru Saotome', series: 'METAL_FUSION', rarity: 'RARE',
    beyblade: 'Earth Virgo GB145BS', description: "Danseur de ballet passionné qui combine la grâce de la danse avec le Beyblade. Son Earth Virgo est élégant et précis.",
    imageUrl: '' },
  { slug: 'tobio', name: 'Tobio Oike', series: 'METAL_FUSION', rarity: 'RARE',
    beyblade: 'Storm Capricorne M145Q', description: "Surnommé Captain Capri, ce sniper du Beyblade utilise des lancers à longue distance avec une précision chirurgicale.",
    imageUrl: '' },
  { slug: 'ryutaro', name: 'Ryutaro Fukami', series: 'METAL_FUSION', rarity: 'COMMON',
    beyblade: 'Thermal Pisces T125ES', description: "Blader mystique qui prétend voir l'avenir. Son Thermal Pisces crée des illusions aquatiques déstabilisantes.",
    imageUrl: '' },
  { slug: 'tetsuya', name: 'Tetsuya Watarigani', series: 'METAL_FUSION', rarity: 'COMMON',
    beyblade: 'Dark Gasher CH120FS', description: "Le blader crabe excentrique ! Obsédé par les crabes, il utilise des tactiques sournoises et imprévisibles.",
    imageUrl: '' },
  { slug: 'sora', name: 'Sora Akatsuki', series: 'METAL_FUSION', rarity: 'COMMON',
    beyblade: 'Cyber Pegasus 100HF', description: "Fan inconditionnel de Gingka, il rêve de devenir aussi fort que son idole. Son Cyber Pegasus est une copie de Storm Pegasus.",
    imageUrl: '' },

  // ══════════════════════════════════════════════════════════════════════════
  // SHOGUN STEEL / ZERO-G
  // ══════════════════════════════════════════════════════════════════════════
  { slug: 'zyro', name: 'Zyro Kurogane', nameJp: '黒銀ゼロ', series: 'SHOGUN_STEEL', rarity: 'LEGENDARY',
    beyblade: 'Samurai Ifraid W145CF', description: "Successeur spirituel de Gingka, Zyro manie le feu avec son Samurai Ifraid dans les nouveaux stadiums Zero-G. Il rêve de surpasser la légende de Pegasus.",
    imageUrl: '' },
  { slug: 'sakyo', name: 'Sakyo Kurayami', series: 'SHOGUN_STEEL', rarity: 'LEGENDARY',
    beyblade: 'Ronin Dragoon LW160BSF', description: "Le Dragon Noir, rival ténébreux de Zyro. Son Ronin Dragoon est l'héritier de L-Drago, portant la même soif de puissance que Ryuga.",
    imageUrl: '' },
  { slug: 'shinobu', name: 'Shinobu Hiryuin', series: 'SHOGUN_STEEL', rarity: 'EPIC',
    beyblade: 'Ninja Salamander SW145SD', description: "Ninja blader agile et rapide, meilleur ami de Zyro. Son Salamander utilise des techniques furtives inspirées des arts ninja.",
    imageUrl: '' },
  { slug: 'kite', name: 'Kite Unabara', series: 'SHOGUN_STEEL', rarity: 'RARE',
    beyblade: 'Guardian Leviathan 160SB', description: "Génie du Beyblade et stratège analytique. Son Guardian Leviathan domine par la défense et le contrôle.",
    imageUrl: '' },
  { slug: 'eight', name: 'Eight Unabara', series: 'SHOGUN_STEEL', rarity: 'COMMON',
    beyblade: 'Pirate Orojya 145D', description: "Le petit frère pirate de Kite ! Jeune et fougueux, il combat avec enthousiasme et son Pirate Orojya.",
    imageUrl: '' },

  // ══════════════════════════════════════════════════════════════════════════
  // BEYBLADE BURST
  // ══════════════════════════════════════════════════════════════════════════
  { slug: 'valt', name: 'Valt Aoi', nameJp: '蒼井バルト', series: 'BURST', rarity: 'LEGENDARY',
    beyblade: 'Valtryek Wing Accel', description: "Le héros emblématique de Burst ! Passionné et déterminé, Valt a gravi les échelons du Beyblade mondial avec son fidèle Valtryek, évoluant à chaque saison.",
    imageUrl: '' },
  { slug: 'shu', name: 'Shu Kurenai', nameJp: '紅シュウ', series: 'BURST', rarity: 'LEGENDARY',
    beyblade: 'Spryzen Spread Fusion', description: "Le prodige au talent naturel, rival et ami de Valt. Shu possède un talent exceptionnel mais porte un lourd fardeau émotionnel. Son Spryzen tourne dans les deux sens.",
    imageUrl: '' },
  { slug: 'lui', name: 'Lui Shirosagi', nameJp: '白鷺城ルイ', series: 'BURST', rarity: 'SECRET',
    beyblade: 'Luinor Lost Spiral', description: "Le blader le plus brutal et impitoyable de Burst. Lui ne connaît que la victoire absolue. Son Luinor est conçu pour détruire les adversaires par Burst Finish.",
    imageUrl: '' },
  { slug: 'free', name: 'Free De La Hoya', series: 'BURST', rarity: 'EPIC',
    beyblade: 'Fafnir Nothing', description: "Le blader nonchalant le plus puissant du monde. Free a un talent naturel surhumain et son Fafnir absorbe la rotation adverse grâce à sa rotation inverse.",
    imageUrl: '' },
  { slug: 'aiga', name: 'Aiga Akaba', nameJp: '赤刃アイガ', series: 'BURST', rarity: 'EPIC',
    beyblade: 'Z Achilles 11 Xtend', description: "Le successeur de Valt dans Turbo. Sauvage et instinctif, Aiga développe une connexion spirituelle avec son Z Achilles, créant une résonance rouge flamboyante.",
    imageUrl: '' },
  { slug: 'phi', name: 'Phi', series: 'BURST', rarity: 'EPIC',
    beyblade: 'Phoenix P4 10 Friction', description: "L'antagoniste diabolique de Turbo. Phi cherche à détruire toutes les toupies et se nourrit de la peur de ses adversaires. Son Phoenix renaît de ses cendres.",
    imageUrl: '' },
  { slug: 'drum', name: 'Drum Koryu', nameJp: '虹龍ドラム', series: 'BURST', rarity: 'EPIC',
    beyblade: 'Ace Dragon Sting Charge Zan', description: "Le héros de Rise/GT, descendant d'une lignée de bladers. Son Dragon évolue constamment avec le système GT de chips interchangeables.",
    imageUrl: '' },
  { slug: 'hyuga', name: 'Hyuga Asahi', series: 'BURST', rarity: 'RARE',
    beyblade: 'Super Hyperion Xceed 1A', description: "L'un des frères jumeaux héros de Surge/Superking. Hyuga est le frère solaire, explosif et énergique avec son Hyperion flamboyant.",
    imageUrl: '' },
  { slug: 'hikaru-burst', name: 'Hikaru Asahi', series: 'BURST', rarity: 'RARE',
    beyblade: 'Helios Volcano Ou Zone+Z-Awakened', description: "Le frère lunaire, calme et stratégique. Hikaru complète parfaitement son frère Hyuga avec son Helios défensif.",
    imageUrl: '' },
  { slug: 'bell', name: 'Bell Daikokuten', series: 'BURST', rarity: 'RARE',
    beyblade: 'Dynamite Belial Nexus Venture-2', description: "Le Demon King autoproclamé de Dynamite Battle ! Bell est flamboyant et théâtral, son Belial se transforme entre modes Attack et Stamina.",
    imageUrl: '' },

  // ══════════════════════════════════════════════════════════════════════════
  // BEYBLADE X
  // ══════════════════════════════════════════════════════════════════════════
  { slug: 'multi', name: 'Multi Nana-iro', nameJp: '七色マルチ', series: 'BEYBLADE_X', rarity: 'LEGENDARY',
    beyblade: 'Dran Sword 3-60F', description: "Le héros de Beyblade X ! Multi entre dans le monde du X avec sa toupie Dran Sword. Déterminé et créatif, il repousse sans cesse ses limites dans l'Xtreme Stadium.",
    imageUrl: '' },
  { slug: 'bird', name: 'Bird Kazami', nameJp: '風見バード', series: 'BEYBLADE_X', rarity: 'LEGENDARY',
    beyblade: 'Hells Scythe 4-60T', description: "Le rival cool et calculateur de Multi. Bird est un blader stratège qui analyse chaque combat. Son Hells Scythe est une toupie de type Stamina redoutable.",
    imageUrl: '' },
  { slug: 'burn', name: 'X (Burn)', series: 'BEYBLADE_X', rarity: 'SECRET',
    beyblade: 'Phoenix Wing 9-60GF', description: "Le mystérieux champion au masque, numéro 1 du classement X. Sa véritable identité est entourée de mystère. Son Phoenix Wing est la toupie la plus puissante.",
    imageUrl: '' },
  { slug: 'persona-jaxon', name: 'Jaxon Cross', series: 'BEYBLADE_X', rarity: 'EPIC',
    beyblade: 'Knight Shield 3-80N', description: "Capitaine de Team Persona, le gardien chevaleresque. Jaxon protège ses coéquipiers avec son Knight Shield défensif infranchissable.",
    imageUrl: '' },
  { slug: 'persona-enga', name: 'Enga Fugazaru', series: 'BEYBLADE_X', rarity: 'EPIC',
    beyblade: 'Leon Claw 5-60P', description: "Le lion féroce de Team Persona. Enga est un combattant brutal et direct dont le Leon Claw déchire tout sur son passage avec des coups d'attaque dévastateurs.",
    imageUrl: '' },
  { slug: 'khrome', name: 'Khrome Ryugu', series: 'BEYBLADE_X', rarity: 'EPIC',
    beyblade: 'Shark Edge 3-60LF', description: "Le prodige de la vitesse ! Khrome est le blader le plus rapide du circuit X. Son Shark Edge utilise la X-Line du stadium pour des attaques fulgurantes.",
    imageUrl: '' },
  { slug: 'masato', name: 'Masato Akechi', series: 'BEYBLADE_X', rarity: 'RARE',
    beyblade: 'Wizard Arrow 4-80B', description: "L'archer précis de l'arène X. Masato calcule chaque trajectoire avec une précision mathématique. Son Wizard Arrow ne rate jamais sa cible.",
    imageUrl: '' },
  { slug: 'omega', name: 'Omega Shiroboshi', series: 'BEYBLADE_X', rarity: 'RARE',
    beyblade: 'Cobalt Dragoon 4-60R', description: "Le blader au dragon légendaire ! Omega est le descendant d'une ancienne lignée. Son Cobalt Dragoon porte l'héritage des dragons du Beyblade.",
    imageUrl: '' },
  { slug: 'natsu', name: 'Natsu Shiranui', series: 'BEYBLADE_X', rarity: 'COMMON',
    beyblade: 'Dran Dagger 4-60LF', description: "Le blader de rue au style sauvage. Natsu combat par instinct pur avec son Dran Dagger rapide et agressif.",
    imageUrl: '' },
  { slug: 'leak', name: 'Leak Fushimi', series: 'BEYBLADE_X', rarity: 'COMMON',
    beyblade: 'Viper Tail 4-60F', description: "Le blader serpent rusé et imprévisible. Leak utilise des stratégies sournoises avec son Viper Tail trompeur.",
    imageUrl: '' },
];

async function main() {
  console.log('🃏 Seeding gacha cards V2...\n');
  let added = 0;
  let updated = 0;

  for (const card of CARDS) {
    const existing = await prisma.gachaCard.findUnique({ where: { slug: card.slug } });
    if (existing) {
      await prisma.gachaCard.update({ where: { slug: card.slug }, data: { description: card.description, beyblade: card.beyblade } });
      updated++;
    } else {
      await prisma.gachaCard.create({ data: card });
      added++;
    }
    const e = { COMMON: '⚪', RARE: '🔵', EPIC: '🟣', LEGENDARY: '🟡', SECRET: '🔴' };
    console.log(`  ${e[card.rarity]} ${card.name} (${card.series}) ${existing ? '↻' : '+'}`);
  }

  const total = await prisma.gachaCard.count();
  console.log(`\n✅ +${added} nouvelles, ${updated} mises à jour. Total: ${total} cartes.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
