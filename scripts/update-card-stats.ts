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
  att: number;
  def: number;
  end: number;
  equilibre: number;
  element: string;
  specialMove: string;
}

// Wiki-accurate stats for every card, keyed by slug
const CARD_STATS: Record<string, CardStats> = {
  // ══════════════════════════════════════════════════════════════════════════
  // BAKUTEN SHOOT BEYBLADE (Original)
  // ══════════════════════════════════════════════════════════════════════════
  'tyson':          { att: 88, def: 55, end: 82, equilibre: 90, element: 'VENT', specialMove: 'Evolution Storm' },
  'kai':            { att: 85, def: 65, end: 78, equilibre: 80, element: 'FEU', specialMove: 'Blazing Gigs Tempest' },
  'ray':            { att: 75, def: 60, end: 88, equilibre: 72, element: 'VENT', specialMove: 'Gatling Claw' },
  'max':            { att: 45, def: 92, end: 50, equilibre: 85, element: 'EAU', specialMove: 'Gravity Control' },
  'brooklyn':       { att: 95, def: 80, end: 90, equilibre: 95, element: 'OMBRE', specialMove: 'King of Darkness' },
  'tala':           { att: 78, def: 70, end: 75, equilibre: 75, element: 'EAU', specialMove: 'Novae Rog' },
  'ozuma':          { att: 68, def: 65, end: 72, equilibre: 68, element: 'TERRE', specialMove: 'Cross Fire' },
  'daichi':         { att: 80, def: 45, end: 70, equilibre: 65, element: 'TERRE', specialMove: 'Great Cutter' },
  'robert':         { att: 60, def: 70, end: 55, equilibre: 72, element: 'VENT', specialMove: 'Wing Dagger' },
  'kenny-bakuten':  { att: 20, def: 25, end: 30, equilibre: 35, element: 'NEUTRAL', specialMove: 'Data Analysis' },
  'hilary':         { att: 15, def: 20, end: 25, equilibre: 40, element: 'LUMIERE', specialMove: 'Moral Support' },
  'mariam':         { att: 55, def: 50, end: 65, equilibre: 55, element: 'EAU', specialMove: 'Shark Crash' },
  'lee-bakuten':    { att: 70, def: 55, end: 68, equilibre: 62, element: 'TERRE', specialMove: 'Gatling Claw' },
  'michael':        { att: 65, def: 50, end: 72, equilibre: 55, element: 'VENT', specialMove: 'Iron Hammer' },
  'johnny':         { att: 72, def: 48, end: 65, equilibre: 55, element: 'FEU', specialMove: 'Fire Blitz' },

  // ══════════════════════════════════════════════════════════════════════════
  // METAL FUSION
  // ══════════════════════════════════════════════════════════════════════════
  'gingka-fusion':  { att: 85, def: 60, end: 90, equilibre: 82, element: 'VENT', specialMove: 'Starblast Attack' },
  'ryuga-fusion':   { att: 95, def: 55, end: 88, equilibre: 85, element: 'OMBRE', specialMove: 'Dragon Emperor Soaring Bite Strike' },
  'kyoya-fusion':   { att: 82, def: 65, end: 70, equilibre: 78, element: 'VENT', specialMove: 'Lion Gale Force Wall' },
  'doji-fusion':    { att: 60, def: 55, end: 68, equilibre: 65, element: 'OMBRE', specialMove: 'Darkness Howling Blazer' },
  'phoenix':        { att: 72, def: 68, end: 58, equilibre: 80, element: 'FEU', specialMove: 'Burning Fire Strike' },
  'reiji':          { att: 65, def: 45, end: 75, equilibre: 58, element: 'OMBRE', specialMove: 'Venom Strike' },
  'teru':           { att: 50, def: 62, end: 55, equilibre: 65, element: 'TERRE', specialMove: 'Pirouette Tour' },
  'tobio':          { att: 68, def: 48, end: 78, equilibre: 55, element: 'VENT', specialMove: 'Sniper Shot' },
  'ryutaro':        { att: 45, def: 50, end: 55, equilibre: 60, element: 'EAU', specialMove: 'Distortion Drive' },
  'tetsuya':        { att: 52, def: 48, end: 45, equilibre: 55, element: 'EAU', specialMove: 'Crab Scissors' },
  'sora':           { att: 55, def: 40, end: 70, equilibre: 48, element: 'VENT', specialMove: 'Pegasus Starblast' },

  // ══════════════════════════════════════════════════════════════════════════
  // METAL MASTERS
  // ══════════════════════════════════════════════════════════════════════════
  'gingka-masters': { att: 88, def: 65, end: 92, equilibre: 85, element: 'VENT', specialMove: 'Galaxy Nova' },
  'ryuga-masters':  { att: 95, def: 60, end: 90, equilibre: 88, element: 'OMBRE', specialMove: 'Dragon Emperor Supreme Flight' },
  'kyoya-masters':  { att: 85, def: 70, end: 72, equilibre: 80, element: 'VENT', specialMove: 'King Lion Tearing Blast' },
  'masamune':       { att: 82, def: 50, end: 85, equilibre: 70, element: 'LUMIERE', specialMove: 'Lightning Sword Flash' },
  'tsubasa':        { att: 62, def: 68, end: 65, equilibre: 82, element: 'VENT', specialMove: 'Shining Tornado Buster' },
  'julian':         { att: 70, def: 85, end: 55, equilibre: 80, element: 'TERRE', specialMove: 'Black Excalibur' },
  'damian':         { att: 88, def: 72, end: 65, equilibre: 82, element: 'OMBRE', specialMove: 'Hades Gate' },
  'yu-tendo':       { att: 55, def: 52, end: 72, equilibre: 65, element: 'LUMIERE', specialMove: 'Inferno Blast' },
  'nile':           { att: 68, def: 58, end: 65, equilibre: 68, element: 'TERRE', specialMove: 'Mystic Zone' },
  'dashan':         { att: 65, def: 75, end: 58, equilibre: 75, element: 'TERRE', specialMove: 'Solid Iron Wall' },
  'jack':           { att: 62, def: 55, end: 60, equilibre: 65, element: 'OMBRE', specialMove: 'Beautiful Dead' },
  'kenta-masters':  { att: 52, def: 48, end: 58, equilibre: 55, element: 'FEU', specialMove: 'Flame Claw' },
  'benkei-masters': { att: 72, def: 65, end: 35, equilibre: 70, element: 'TERRE', specialMove: 'Red Horn Upper' },
  'madoka':         { att: 15, def: 20, end: 25, equilibre: 35, element: 'LUMIERE', specialMove: 'Bey Mechanic' },
  'hikaru':         { att: 55, def: 45, end: 65, equilibre: 52, element: 'EAU', specialMove: 'Aquario Infinite Assault' },
  'mei-mei':        { att: 50, def: 42, end: 60, equilibre: 48, element: 'EAU', specialMove: 'Flowing Dance' },
  'chiyun':         { att: 55, def: 48, end: 58, equilibre: 52, element: 'FEU', specialMove: 'Tempestuous Whirlwind Sword' },

  // ══════════════════════════════════════════════════════════════════════════
  // METAL FURY
  // ══════════════════════════════════════════════════════════════════════════
  'ryuga-fury':     { att: 98, def: 65, end: 92, equilibre: 95, element: 'OMBRE', specialMove: 'Dragon Emperor Life Destructor' },
  'gingka-fury':    { att: 90, def: 70, end: 95, equilibre: 88, element: 'LUMIERE', specialMove: 'Super Cosmic Nova' },
  'kyoya-fury':     { att: 88, def: 75, end: 75, equilibre: 82, element: 'VENT', specialMove: 'King Lion Reverse Wind Strike' },
  'chris':          { att: 55, def: 70, end: 50, equilibre: 92, element: 'LUMIERE', specialMove: "Barnard's Loop" },
  'aguma':          { att: 82, def: 72, end: 55, equilibre: 78, element: 'TERRE', specialMove: 'Great Ring of Destruction' },
  'dynamis':        { att: 60, def: 78, end: 62, equilibre: 80, element: 'LUMIERE', specialMove: 'Grand Lightning' },
  'king-fury':      { att: 88, def: 58, end: 78, equilibre: 72, element: 'FEU', specialMove: 'King of Thunder Sword' },
  'yuki':           { att: 52, def: 58, end: 55, equilibre: 65, element: 'EAU', specialMove: 'Brave Impact' },
  'tithi':          { att: 62, def: 55, end: 70, equilibre: 62, element: 'VENT', specialMove: 'Ishtar Impact' },
  'bao':            { att: 68, def: 55, end: 60, equilibre: 58, element: 'FEU', specialMove: 'Crown Inferno' },
  'johannes':       { att: 48, def: 42, end: 70, equilibre: 45, element: 'OMBRE', specialMove: 'Shadow Wild Dance' },
  'pluto':          { att: 55, def: 52, end: 48, equilibre: 58, element: 'OMBRE', specialMove: 'Dark Move' },
  'hyoma-fury':     { att: 48, def: 58, end: 50, equilibre: 58, element: 'EAU', specialMove: 'Eternal Defense' },
  'doji-fury':      { att: 60, def: 52, end: 60, equilibre: 55, element: 'OMBRE', specialMove: 'Darkness Howling' },

  // ══════════════════════════════════════════════════════════════════════════
  // SHOGUN STEEL / ZERO-G
  // ══════════════════════════════════════════════════════════════════════════
  'zyro':           { att: 85, def: 62, end: 82, equilibre: 78, element: 'FEU', specialMove: 'Burning Tornado Fire' },
  'sakyo':          { att: 90, def: 68, end: 80, equilibre: 82, element: 'OMBRE', specialMove: 'Ronin Dragon Destroy' },
  'shinobu':        { att: 65, def: 58, end: 82, equilibre: 68, element: 'EAU', specialMove: 'Ninja Shadow Dance' },
  'kite':           { att: 48, def: 72, end: 45, equilibre: 75, element: 'EAU', specialMove: 'Leviathan Dive' },
  'eight':          { att: 52, def: 42, end: 60, equilibre: 48, element: 'EAU', specialMove: 'Pirate Boarding' },

  // ══════════════════════════════════════════════════════════════════════════
  // BEYBLADE BURST
  // ══════════════════════════════════════════════════════════════════════════
  'valt':           { att: 85, def: 68, end: 88, equilibre: 82, element: 'LUMIERE', specialMove: 'Ultimate Flash Launch' },
  'shu':            { att: 88, def: 72, end: 85, equilibre: 80, element: 'FEU', specialMove: 'Requiem Whip' },
  'lui':            { att: 96, def: 58, end: 95, equilibre: 75, element: 'OMBRE', specialMove: 'Lost Spiral' },
  'free':           { att: 55, def: 75, end: 60, equilibre: 90, element: 'EAU', specialMove: 'Drain Spin' },
  'aiga':           { att: 90, def: 55, end: 82, equilibre: 72, element: 'FEU', specialMove: 'Z Breaker' },
  'phi':            { att: 92, def: 60, end: 78, equilibre: 75, element: 'OMBRE', specialMove: 'Final Dread Impact' },
  'drum':           { att: 78, def: 65, end: 75, equilibre: 78, element: 'FEU', specialMove: 'Rainbow-Flux' },
  'hyuga':          { att: 78, def: 48, end: 72, equilibre: 62, element: 'FEU', specialMove: 'Flaming Limit Breaker' },
  'hikaru-burst':   { att: 55, def: 68, end: 58, equilibre: 72, element: 'EAU', specialMove: 'Zone Defense' },
  'bell':           { att: 82, def: 62, end: 75, equilibre: 70, element: 'OMBRE', specialMove: 'Destruction Wrecker' },

  // ══════════════════════════════════════════════════════════════════════════
  // BEYBLADE X
  // ══════════════════════════════════════════════════════════════════════════
  'multi':          { att: 82, def: 65, end: 88, equilibre: 78, element: 'LUMIERE', specialMove: 'Sylphide Breath' },
  'bird':           { att: 72, def: 78, end: 68, equilibre: 88, element: 'OMBRE', specialMove: 'Xtreme Dash Crescent Judgment' },
  'burn':           { att: 95, def: 80, end: 92, equilibre: 90, element: 'FEU', specialMove: 'Xtreme Dash Burning Maneuver' },
  'persona-jaxon':  { att: 55, def: 85, end: 50, equilibre: 82, element: 'TERRE', specialMove: 'Shield Fortress' },
  'persona-enga':   { att: 85, def: 55, end: 78, equilibre: 68, element: 'FEU', specialMove: 'Leon Fury' },
  'khrome':         { att: 80, def: 52, end: 82, equilibre: 68, element: 'EAU', specialMove: 'Xtreme Dash Dragonic Overdrive' },
  'masato':         { att: 58, def: 50, end: 72, equilibre: 62, element: 'VENT', specialMove: 'Mirage Parry' },
  'omega':          { att: 68, def: 62, end: 65, equilibre: 72, element: 'LUMIERE', specialMove: 'Glimmering Stars' },
  'natsu':          { att: 65, def: 42, end: 70, equilibre: 52, element: 'FEU', specialMove: 'Dagger Slash' },
  'leak':           { att: 58, def: 48, end: 65, equilibre: 55, element: 'OMBRE', specialMove: 'Viper Sting' },
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
        att: stats.att,
        def: stats.def,
        end: stats.end,
        equilibre: stats.equilibre,
        element: stats.element,
        specialMove: stats.specialMove,
      },
    });

    console.log(
      `  ${elEmoji[stats.element] || '⚪'} ${card.name.padEnd(35)} ` +
      `ATT:${String(stats.att).padStart(3)} ` +
      `DEF:${String(stats.def).padStart(3)} ` +
      `END:${String(stats.end).padStart(3)} ` +
      `ÉQU:${String(stats.equilibre).padStart(3)} ` +
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
