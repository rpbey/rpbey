/**
 * Seed TCG stats (ATT/DEF/END/ÉQU + element) for all gacha cards
 * Stats are based on rarity tier + character archetype
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Base stats by rarity
const RARITY_BASE: Record<string, { att: number; def: number; end: number; equilibre: number }> = {
  COMMON:    { att: 30, def: 25, end: 25, equilibre: 200 },
  RARE:      { att: 45, def: 40, end: 40, equilibre: 320 },
  EPIC:      { att: 65, def: 55, end: 55, equilibre: 480 },
  LEGENDARY: { att: 85, def: 75, end: 75, equilibre: 650 },
  SECRET:    { att: 95, def: 85, end: 90, equilibre: 800 },
};

// Character archetypes with stat modifiers and element
interface Archetype {
  attMod: number; defMod: number; endMod: number; equilibreMod: number;
  element: string;
}

const CHAR_ARCHETYPES: Record<string, Archetype> = {
  // ── BAKUTEN ──
  'tyson':          { attMod: 1.3, defMod: 0.9, endMod: 1.1, equilibreMod: 1.0, element: 'VENT' },    // Dragoon = wind dragon
  'kai':            { attMod: 1.2, defMod: 1.0, endMod: 1.2, equilibreMod: 0.9, element: 'FEU' },      // Dranzer = fire phoenix
  'ray':            { attMod: 1.1, defMod: 0.9, endMod: 1.3, equilibreMod: 0.9, element: 'VENT' },     // Driger = agile tiger
  'max':            { attMod: 0.7, defMod: 1.5, endMod: 0.8, equilibreMod: 1.3, element: 'EAU' },      // Draciel = water fortress
  'brooklyn':       { attMod: 1.4, defMod: 1.0, endMod: 1.1, equilibreMod: 1.1, element: 'OMBRE' },    // Zeus = dark power
  'tala':           { attMod: 1.1, defMod: 1.1, endMod: 1.0, equilibreMod: 1.1, element: 'EAU' },      // Wolborg = ice wolf
  'ozuma':          { attMod: 1.0, defMod: 1.0, endMod: 1.2, equilibreMod: 1.0, element: 'TERRE' },
  'daichi':         { attMod: 1.2, defMod: 1.0, endMod: 0.9, equilibreMod: 1.1, element: 'TERRE' },
  'robert':         { attMod: 0.9, defMod: 1.2, endMod: 1.0, equilibreMod: 1.1, element: 'VENT' },
  'kenny-bakuten':  { attMod: 0.6, defMod: 0.8, endMod: 1.0, equilibreMod: 1.0, element: 'NEUTRAL' },
  'hilary':         { attMod: 0.5, defMod: 0.7, endMod: 1.0, equilibreMod: 1.2, element: 'LUMIERE' },
  'mariam':         { attMod: 1.0, defMod: 0.9, endMod: 1.1, equilibreMod: 1.0, element: 'EAU' },
  'lee-bakuten':    { attMod: 1.1, defMod: 1.0, endMod: 1.0, equilibreMod: 1.0, element: 'TERRE' },
  'michael':        { attMod: 1.0, defMod: 0.9, endMod: 1.1, equilibreMod: 1.0, element: 'VENT' },
  'johnny':         { attMod: 1.2, defMod: 0.8, endMod: 1.0, equilibreMod: 0.9, element: 'FEU' },

  // ── METAL FUSION ──
  'gingka-fusion':  { attMod: 1.2, defMod: 0.9, endMod: 1.2, equilibreMod: 1.0, element: 'VENT' },
  'ryuga-fusion':   { attMod: 1.4, defMod: 0.8, endMod: 1.1, equilibreMod: 1.0, element: 'OMBRE' },
  'kyoya-fusion':   { attMod: 1.2, defMod: 1.1, endMod: 1.0, equilibreMod: 1.0, element: 'VENT' },
  'doji-fusion':    { attMod: 1.0, defMod: 0.9, endMod: 1.0, equilibreMod: 1.0, element: 'OMBRE' },
  'phoenix':        { attMod: 1.1, defMod: 1.0, endMod: 1.0, equilibreMod: 1.1, element: 'FEU' },
  'reiji':          { attMod: 1.1, defMod: 0.8, endMod: 1.2, equilibreMod: 0.9, element: 'OMBRE' },
  'teru':           { attMod: 0.8, defMod: 1.0, endMod: 1.3, equilibreMod: 0.9, element: 'TERRE' },
  'tobio':          { attMod: 1.0, defMod: 0.8, endMod: 1.2, equilibreMod: 0.9, element: 'TERRE' },
  'ryutaro':        { attMod: 0.8, defMod: 0.9, endMod: 1.0, equilibreMod: 1.1, element: 'EAU' },
  'tetsuya':        { attMod: 0.9, defMod: 1.0, endMod: 0.9, equilibreMod: 1.1, element: 'EAU' },
  'sora':           { attMod: 0.9, defMod: 0.8, endMod: 1.1, equilibreMod: 1.0, element: 'VENT' },

  // ── METAL MASTERS ──
  'gingka-masters': { attMod: 1.2, defMod: 1.0, endMod: 1.2, equilibreMod: 1.0, element: 'VENT' },
  'ryuga-masters':  { attMod: 1.4, defMod: 0.8, endMod: 1.2, equilibreMod: 0.9, element: 'OMBRE' },
  'kyoya-masters':  { attMod: 1.3, defMod: 1.0, endMod: 1.0, equilibreMod: 1.0, element: 'VENT' },
  'masamune':       { attMod: 1.2, defMod: 0.8, endMod: 1.3, equilibreMod: 0.8, element: 'LUMIERE' },
  'tsubasa':        { attMod: 0.9, defMod: 1.1, endMod: 1.0, equilibreMod: 1.2, element: 'VENT' },
  'julian':         { attMod: 1.0, defMod: 1.3, endMod: 0.8, equilibreMod: 1.2, element: 'TERRE' },
  'damian':         { attMod: 1.3, defMod: 1.0, endMod: 0.9, equilibreMod: 1.1, element: 'OMBRE' },
  'yu-tendo':       { attMod: 0.9, defMod: 0.9, endMod: 1.2, equilibreMod: 1.0, element: 'LUMIERE' },
  'nile':           { attMod: 1.1, defMod: 1.0, endMod: 1.0, equilibreMod: 1.0, element: 'TERRE' },
  'dashan':         { attMod: 1.0, defMod: 1.2, endMod: 1.0, equilibreMod: 1.1, element: 'TERRE' },
  'jack':           { attMod: 0.9, defMod: 0.8, endMod: 1.1, equilibreMod: 1.0, element: 'OMBRE' },
  'kenta-masters':  { attMod: 0.8, defMod: 0.9, endMod: 1.0, equilibreMod: 1.1, element: 'FEU' },
  'benkei-masters': { attMod: 1.1, defMod: 1.1, endMod: 0.7, equilibreMod: 1.3, element: 'TERRE' },
  'madoka':         { attMod: 0.5, defMod: 0.7, endMod: 1.0, equilibreMod: 1.2, element: 'LUMIERE' },
  'hikaru':         { attMod: 0.9, defMod: 0.9, endMod: 1.1, equilibreMod: 1.0, element: 'EAU' },
  'mei-mei':        { attMod: 0.9, defMod: 0.8, endMod: 1.2, equilibreMod: 0.9, element: 'EAU' },
  'chiyun':         { attMod: 0.8, defMod: 1.0, endMod: 1.0, equilibreMod: 1.0, element: 'FEU' },

  // ── METAL FURY ──
  'ryuga-fury':     { attMod: 1.5, defMod: 0.8, endMod: 1.2, equilibreMod: 1.0, element: 'OMBRE' },
  'gingka-fury':    { attMod: 1.3, defMod: 1.0, endMod: 1.2, equilibreMod: 1.0, element: 'LUMIERE' },
  'kyoya-fury':     { attMod: 1.3, defMod: 1.1, endMod: 1.0, equilibreMod: 1.0, element: 'VENT' },
  'chris':          { attMod: 0.8, defMod: 1.0, endMod: 0.9, equilibreMod: 1.4, element: 'LUMIERE' },
  'aguma':          { attMod: 1.2, defMod: 1.2, endMod: 0.8, equilibreMod: 1.1, element: 'TERRE' },
  'dynamis':        { attMod: 0.9, defMod: 1.3, endMod: 0.9, equilibreMod: 1.2, element: 'LUMIERE' },
  'king-fury':      { attMod: 1.3, defMod: 0.9, endMod: 1.1, equilibreMod: 1.0, element: 'FEU' },
  'yuki':           { attMod: 0.8, defMod: 1.0, endMod: 1.1, equilibreMod: 1.1, element: 'EAU' },
  'tithi':          { attMod: 1.0, defMod: 0.9, endMod: 1.2, equilibreMod: 1.0, element: 'VENT' },
  'bao':            { attMod: 1.1, defMod: 1.0, endMod: 0.9, equilibreMod: 1.0, element: 'FEU' },
  'johannes':       { attMod: 0.9, defMod: 0.8, endMod: 1.3, equilibreMod: 0.8, element: 'OMBRE' },
  'pluto':          { attMod: 1.0, defMod: 1.0, endMod: 0.8, equilibreMod: 1.1, element: 'OMBRE' },
  'hyoma-fury':     { attMod: 0.8, defMod: 1.1, endMod: 0.9, equilibreMod: 1.1, element: 'EAU' },
  'doji-fury':      { attMod: 1.0, defMod: 0.9, endMod: 1.0, equilibreMod: 1.0, element: 'OMBRE' },

  // ── SHOGUN STEEL ──
  'zyro':           { attMod: 1.3, defMod: 0.9, endMod: 1.1, equilibreMod: 1.0, element: 'FEU' },
  'sakyo':          { attMod: 1.4, defMod: 0.9, endMod: 1.1, equilibreMod: 0.9, element: 'OMBRE' },
  'shinobu':        { attMod: 1.0, defMod: 0.9, endMod: 1.4, equilibreMod: 0.9, element: 'EAU' },
  'kite':           { attMod: 0.8, defMod: 1.3, endMod: 0.9, equilibreMod: 1.2, element: 'EAU' },
  'eight':          { attMod: 1.0, defMod: 0.8, endMod: 1.1, equilibreMod: 1.0, element: 'EAU' },

  // ── BURST ──
  'valt':           { attMod: 1.2, defMod: 1.0, endMod: 1.2, equilibreMod: 1.0, element: 'LUMIERE' },
  'shu':            { attMod: 1.3, defMod: 1.0, endMod: 1.1, equilibreMod: 1.0, element: 'FEU' },
  'lui':            { attMod: 1.5, defMod: 0.7, endMod: 1.3, equilibreMod: 0.8, element: 'OMBRE' },
  'free':           { attMod: 0.8, defMod: 1.2, endMod: 0.9, equilibreMod: 1.4, element: 'EAU' },
  'aiga':           { attMod: 1.4, defMod: 0.8, endMod: 1.2, equilibreMod: 0.9, element: 'FEU' },
  'phi':            { attMod: 1.3, defMod: 0.9, endMod: 1.1, equilibreMod: 1.0, element: 'OMBRE' },
  'drum':           { attMod: 1.1, defMod: 1.0, endMod: 1.1, equilibreMod: 1.1, element: 'FEU' },
  'hyuga':          { attMod: 1.2, defMod: 0.8, endMod: 1.1, equilibreMod: 1.0, element: 'FEU' },
  'hikaru-burst':   { attMod: 0.9, defMod: 1.2, endMod: 1.0, equilibreMod: 1.1, element: 'EAU' },
  'bell':           { attMod: 1.1, defMod: 1.0, endMod: 1.0, equilibreMod: 1.1, element: 'OMBRE' },

  // ── BEYBLADE X ──
  'multi':          { attMod: 1.2, defMod: 1.0, endMod: 1.2, equilibreMod: 1.0, element: 'LUMIERE' },
  'bird':           { attMod: 0.9, defMod: 1.0, endMod: 1.0, equilibreMod: 1.3, element: 'OMBRE' },
  'burn':           { attMod: 1.3, defMod: 1.1, endMod: 1.2, equilibreMod: 1.0, element: 'FEU' },
  'persona-jaxon':  { attMod: 0.8, defMod: 1.4, endMod: 0.8, equilibreMod: 1.3, element: 'TERRE' },
  'persona-enga':   { attMod: 1.3, defMod: 0.9, endMod: 1.1, equilibreMod: 0.9, element: 'FEU' },
  'khrome':         { attMod: 1.2, defMod: 0.8, endMod: 1.4, equilibreMod: 0.8, element: 'EAU' },
  'masato':         { attMod: 1.0, defMod: 0.9, endMod: 1.1, equilibreMod: 1.0, element: 'VENT' },
  'omega':          { attMod: 1.1, defMod: 1.0, endMod: 1.0, equilibreMod: 1.1, element: 'LUMIERE' },
  'natsu':          { attMod: 1.1, defMod: 0.8, endMod: 1.2, equilibreMod: 0.8, element: 'FEU' },
  'leak':           { attMod: 0.9, defMod: 0.9, endMod: 1.1, equilibreMod: 1.0, element: 'OMBRE' },
};

// Default archetype for cards not in the map
const DEFAULT: Archetype = { attMod: 1.0, defMod: 1.0, endMod: 1.0, equilibreMod: 1.0, element: 'NEUTRAL' };

async function main() {
  console.log('⚔️ Seeding TCG stats for all cards...\n');

  const cards = await prisma.gachaCard.findMany();
  let updated = 0;

  for (const card of cards) {
    const base = RARITY_BASE[card.rarity] || RARITY_BASE.COMMON!;
    const arch = CHAR_ARCHETYPES[card.slug] || DEFAULT;

    // Add small random variance (±5%) for uniqueness
    const v = () => 0.95 + Math.random() * 0.1;

    const att = Math.round(base.att * arch.attMod * v());
    const def = Math.round(base.def * arch.defMod * v());
    const end = Math.round(base.end * arch.endMod * v());
    const equilibre = Math.round(base.equilibre * arch.equilibreMod * v());

    await prisma.gachaCard.update({
      where: { id: card.id },
      data: { att, def, end, equilibre, element: arch.element },
    });

    const elEmoji: Record<string, string> = { FEU: '🔥', EAU: '💧', TERRE: '🌍', VENT: '🌪️', OMBRE: '🌑', LUMIERE: '✨', NEUTRAL: '⚪' };
    console.log(`  ${elEmoji[arch.element] || '⚪'} ${card.name.padEnd(30)} ATT:${String(att).padStart(3)} DEF:${String(def).padStart(3)} END:${String(end).padStart(3)} ÉQU:${String(equilibre).padStart(4)}`);
    updated++;
  }

  console.log(`\n✅ ${updated} cartes mises à jour avec stats TCG.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
