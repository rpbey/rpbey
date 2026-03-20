/**
 * Seed TCG stats (ATK/DEF/SPD/HP + element) for all gacha cards
 * Stats are based on rarity tier + character archetype
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Base stats by rarity
const RARITY_BASE: Record<string, { atk: number; def: number; spd: number; hp: number }> = {
  COMMON:    { atk: 30, def: 25, spd: 25, hp: 200 },
  RARE:      { atk: 45, def: 40, spd: 40, hp: 320 },
  EPIC:      { atk: 65, def: 55, spd: 55, hp: 480 },
  LEGENDARY: { atk: 85, def: 75, spd: 75, hp: 650 },
  SECRET:    { atk: 95, def: 85, spd: 90, hp: 800 },
};

// Character archetypes with stat modifiers and element
interface Archetype {
  atkMod: number; defMod: number; spdMod: number; hpMod: number;
  element: string;
}

const CHAR_ARCHETYPES: Record<string, Archetype> = {
  // ── BAKUTEN ──
  'tyson':          { atkMod: 1.3, defMod: 0.9, spdMod: 1.1, hpMod: 1.0, element: 'VENT' },    // Dragoon = wind dragon
  'kai':            { atkMod: 1.2, defMod: 1.0, spdMod: 1.2, hpMod: 0.9, element: 'FEU' },      // Dranzer = fire phoenix
  'ray':            { atkMod: 1.1, defMod: 0.9, spdMod: 1.3, hpMod: 0.9, element: 'VENT' },     // Driger = agile tiger
  'max':            { atkMod: 0.7, defMod: 1.5, spdMod: 0.8, hpMod: 1.3, element: 'EAU' },      // Draciel = water fortress
  'brooklyn':       { atkMod: 1.4, defMod: 1.0, spdMod: 1.1, hpMod: 1.1, element: 'OMBRE' },    // Zeus = dark power
  'tala':           { atkMod: 1.1, defMod: 1.1, spdMod: 1.0, hpMod: 1.1, element: 'EAU' },      // Wolborg = ice wolf
  'ozuma':          { atkMod: 1.0, defMod: 1.0, spdMod: 1.2, hpMod: 1.0, element: 'TERRE' },
  'daichi':         { atkMod: 1.2, defMod: 1.0, spdMod: 0.9, hpMod: 1.1, element: 'TERRE' },
  'robert':         { atkMod: 0.9, defMod: 1.2, spdMod: 1.0, hpMod: 1.1, element: 'VENT' },
  'kenny-bakuten':  { atkMod: 0.6, defMod: 0.8, spdMod: 1.0, hpMod: 1.0, element: 'NEUTRAL' },
  'hilary':         { atkMod: 0.5, defMod: 0.7, spdMod: 1.0, hpMod: 1.2, element: 'LUMIERE' },
  'mariam':         { atkMod: 1.0, defMod: 0.9, spdMod: 1.1, hpMod: 1.0, element: 'EAU' },
  'lee-bakuten':    { atkMod: 1.1, defMod: 1.0, spdMod: 1.0, hpMod: 1.0, element: 'TERRE' },
  'michael':        { atkMod: 1.0, defMod: 0.9, spdMod: 1.1, hpMod: 1.0, element: 'VENT' },
  'johnny':         { atkMod: 1.2, defMod: 0.8, spdMod: 1.0, hpMod: 0.9, element: 'FEU' },

  // ── METAL FUSION ──
  'gingka-fusion':  { atkMod: 1.2, defMod: 0.9, spdMod: 1.2, hpMod: 1.0, element: 'VENT' },
  'ryuga-fusion':   { atkMod: 1.4, defMod: 0.8, spdMod: 1.1, hpMod: 1.0, element: 'OMBRE' },
  'kyoya-fusion':   { atkMod: 1.2, defMod: 1.1, spdMod: 1.0, hpMod: 1.0, element: 'VENT' },
  'doji-fusion':    { atkMod: 1.0, defMod: 0.9, spdMod: 1.0, hpMod: 1.0, element: 'OMBRE' },
  'phoenix':        { atkMod: 1.1, defMod: 1.0, spdMod: 1.0, hpMod: 1.1, element: 'FEU' },
  'reiji':          { atkMod: 1.1, defMod: 0.8, spdMod: 1.2, hpMod: 0.9, element: 'OMBRE' },
  'teru':           { atkMod: 0.8, defMod: 1.0, spdMod: 1.3, hpMod: 0.9, element: 'TERRE' },
  'tobio':          { atkMod: 1.0, defMod: 0.8, spdMod: 1.2, hpMod: 0.9, element: 'TERRE' },
  'ryutaro':        { atkMod: 0.8, defMod: 0.9, spdMod: 1.0, hpMod: 1.1, element: 'EAU' },
  'tetsuya':        { atkMod: 0.9, defMod: 1.0, spdMod: 0.9, hpMod: 1.1, element: 'EAU' },
  'sora':           { atkMod: 0.9, defMod: 0.8, spdMod: 1.1, hpMod: 1.0, element: 'VENT' },

  // ── METAL MASTERS ──
  'gingka-masters': { atkMod: 1.2, defMod: 1.0, spdMod: 1.2, hpMod: 1.0, element: 'VENT' },
  'ryuga-masters':  { atkMod: 1.4, defMod: 0.8, spdMod: 1.2, hpMod: 0.9, element: 'OMBRE' },
  'kyoya-masters':  { atkMod: 1.3, defMod: 1.0, spdMod: 1.0, hpMod: 1.0, element: 'VENT' },
  'masamune':       { atkMod: 1.2, defMod: 0.8, spdMod: 1.3, hpMod: 0.8, element: 'LUMIERE' },
  'tsubasa':        { atkMod: 0.9, defMod: 1.1, spdMod: 1.0, hpMod: 1.2, element: 'VENT' },
  'julian':         { atkMod: 1.0, defMod: 1.3, spdMod: 0.8, hpMod: 1.2, element: 'TERRE' },
  'damian':         { atkMod: 1.3, defMod: 1.0, spdMod: 0.9, hpMod: 1.1, element: 'OMBRE' },
  'yu-tendo':       { atkMod: 0.9, defMod: 0.9, spdMod: 1.2, hpMod: 1.0, element: 'LUMIERE' },
  'nile':           { atkMod: 1.1, defMod: 1.0, spdMod: 1.0, hpMod: 1.0, element: 'TERRE' },
  'dashan':         { atkMod: 1.0, defMod: 1.2, spdMod: 1.0, hpMod: 1.1, element: 'TERRE' },
  'jack':           { atkMod: 0.9, defMod: 0.8, spdMod: 1.1, hpMod: 1.0, element: 'OMBRE' },
  'kenta-masters':  { atkMod: 0.8, defMod: 0.9, spdMod: 1.0, hpMod: 1.1, element: 'FEU' },
  'benkei-masters': { atkMod: 1.1, defMod: 1.1, spdMod: 0.7, hpMod: 1.3, element: 'TERRE' },
  'madoka':         { atkMod: 0.5, defMod: 0.7, spdMod: 1.0, hpMod: 1.2, element: 'LUMIERE' },
  'hikaru':         { atkMod: 0.9, defMod: 0.9, spdMod: 1.1, hpMod: 1.0, element: 'EAU' },
  'mei-mei':        { atkMod: 0.9, defMod: 0.8, spdMod: 1.2, hpMod: 0.9, element: 'EAU' },
  'chiyun':         { atkMod: 0.8, defMod: 1.0, spdMod: 1.0, hpMod: 1.0, element: 'FEU' },

  // ── METAL FURY ──
  'ryuga-fury':     { atkMod: 1.5, defMod: 0.8, spdMod: 1.2, hpMod: 1.0, element: 'OMBRE' },
  'gingka-fury':    { atkMod: 1.3, defMod: 1.0, spdMod: 1.2, hpMod: 1.0, element: 'LUMIERE' },
  'kyoya-fury':     { atkMod: 1.3, defMod: 1.1, spdMod: 1.0, hpMod: 1.0, element: 'VENT' },
  'chris':          { atkMod: 0.8, defMod: 1.0, spdMod: 0.9, hpMod: 1.4, element: 'LUMIERE' },
  'aguma':          { atkMod: 1.2, defMod: 1.2, spdMod: 0.8, hpMod: 1.1, element: 'TERRE' },
  'dynamis':        { atkMod: 0.9, defMod: 1.3, spdMod: 0.9, hpMod: 1.2, element: 'LUMIERE' },
  'king-fury':      { atkMod: 1.3, defMod: 0.9, spdMod: 1.1, hpMod: 1.0, element: 'FEU' },
  'yuki':           { atkMod: 0.8, defMod: 1.0, spdMod: 1.1, hpMod: 1.1, element: 'EAU' },
  'tithi':          { atkMod: 1.0, defMod: 0.9, spdMod: 1.2, hpMod: 1.0, element: 'VENT' },
  'bao':            { atkMod: 1.1, defMod: 1.0, spdMod: 0.9, hpMod: 1.0, element: 'FEU' },
  'johannes':       { atkMod: 0.9, defMod: 0.8, spdMod: 1.3, hpMod: 0.8, element: 'OMBRE' },
  'pluto':          { atkMod: 1.0, defMod: 1.0, spdMod: 0.8, hpMod: 1.1, element: 'OMBRE' },
  'hyoma-fury':     { atkMod: 0.8, defMod: 1.1, spdMod: 0.9, hpMod: 1.1, element: 'EAU' },
  'doji-fury':      { atkMod: 1.0, defMod: 0.9, spdMod: 1.0, hpMod: 1.0, element: 'OMBRE' },

  // ── SHOGUN STEEL ──
  'zyro':           { atkMod: 1.3, defMod: 0.9, spdMod: 1.1, hpMod: 1.0, element: 'FEU' },
  'sakyo':          { atkMod: 1.4, defMod: 0.9, spdMod: 1.1, hpMod: 0.9, element: 'OMBRE' },
  'shinobu':        { atkMod: 1.0, defMod: 0.9, spdMod: 1.4, hpMod: 0.9, element: 'EAU' },
  'kite':           { atkMod: 0.8, defMod: 1.3, spdMod: 0.9, hpMod: 1.2, element: 'EAU' },
  'eight':          { atkMod: 1.0, defMod: 0.8, spdMod: 1.1, hpMod: 1.0, element: 'EAU' },

  // ── BURST ──
  'valt':           { atkMod: 1.2, defMod: 1.0, spdMod: 1.2, hpMod: 1.0, element: 'LUMIERE' },
  'shu':            { atkMod: 1.3, defMod: 1.0, spdMod: 1.1, hpMod: 1.0, element: 'FEU' },
  'lui':            { atkMod: 1.5, defMod: 0.7, spdMod: 1.3, hpMod: 0.8, element: 'OMBRE' },
  'free':           { atkMod: 0.8, defMod: 1.2, spdMod: 0.9, hpMod: 1.4, element: 'EAU' },
  'aiga':           { atkMod: 1.4, defMod: 0.8, spdMod: 1.2, hpMod: 0.9, element: 'FEU' },
  'phi':            { atkMod: 1.3, defMod: 0.9, spdMod: 1.1, hpMod: 1.0, element: 'OMBRE' },
  'drum':           { atkMod: 1.1, defMod: 1.0, spdMod: 1.1, hpMod: 1.1, element: 'FEU' },
  'hyuga':          { atkMod: 1.2, defMod: 0.8, spdMod: 1.1, hpMod: 1.0, element: 'FEU' },
  'hikaru-burst':   { atkMod: 0.9, defMod: 1.2, spdMod: 1.0, hpMod: 1.1, element: 'EAU' },
  'bell':           { atkMod: 1.1, defMod: 1.0, spdMod: 1.0, hpMod: 1.1, element: 'OMBRE' },

  // ── BEYBLADE X ──
  'multi':          { atkMod: 1.2, defMod: 1.0, spdMod: 1.2, hpMod: 1.0, element: 'LUMIERE' },
  'bird':           { atkMod: 0.9, defMod: 1.0, spdMod: 1.0, hpMod: 1.3, element: 'OMBRE' },
  'burn':           { atkMod: 1.3, defMod: 1.1, spdMod: 1.2, hpMod: 1.0, element: 'FEU' },
  'persona-jaxon':  { atkMod: 0.8, defMod: 1.4, spdMod: 0.8, hpMod: 1.3, element: 'TERRE' },
  'persona-enga':   { atkMod: 1.3, defMod: 0.9, spdMod: 1.1, hpMod: 0.9, element: 'FEU' },
  'khrome':         { atkMod: 1.2, defMod: 0.8, spdMod: 1.4, hpMod: 0.8, element: 'EAU' },
  'masato':         { atkMod: 1.0, defMod: 0.9, spdMod: 1.1, hpMod: 1.0, element: 'VENT' },
  'omega':          { atkMod: 1.1, defMod: 1.0, spdMod: 1.0, hpMod: 1.1, element: 'LUMIERE' },
  'natsu':          { atkMod: 1.1, defMod: 0.8, spdMod: 1.2, hpMod: 0.8, element: 'FEU' },
  'leak':           { atkMod: 0.9, defMod: 0.9, spdMod: 1.1, hpMod: 1.0, element: 'OMBRE' },
};

// Default archetype for cards not in the map
const DEFAULT: Archetype = { atkMod: 1.0, defMod: 1.0, spdMod: 1.0, hpMod: 1.0, element: 'NEUTRAL' };

async function main() {
  console.log('⚔️ Seeding TCG stats for all cards...\n');

  const cards = await prisma.gachaCard.findMany();
  let updated = 0;

  for (const card of cards) {
    const base = RARITY_BASE[card.rarity] || RARITY_BASE.COMMON!;
    const arch = CHAR_ARCHETYPES[card.slug] || DEFAULT;

    // Add small random variance (±5%) for uniqueness
    const v = () => 0.95 + Math.random() * 0.1;

    const atk = Math.round(base.atk * arch.atkMod * v());
    const def = Math.round(base.def * arch.defMod * v());
    const spd = Math.round(base.spd * arch.spdMod * v());
    const hp = Math.round(base.hp * arch.hpMod * v());

    await prisma.gachaCard.update({
      where: { id: card.id },
      data: { atk, def, spd, hp, element: arch.element },
    });

    const elEmoji: Record<string, string> = { FEU: '🔥', EAU: '💧', TERRE: '🌍', VENT: '🌪️', OMBRE: '🌑', LUMIERE: '✨', NEUTRAL: '⚪' };
    console.log(`  ${elEmoji[arch.element] || '⚪'} ${card.name.padEnd(30)} ATK:${String(atk).padStart(3)} DEF:${String(def).padStart(3)} SPD:${String(spd).padStart(3)} HP:${String(hp).padStart(4)}`);
    updated++;
  }

  console.log(`\n✅ ${updated} cartes mises à jour avec stats TCG.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
