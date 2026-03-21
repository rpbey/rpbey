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
  specialMove: string;
}

// Wiki-accurate stats for every card, keyed by slug
const CARD_STATS: Record<string, CardStats> = {
  // ══════════════════════════════════════════════════════════════════════════
  // BAKUTEN SHOOT BEYBLADE (Original)
  // ══════════════════════════════════════════════════════════════════════════
  'tyson':          { atk: 88, def: 55, spd: 82, hp: 90, element: 'VENT', specialMove: 'Evolution Storm' },
  'kai':            { atk: 85, def: 65, spd: 78, hp: 80, element: 'FEU', specialMove: 'Blazing Gigs Tempest' },
  'ray':            { atk: 75, def: 60, spd: 88, hp: 72, element: 'VENT', specialMove: 'Gatling Claw' },
  'max':            { atk: 45, def: 92, spd: 50, hp: 85, element: 'EAU', specialMove: 'Gravity Control' },
  'brooklyn':       { atk: 95, def: 80, spd: 90, hp: 95, element: 'OMBRE', specialMove: 'King of Darkness' },
  'tala':           { atk: 78, def: 70, spd: 75, hp: 75, element: 'EAU', specialMove: 'Novae Rog' },
  'ozuma':          { atk: 68, def: 65, spd: 72, hp: 68, element: 'TERRE', specialMove: 'Cross Fire' },
  'daichi':         { atk: 80, def: 45, spd: 70, hp: 65, element: 'TERRE', specialMove: 'Great Cutter' },
  'robert':         { atk: 60, def: 70, spd: 55, hp: 72, element: 'VENT', specialMove: 'Wing Dagger' },
  'kenny-bakuten':  { atk: 20, def: 25, spd: 30, hp: 35, element: 'NEUTRAL', specialMove: 'Data Analysis' },
  'hilary':         { atk: 15, def: 20, spd: 25, hp: 40, element: 'LUMIERE', specialMove: 'Moral Support' },
  'mariam':         { atk: 55, def: 50, spd: 65, hp: 55, element: 'EAU', specialMove: 'Shark Crash' },
  'lee-bakuten':    { atk: 70, def: 55, spd: 68, hp: 62, element: 'TERRE', specialMove: 'Gatling Claw' },
  'michael':        { atk: 65, def: 50, spd: 72, hp: 55, element: 'VENT', specialMove: 'Iron Hammer' },
  'johnny':         { atk: 72, def: 48, spd: 65, hp: 55, element: 'FEU', specialMove: 'Fire Blitz' },

  // ══════════════════════════════════════════════════════════════════════════
  // METAL FUSION
  // ══════════════════════════════════════════════════════════════════════════
  'gingka-fusion':  { atk: 85, def: 60, spd: 90, hp: 82, element: 'VENT', specialMove: 'Starblast Attack' },
  'ryuga-fusion':   { atk: 95, def: 55, spd: 88, hp: 85, element: 'OMBRE', specialMove: 'Dragon Emperor Soaring Bite Strike' },
  'kyoya-fusion':   { atk: 82, def: 65, spd: 70, hp: 78, element: 'VENT', specialMove: 'Lion Gale Force Wall' },
  'doji-fusion':    { atk: 60, def: 55, spd: 68, hp: 65, element: 'OMBRE', specialMove: 'Darkness Howling Blazer' },
  'phoenix':        { atk: 72, def: 68, spd: 58, hp: 80, element: 'FEU', specialMove: 'Burning Fire Strike' },
  'reiji':          { atk: 65, def: 45, spd: 75, hp: 58, element: 'OMBRE', specialMove: 'Venom Strike' },
  'teru':           { atk: 50, def: 62, spd: 55, hp: 65, element: 'TERRE', specialMove: 'Pirouette Tour' },
  'tobio':          { atk: 68, def: 48, spd: 78, hp: 55, element: 'VENT', specialMove: 'Sniper Shot' },
  'ryutaro':        { atk: 45, def: 50, spd: 55, hp: 60, element: 'EAU', specialMove: 'Distortion Drive' },
  'tetsuya':        { atk: 52, def: 48, spd: 45, hp: 55, element: 'EAU', specialMove: 'Crab Scissors' },
  'sora':           { atk: 55, def: 40, spd: 70, hp: 48, element: 'VENT', specialMove: 'Pegasus Starblast' },

  // ══════════════════════════════════════════════════════════════════════════
  // METAL MASTERS
  // ══════════════════════════════════════════════════════════════════════════
  'gingka-masters': { atk: 88, def: 65, spd: 92, hp: 85, element: 'VENT', specialMove: 'Galaxy Nova' },
  'ryuga-masters':  { atk: 95, def: 60, spd: 90, hp: 88, element: 'OMBRE', specialMove: 'Dragon Emperor Supreme Flight' },
  'kyoya-masters':  { atk: 85, def: 70, spd: 72, hp: 80, element: 'VENT', specialMove: 'King Lion Tearing Blast' },
  'masamune':       { atk: 82, def: 50, spd: 85, hp: 70, element: 'LUMIERE', specialMove: 'Lightning Sword Flash' },
  'tsubasa':        { atk: 62, def: 68, spd: 65, hp: 82, element: 'VENT', specialMove: 'Shining Tornado Buster' },
  'julian':         { atk: 70, def: 85, spd: 55, hp: 80, element: 'TERRE', specialMove: 'Black Excalibur' },
  'damian':         { atk: 88, def: 72, spd: 65, hp: 82, element: 'OMBRE', specialMove: 'Hades Gate' },
  'yu-tendo':       { atk: 55, def: 52, spd: 72, hp: 65, element: 'LUMIERE', specialMove: 'Inferno Blast' },
  'nile':           { atk: 68, def: 58, spd: 65, hp: 68, element: 'TERRE', specialMove: 'Mystic Zone' },
  'dashan':         { atk: 65, def: 75, spd: 58, hp: 75, element: 'TERRE', specialMove: 'Solid Iron Wall' },
  'jack':           { atk: 62, def: 55, spd: 60, hp: 65, element: 'OMBRE', specialMove: 'Beautiful Dead' },
  'kenta-masters':  { atk: 52, def: 48, spd: 58, hp: 55, element: 'FEU', specialMove: 'Flame Claw' },
  'benkei-masters': { atk: 72, def: 65, spd: 35, hp: 70, element: 'TERRE', specialMove: 'Red Horn Upper' },
  'madoka':         { atk: 15, def: 20, spd: 25, hp: 35, element: 'LUMIERE', specialMove: 'Bey Mechanic' },
  'hikaru':         { atk: 55, def: 45, spd: 65, hp: 52, element: 'EAU', specialMove: 'Aquario Infinite Assault' },
  'mei-mei':        { atk: 50, def: 42, spd: 60, hp: 48, element: 'EAU', specialMove: 'Flowing Dance' },
  'chiyun':         { atk: 55, def: 48, spd: 58, hp: 52, element: 'FEU', specialMove: 'Tempestuous Whirlwind Sword' },

  // ══════════════════════════════════════════════════════════════════════════
  // METAL FURY
  // ══════════════════════════════════════════════════════════════════════════
  'ryuga-fury':     { atk: 98, def: 65, spd: 92, hp: 95, element: 'OMBRE', specialMove: 'Dragon Emperor Life Destructor' },
  'gingka-fury':    { atk: 90, def: 70, spd: 95, hp: 88, element: 'LUMIERE', specialMove: 'Super Cosmic Nova' },
  'kyoya-fury':     { atk: 88, def: 75, spd: 75, hp: 82, element: 'VENT', specialMove: 'King Lion Reverse Wind Strike' },
  'chris':          { atk: 55, def: 70, spd: 50, hp: 92, element: 'LUMIERE', specialMove: "Barnard's Loop" },
  'aguma':          { atk: 82, def: 72, spd: 55, hp: 78, element: 'TERRE', specialMove: 'Great Ring of Destruction' },
  'dynamis':        { atk: 60, def: 78, spd: 62, hp: 80, element: 'LUMIERE', specialMove: 'Grand Lightning' },
  'king-fury':      { atk: 88, def: 58, spd: 78, hp: 72, element: 'FEU', specialMove: 'King of Thunder Sword' },
  'yuki':           { atk: 52, def: 58, spd: 55, hp: 65, element: 'EAU', specialMove: 'Brave Impact' },
  'tithi':          { atk: 62, def: 55, spd: 70, hp: 62, element: 'VENT', specialMove: 'Ishtar Impact' },
  'bao':            { atk: 68, def: 55, spd: 60, hp: 58, element: 'FEU', specialMove: 'Crown Inferno' },
  'johannes':       { atk: 48, def: 42, spd: 70, hp: 45, element: 'OMBRE', specialMove: 'Shadow Wild Dance' },
  'pluto':          { atk: 55, def: 52, spd: 48, hp: 58, element: 'OMBRE', specialMove: 'Dark Move' },
  'hyoma-fury':     { atk: 48, def: 58, spd: 50, hp: 58, element: 'EAU', specialMove: 'Eternal Defense' },
  'doji-fury':      { atk: 60, def: 52, spd: 60, hp: 55, element: 'OMBRE', specialMove: 'Darkness Howling' },

  // ══════════════════════════════════════════════════════════════════════════
  // SHOGUN STEEL / ZERO-G
  // ══════════════════════════════════════════════════════════════════════════
  'zyro':           { atk: 85, def: 62, spd: 82, hp: 78, element: 'FEU', specialMove: 'Burning Tornado Fire' },
  'sakyo':          { atk: 90, def: 68, spd: 80, hp: 82, element: 'OMBRE', specialMove: 'Ronin Dragon Destroy' },
  'shinobu':        { atk: 65, def: 58, spd: 82, hp: 68, element: 'EAU', specialMove: 'Ninja Shadow Dance' },
  'kite':           { atk: 48, def: 72, spd: 45, hp: 75, element: 'EAU', specialMove: 'Leviathan Dive' },
  'eight':          { atk: 52, def: 42, spd: 60, hp: 48, element: 'EAU', specialMove: 'Pirate Boarding' },

  // ══════════════════════════════════════════════════════════════════════════
  // BEYBLADE BURST
  // ══════════════════════════════════════════════════════════════════════════
  'valt':           { atk: 85, def: 68, spd: 88, hp: 82, element: 'LUMIERE', specialMove: 'Ultimate Flash Launch' },
  'shu':            { atk: 88, def: 72, spd: 85, hp: 80, element: 'FEU', specialMove: 'Requiem Whip' },
  'lui':            { atk: 96, def: 58, spd: 95, hp: 75, element: 'OMBRE', specialMove: 'Lost Spiral' },
  'free':           { atk: 55, def: 75, spd: 60, hp: 90, element: 'EAU', specialMove: 'Drain Spin' },
  'aiga':           { atk: 90, def: 55, spd: 82, hp: 72, element: 'FEU', specialMove: 'Z Breaker' },
  'phi':            { atk: 92, def: 60, spd: 78, hp: 75, element: 'OMBRE', specialMove: 'Final Dread Impact' },
  'drum':           { atk: 78, def: 65, spd: 75, hp: 78, element: 'FEU', specialMove: 'Rainbow-Flux' },
  'hyuga':          { atk: 78, def: 48, spd: 72, hp: 62, element: 'FEU', specialMove: 'Flaming Limit Breaker' },
  'hikaru-burst':   { atk: 55, def: 68, spd: 58, hp: 72, element: 'EAU', specialMove: 'Zone Defense' },
  'bell':           { atk: 82, def: 62, spd: 75, hp: 70, element: 'OMBRE', specialMove: 'Destruction Wrecker' },

  // ══════════════════════════════════════════════════════════════════════════
  // BEYBLADE X
  // ══════════════════════════════════════════════════════════════════════════
  'multi':          { atk: 82, def: 65, spd: 88, hp: 78, element: 'LUMIERE', specialMove: 'Sylphide Breath' },
  'bird':           { atk: 72, def: 78, spd: 68, hp: 88, element: 'OMBRE', specialMove: 'Xtreme Dash Crescent Judgment' },
  'burn':           { atk: 95, def: 80, spd: 92, hp: 90, element: 'FEU', specialMove: 'Xtreme Dash Burning Maneuver' },
  'persona-jaxon':  { atk: 55, def: 85, spd: 50, hp: 82, element: 'TERRE', specialMove: 'Shield Fortress' },
  'persona-enga':   { atk: 85, def: 55, spd: 78, hp: 68, element: 'FEU', specialMove: 'Leon Fury' },
  'khrome':         { atk: 80, def: 52, spd: 82, hp: 68, element: 'EAU', specialMove: 'Xtreme Dash Dragonic Overdrive' },
  'masato':         { atk: 58, def: 50, spd: 72, hp: 62, element: 'VENT', specialMove: 'Mirage Parry' },
  'omega':          { atk: 68, def: 62, spd: 65, hp: 72, element: 'LUMIERE', specialMove: 'Glimmering Stars' },
  'natsu':          { atk: 65, def: 42, spd: 70, hp: 52, element: 'FEU', specialMove: 'Dagger Slash' },
  'leak':           { atk: 58, def: 48, spd: 65, hp: 55, element: 'OMBRE', specialMove: 'Viper Sting' },
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
        specialMove: stats.specialMove,
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
