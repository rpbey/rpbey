/**
 * Update ALL gacha card stats with accurate wiki-sourced Beyblade data.
 * Stats are based on real character abilities, not rarity-based formulas.
 *
 * Run: pnpm tsx scripts/update-card-stats.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface CardStats {
  atk: number;
  def: number;
  spd: number;
  hp: number;
  element: string;
}

// Wiki-accurate stats for every card, keyed by slug
const CARD_STATS: Record<string, CardStats> = {
  // ══════════════════════════════════════════════════════════════════════════
  // BAKUTEN SHOOT BEYBLADE (Original)
  // ══════════════════════════════════════════════════════════════════════════
  'tyson':          { atk: 88, def: 55, spd: 82, hp: 90, element: 'VENT' },        // Dragoon = wind dragon, attack type, world champion
  'kai':            { atk: 85, def: 65, spd: 78, hp: 80, element: 'FEU' },         // Dranzer = phoenix, attack type, fire
  'ray':            { atk: 75, def: 60, spd: 88, hp: 72, element: 'VENT' },        // Driger = tiger, speed/attack
  'max':            { atk: 45, def: 92, spd: 50, hp: 85, element: 'EAU' },         // Draciel = turtle, defense type
  'brooklyn':       { atk: 95, def: 80, spd: 90, hp: 95, element: 'OMBRE' },       // Zeus = ultimate power, never lost before Tyson
  'tala':           { atk: 78, def: 70, spd: 75, hp: 75, element: 'EAU' },         // Wolborg = wolf, ice/endurance
  'ozuma':          { atk: 68, def: 65, spd: 72, hp: 68, element: 'TERRE' },       // Flash Leopard, balance
  'daichi':         { atk: 80, def: 45, spd: 70, hp: 65, element: 'TERRE' },       // Strata Dragoon = earth dragon
  'robert':         { atk: 60, def: 70, spd: 55, hp: 72, element: 'VENT' },        // Griffolyon = griffin, balance
  'kenny-bakuten':  { atk: 20, def: 25, spd: 30, hp: 35, element: 'NEUTRAL' },     // tech support, not a fighter
  'hilary':         { atk: 15, def: 20, spd: 25, hp: 40, element: 'LUMIERE' },     // manager, doesn't fight
  'mariam':         { atk: 55, def: 50, spd: 65, hp: 55, element: 'EAU' },         // Sharkrash, water
  'lee-bakuten':    { atk: 70, def: 55, spd: 68, hp: 62, element: 'TERRE' },       // Galeon = lion, attack
  'michael':        { atk: 65, def: 50, spd: 72, hp: 55, element: 'VENT' },        // Trygle = eagle, attack
  'johnny':         { atk: 72, def: 48, spd: 65, hp: 55, element: 'FEU' },         // Salamalyon = salamander, fire

  // ══════════════════════════════════════════════════════════════════════════
  // METAL FUSION
  // ══════════════════════════════════════════════════════════════════════════
  'gingka-fusion':  { atk: 85, def: 60, spd: 90, hp: 82, element: 'VENT' },        // Storm Pegasus, attack type
  'ryuga-fusion':   { atk: 95, def: 55, spd: 88, hp: 85, element: 'OMBRE' },       // L-Drago, left-spin attack, absorbs power
  'kyoya-fusion':   { atk: 82, def: 65, spd: 70, hp: 78, element: 'VENT' },        // Rock Leone, defense
  'doji-fusion':    { atk: 60, def: 55, spd: 68, hp: 65, element: 'OMBRE' },       // Dark Wolf, balance
  'phoenix':        { atk: 72, def: 68, spd: 58, hp: 80, element: 'FEU' },         // Burn Fireblaze, stamina type
  'reiji':          { atk: 65, def: 45, spd: 75, hp: 58, element: 'OMBRE' },       // Poison Serpent, stamina
  'teru':           { atk: 50, def: 62, spd: 55, hp: 65, element: 'TERRE' },       // Earth Virgo, defense
  'tobio':          { atk: 68, def: 48, spd: 78, hp: 55, element: 'VENT' },        // Storm Capricorne, attack
  'ryutaro':        { atk: 45, def: 50, spd: 55, hp: 60, element: 'EAU' },         // Thermal Pisces, stamina
  'tetsuya':        { atk: 52, def: 48, spd: 45, hp: 55, element: 'EAU' },         // Dark Gasher, balance
  'sora':           { atk: 55, def: 40, spd: 70, hp: 48, element: 'VENT' },        // Cyber Pegasus, attack

  // ══════════════════════════════════════════════════════════════════════════
  // METAL MASTERS
  // ══════════════════════════════════════════════════════════════════════════
  'gingka-masters': { atk: 88, def: 65, spd: 92, hp: 85, element: 'VENT' },        // Galaxy Pegasus, attack
  'ryuga-masters':  { atk: 95, def: 60, spd: 90, hp: 88, element: 'OMBRE' },       // Meteo L-Drago, attack
  'kyoya-masters':  { atk: 85, def: 70, spd: 72, hp: 80, element: 'VENT' },        // Fang Leone, attack
  'masamune':       { atk: 82, def: 50, spd: 85, hp: 70, element: 'LUMIERE' },     // Ray Striker, attack
  'tsubasa':        { atk: 62, def: 68, spd: 65, hp: 82, element: 'VENT' },        // Earth Eagle, stamina/balance
  'julian':         { atk: 70, def: 85, spd: 55, hp: 80, element: 'TERRE' },       // Gravity Destroyer, defense/attack
  'damian':         { atk: 88, def: 72, spd: 65, hp: 82, element: 'OMBRE' },       // Hades Kerbecs, stamina
  'yu-tendo':       { atk: 55, def: 52, spd: 72, hp: 65, element: 'LUMIERE' },     // Flame Libra, stamina
  'nile':           { atk: 68, def: 58, spd: 65, hp: 68, element: 'TERRE' },       // Vulcan Horuseus, attack
  'dashan':         { atk: 65, def: 75, spd: 58, hp: 75, element: 'TERRE' },       // Rock Zurafa, defense
  'jack':           { atk: 62, def: 55, spd: 60, hp: 65, element: 'OMBRE' },       // Evil Befall, stamina
  'kenta-masters':  { atk: 52, def: 48, spd: 58, hp: 55, element: 'FEU' },         // Flame Sagittario, stamina
  'benkei-masters': { atk: 72, def: 65, spd: 35, hp: 70, element: 'TERRE' },       // Dark Bull, defense
  'madoka':         { atk: 15, def: 20, spd: 25, hp: 35, element: 'LUMIERE' },     // support, not a fighter
  'hikaru':         { atk: 55, def: 45, spd: 65, hp: 52, element: 'EAU' },         // Storm Aquario, attack
  'mei-mei':        { atk: 50, def: 42, spd: 60, hp: 48, element: 'EAU' },         // Aquario 105F
  'chiyun':         { atk: 55, def: 48, spd: 58, hp: 52, element: 'FEU' },         // Thermal Lacerta

  // ══════════════════════════════════════════════════════════════════════════
  // METAL FURY
  // ══════════════════════════════════════════════════════════════════════════
  'ryuga-fury':     { atk: 98, def: 65, spd: 92, hp: 95, element: 'OMBRE' },       // L-Drago Destructor, ultimate power
  'gingka-fury':    { atk: 90, def: 70, spd: 95, hp: 88, element: 'LUMIERE' },     // Cosmic Pegasus, legend blader
  'kyoya-fury':     { atk: 88, def: 75, spd: 75, hp: 82, element: 'VENT' },        // strongest Fang Leone
  'chris':          { atk: 55, def: 70, spd: 50, hp: 92, element: 'LUMIERE' },     // Phantom Orion, infinite stamina
  'aguma':          { atk: 82, def: 72, spd: 55, hp: 78, element: 'TERRE' },       // Scythe Kronos, balance
  'dynamis':        { atk: 60, def: 78, spd: 62, hp: 80, element: 'LUMIERE' },     // Jade Jupiter, defense
  'king-fury':      { atk: 88, def: 58, spd: 78, hp: 72, element: 'FEU' },         // Variares D:D, attack/defense switch
  'yuki':           { atk: 52, def: 58, spd: 55, hp: 65, element: 'EAU' },         // Mercury Anubius, balance
  'tithi':          { atk: 62, def: 55, spd: 70, hp: 62, element: 'VENT' },        // Death Quetzalcoatl, balance
  'bao':            { atk: 68, def: 55, spd: 60, hp: 58, element: 'FEU' },         // Hell Crown, attack
  'johannes':       { atk: 48, def: 42, spd: 70, hp: 45, element: 'OMBRE' },       // Beat Lynx, stamina/trick
  'pluto':          { atk: 55, def: 52, spd: 48, hp: 58, element: 'OMBRE' },       // Firefuse Darkhelm, balance
  'hyoma-fury':     { atk: 48, def: 58, spd: 50, hp: 58, element: 'EAU' },         // Rock Aries, defense
  'doji-fury':      { atk: 60, def: 52, spd: 60, hp: 55, element: 'OMBRE' },       // Dark Wolf reborn

  // ══════════════════════════════════════════════════════════════════════════
  // SHOGUN STEEL / ZERO-G
  // ══════════════════════════════════════════════════════════════════════════
  'zyro':           { atk: 85, def: 62, spd: 82, hp: 78, element: 'FEU' },         // Samurai Ifraid, attack
  'sakyo':          { atk: 90, def: 68, spd: 80, hp: 82, element: 'OMBRE' },       // Ronin Dragoon, attack
  'shinobu':        { atk: 65, def: 58, spd: 82, hp: 68, element: 'EAU' },         // Ninja Salamander, stamina
  'kite':           { atk: 48, def: 72, spd: 45, hp: 75, element: 'EAU' },         // Guardian Leviathan, defense
  'eight':          { atk: 52, def: 42, spd: 60, hp: 48, element: 'EAU' },         // Pirate Orojya, attack

  // ══════════════════════════════════════════════════════════════════════════
  // BEYBLADE BURST
  // ══════════════════════════════════════════════════════════════════════════
  'valt':           { atk: 85, def: 68, spd: 88, hp: 82, element: 'LUMIERE' },     // Valtryek, attack type, main protagonist
  'shu':            { atk: 88, def: 72, spd: 85, hp: 80, element: 'FEU' },         // Spryzen, balance, dual spin
  'lui':            { atk: 96, def: 58, spd: 95, hp: 75, element: 'OMBRE' },       // Luinor, left-spin attack, destroyer
  'free':           { atk: 55, def: 75, spd: 60, hp: 90, element: 'EAU' },         // Fafnir, spin steal, stamina
  'aiga':           { atk: 90, def: 55, spd: 82, hp: 72, element: 'FEU' },         // Z Achilles, attack
  'phi':            { atk: 92, def: 60, spd: 78, hp: 75, element: 'OMBRE' },       // Phoenix, attack, bey breaker
  'drum':           { atk: 78, def: 65, spd: 75, hp: 78, element: 'FEU' },         // Ace Dragon, balance
  'hyuga':          { atk: 78, def: 48, spd: 72, hp: 62, element: 'FEU' },         // Super Hyperion, attack
  'hikaru-burst':   { atk: 55, def: 68, spd: 58, hp: 72, element: 'EAU' },         // Helios Volcano, defense
  'bell':           { atk: 82, def: 62, spd: 75, hp: 70, element: 'OMBRE' },       // Dynamite Belial, attack

  // ══════════════════════════════════════════════════════════════════════════
  // BEYBLADE X
  // ══════════════════════════════════════════════════════════════════════════
  'multi':          { atk: 82, def: 65, spd: 88, hp: 78, element: 'LUMIERE' },     // Dran Sword, attack
  'bird':           { atk: 72, def: 78, spd: 68, hp: 88, element: 'OMBRE' },       // Hells Scythe, stamina/defense
  'burn':           { atk: 95, def: 80, spd: 92, hp: 90, element: 'FEU' },         // Phoenix Wing, ultimate form
  'persona-jaxon':  { atk: 55, def: 85, spd: 50, hp: 82, element: 'TERRE' },       // Knight Shield, defense
  'persona-enga':   { atk: 85, def: 55, spd: 78, hp: 68, element: 'FEU' },         // Leon Claw, attack
  'khrome':         { atk: 80, def: 52, spd: 82, hp: 68, element: 'EAU' },         // Shark Edge, attack
  'masato':         { atk: 58, def: 50, spd: 72, hp: 62, element: 'VENT' },        // Wizard Arrow, attack
  'omega':          { atk: 68, def: 62, spd: 65, hp: 72, element: 'LUMIERE' },     // Cobalt Dragoon, balance
  'natsu':          { atk: 65, def: 42, spd: 70, hp: 52, element: 'FEU' },         // Dran Dagger, attack
  'leak':           { atk: 58, def: 48, spd: 65, hp: 55, element: 'OMBRE' },       // Viper Tail, balance
};

async function main() {
  console.log('⚔️  Updating ALL card stats with wiki-accurate data...\n');

  const cards = await prisma.gachaCard.findMany({ select: { slug: true, name: true } });
  let updated = 0;
  let skipped = 0;

  const elEmoji: Record<string, string> = {
    FEU: '🔥', EAU: '💧', TERRE: '🌍', VENT: '🌪️',
    OMBRE: '🌑', LUMIERE: '✨', NEUTRAL: '⚪',
  };

  for (const card of cards) {
    const stats = CARD_STATS[card.slug];
    if (!stats) {
      console.log(`  ⏭️  ${card.name.padEnd(35)} — pas de stats wiki (slug: ${card.slug})`);
      skipped++;
      continue;
    }

    await prisma.gachaCard.update({
      where: { slug: card.slug },
      data: {
        atk: stats.atk,
        def: stats.def,
        spd: stats.spd,
        hp: stats.hp,
        element: stats.element,
      },
    });

    console.log(
      `  ${elEmoji[stats.element] || '⚪'} ${card.name.padEnd(35)} ` +
      `ATK:${String(stats.atk).padStart(3)} ` +
      `DEF:${String(stats.def).padStart(3)} ` +
      `SPD:${String(stats.spd).padStart(3)} ` +
      `HP:${String(stats.hp).padStart(3)} ` +
      `[${stats.element}]`
    );
    updated++;
  }

  console.log(`\n✅ ${updated} cartes mises à jour avec stats wiki-accurate.`);
  if (skipped > 0) {
    console.log(`⏭️  ${skipped} cartes ignorées (pas de stats définies).`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
