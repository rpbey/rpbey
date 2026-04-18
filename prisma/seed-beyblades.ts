/**
 * Seed script for complete Beyblades (Blade + Ratchet + Bit combinations)
 * Links official products to their component parts
 */

import pg from 'pg'
import { PrismaClient, type BeyType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const { Pool } = pg

// Initialize Prisma with PostgreSQL adapter
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Beyblade data structure
interface BeybladeDef {
  code: string
  name: string
  nameEn?: string
  blade: string // Part externalId
  ratchet: string // Part externalId (e.g., "3-60")
  bit: string // Part externalId
  productCode?: string // Link to Product.code
  beyType?: BeyType
}

// Helper to parse stat string to int (handles "29+", "31-", "35-", etc.)
function parseStatToInt(stat: string | null | undefined): number | null {
  if (!stat) return null
  // Remove any modifier suffix (+, -, =) and parse the number
  const match = stat.match(/^(\d+)/)
  if (!match || !match[1]) return null
  return parseInt(match[1], 10)
}

// All known Beyblades from official products
// Blade codes from Beyblade-EX: DrSw, HlSc, WzAr, KnSh, etc.
const beyblades: BeybladeDef[] = [
  // === BX Line Starters/Boosters ===
  {
    code: 'dran-sword-3-60-f',
    name: 'ドランソード3-60F',
    nameEn: 'Dran Sword 3-60F',
    blade: 'DrSw',
    ratchet: '3-60',
    bit: 'F',
    productCode: 'BX-01',
    beyType: 'ATTACK',
  },
  {
    code: 'hells-scythe-4-60-t',
    name: 'ヘルズサイズ4-60T',
    nameEn: 'Hells Scythe 4-60T',
    blade: 'HlSc',
    ratchet: '4-60',
    bit: 'T',
    productCode: 'BX-02',
    beyType: 'ATTACK',
  },
  {
    code: 'wizard-arrow-4-80-b',
    name: 'ウィザードアロー4-80B',
    nameEn: 'Wizard Arrow 4-80B',
    blade: 'WzAr',
    ratchet: '4-80',
    bit: 'B',
    productCode: 'BX-03',
    beyType: 'STAMINA',
  },
  {
    code: 'knight-shield-3-80-n',
    name: 'ナイトシールド3-80N',
    nameEn: 'Knight Shield 3-80N',
    blade: 'KnSh',
    ratchet: '3-80',
    bit: 'N',
    productCode: 'BX-04',
    beyType: 'DEFENSE',
  },
  {
    code: 'knight-lance-4-80-hn',
    name: 'ナイトランス4-80HN',
    nameEn: 'Knight Lance 4-80HN',
    blade: 'KnLn',
    ratchet: '4-80',
    bit: 'HN',
    productCode: 'BX-13',
    beyType: 'DEFENSE',
  },
  {
    code: 'leon-claw-5-60-p',
    name: 'レオンクロー5-60P',
    nameEn: 'Leon Claw 5-60P',
    blade: 'LnCl',
    ratchet: '5-60',
    bit: 'P',
    productCode: 'BX-15',
    beyType: 'ATTACK',
  },
  {
    code: 'rhino-horn-3-80-s',
    name: 'ライノホーン3-80S',
    nameEn: 'Rhino Horn 3-80S',
    blade: 'RhHr',
    ratchet: '3-80',
    bit: 'S',
    productCode: 'BX-19',
    beyType: 'DEFENSE',
  },
  {
    code: 'phoenix-wing-9-60-gf',
    name: 'フェニックスウイング9-60GF',
    nameEn: 'Phoenix Wing 9-60GF',
    blade: 'PhWn',
    ratchet: '9-60',
    bit: 'GF',
    productCode: 'BX-23',
    beyType: 'ATTACK',
  },
  {
    code: 'unicorn-sting-5-60-gp',
    name: 'ユニコーンスティング5-60GP',
    nameEn: 'Unicorn Sting 5-60GP',
    blade: 'UnSt',
    ratchet: '5-60',
    bit: 'GP',
    productCode: 'BX-26',
    beyType: 'STAMINA',
  },
  {
    code: 'vice-tiger-3-60-u',
    name: 'ヴァイスタイガー3-60U',
    nameEn: 'Vice Tiger 3-60U',
    blade: 'WsTg',
    ratchet: '3-60',
    bit: 'U',
    productCode: 'BX-33',
    beyType: 'ATTACK',
  },
  {
    code: 'cobalt-dragoon-2-60-c',
    name: 'コバルトドラグーン2-60C',
    nameEn: 'Cobalt Dragoon 2-60C',
    blade: 'CbDg',
    ratchet: '2-60',
    bit: 'C',
    productCode: 'BX-34',
    beyType: 'ATTACK',
  },
  {
    code: 'crimson-garuda-4-70-tp',
    name: 'クリムゾンガルーダ4-70TP',
    nameEn: 'Crimson Garuda 4-70TP',
    blade: 'CrGr',
    ratchet: '4-70',
    bit: 'TP',
    productCode: 'BX-38',
    beyType: 'STAMINA',
  },
  {
    code: 'samurai-calibur-6-70-m',
    name: 'サムライカリバー6-70M',
    nameEn: 'Samurai Calibur 6-70M',
    blade: 'SmCl',
    ratchet: '6-70',
    bit: 'M',
    productCode: 'BX-45',
    beyType: 'ATTACK',
  },
  {
    code: 'tricera-press-m-85-bs',
    name: 'トリケラプレスM-85BS',
    nameEn: 'Tricera Press M-85BS',
    blade: 'TrPr',
    ratchet: 'M-85',
    bit: 'BS',
    productCode: 'BX-44',
    beyType: 'DEFENSE',
  },

  // === UX Line ===
  {
    code: 'dran-buster-1-60-a',
    name: 'ドランバスター1-60A',
    nameEn: 'Dran Buster 1-60A',
    blade: 'DrBs',
    ratchet: '1-60',
    bit: 'A',
    productCode: 'UX-01',
    beyType: 'ATTACK',
  },
  {
    code: 'hells-hammer-3-70-h',
    name: 'ヘルズハンマー3-70H',
    nameEn: 'Hells Hammer 3-70H',
    blade: 'HlHm',
    ratchet: '3-70',
    bit: 'H',
    productCode: 'UX-02',
    beyType: 'ATTACK',
  },
  {
    code: 'wizard-rod-5-70-db',
    name: 'ウィザードロッド5-70DB',
    nameEn: 'Wizard Rod 5-70DB',
    blade: 'WzRd',
    ratchet: '5-70',
    bit: 'DB',
    productCode: 'UX-03',
    beyType: 'BALANCE',
  },
  {
    code: 'leon-crest-7-60-gn',
    name: 'レオンクレスト7-60GN',
    nameEn: 'Leon Crest 7-60GN',
    blade: 'LnCr',
    ratchet: '7-60',
    bit: 'GN',
    productCode: 'UX-06',
    beyType: 'ATTACK',
  },
  {
    code: 'silver-wolf-3-80-fb',
    name: 'シルバーウルフ3-80FB',
    nameEn: 'Silver Wolf 3-80FB',
    blade: 'SlWl',
    ratchet: '3-80',
    bit: 'FB',
    productCode: 'UX-08',
    beyType: 'ATTACK',
  },
  {
    code: 'samurai-saber-2-70-l',
    name: 'サムライセイバー2-70L',
    nameEn: 'Samurai Saber 2-70L',
    blade: 'SmSb',
    ratchet: '2-70',
    bit: 'L',
    productCode: 'UX-09',
    beyType: 'ATTACK',
  },
  {
    code: 'impact-drake-9-60-lr',
    name: 'インパクトドレイク9-60LR',
    nameEn: 'Impact Drake 9-60LR',
    blade: 'ImDr',
    ratchet: '9-60',
    bit: 'LR',
    productCode: 'UX-11',
    beyType: 'BALANCE',
  },
  {
    code: 'golem-rock-1-60-un',
    name: 'ゴーレムロック1-60UN',
    nameEn: 'Golem Rock 1-60UN',
    blade: 'GlRc',
    ratchet: '1-60',
    bit: 'UN',
    productCode: 'UX-13',
    beyType: 'DEFENSE',
  },
  {
    code: 'scorpio-spear-0-70-z',
    name: 'スコーピオスピア0-70Z',
    nameEn: 'Scorpio Spear 0-70Z',
    blade: 'ScSp',
    ratchet: '0-70',
    bit: 'Z',
    productCode: 'UX-14',
    beyType: 'ATTACK',
  },
  {
    code: 'meteor-dragoon-3-70-j',
    name: 'メテオドラグーン3-70J',
    nameEn: 'Meteor Dragoon 3-70J',
    blade: 'MtDg',
    ratchet: '3-70',
    bit: 'J',
    productCode: 'UX-17',
    beyType: 'ATTACK',
  },

  // === CX Line ===
  {
    code: 'dran-brave-s6-60-v',
    name: 'ドランブレイブS6-60V',
    nameEn: 'Dran Brave S6-60V',
    blade: 'DrBv',
    ratchet: 'S6-60',
    bit: 'V',
    productCode: 'CX-01',
    beyType: 'ATTACK',
  },
  {
    code: 'wizard-arc-r4-55-lo',
    name: 'ウィザードアークR4-55LO',
    nameEn: 'Wizard Arc R4-55LO',
    blade: 'WzAc',
    ratchet: 'R4-55',
    bit: 'LO',
    productCode: 'CX-02',
    beyType: 'STAMINA',
  },
  {
    code: 'perseus-dark-b6-80-w',
    name: 'ペルセウスダークB6-80W',
    nameEn: 'Perseus Dark B6-80W',
    blade: 'PsDk',
    ratchet: 'B6-80',
    bit: 'W',
    productCode: 'CX-03',
    beyType: 'BALANCE',
  },
  {
    code: 'pegasus-blast-atr',
    name: 'ペガサスブラストATr',
    nameEn: 'Pegasus Blast ATr',
    blade: 'PgBl',
    ratchet: 'A-Tr',
    bit: 'Tr',
    productCode: 'CX-07',
    beyType: 'ATTACK',
  },
  {
    code: 'sol-eclipse-d5-70-tk',
    name: 'ソルエクリプスD5-70TK',
    nameEn: 'Sol Eclipse D5-70TK',
    blade: 'SlEc',
    ratchet: 'D5-70',
    bit: 'TK',
    productCode: 'CX-09',
    beyType: 'STAMINA',
  },
  {
    code: 'wolf-hunt-f0-60-db',
    name: 'ウルフハントF0-60DB',
    nameEn: 'Wolf Hunt F0-60DB',
    blade: 'WlHt',
    ratchet: 'F0-60',
    bit: 'DB',
    productCode: 'CX-10',
    beyType: 'ATTACK',
  },
]

async function seedBeyblades() {
  console.log('🌀 Seeding Beyblades (complete combinations)...\n')

  let created = 0
  let updated = 0
  let skipped = 0

  for (const bey of beyblades) {
    // Find the blade part
    const blade = await prisma.part.findFirst({
      where: {
        externalId: bey.blade,
        type: 'BLADE',
      },
    })

    // Find the ratchet part
    const ratchet = await prisma.part.findFirst({
      where: {
        externalId: bey.ratchet,
        type: 'RATCHET',
      },
    })

    // Find the bit part
    const bit = await prisma.part.findFirst({
      where: {
        externalId: bey.bit,
        type: 'BIT',
      },
    })

    // Check if all parts exist
    if (!blade || !ratchet || !bit) {
      console.log(
        `⚠️  Skipping ${bey.code}: missing parts (blade=${!!blade}, ratchet=${!!ratchet}, bit=${!!bit})`
      )
      skipped++
      continue
    }

    // Find the linked product
    const product = bey.productCode
      ? await prisma.product.findUnique({
          where: { code: bey.productCode },
        })
      : null

    // Calculate total stats
    const totalAttack =
      (parseStatToInt(blade.attack) ?? 0) +
      (parseStatToInt(bit.attack) ?? 0)
    const totalDefense =
      (parseStatToInt(blade.defense) ?? 0) +
      (parseStatToInt(bit.defense) ?? 0)
    const totalStamina =
      (parseStatToInt(blade.stamina) ?? 0) +
      (parseStatToInt(bit.stamina) ?? 0)
    const totalBurst = parseStatToInt(blade.burst)
    const totalDash = parseStatToInt(blade.dash)
    const totalWeight =
      (blade.weight ?? 0) + (ratchet.weight ?? 0) + (bit.weight ?? 0)

    const data = {
      code: bey.code,
      name: bey.name,
      nameEn: bey.nameEn,
      bladeId: blade.id,
      ratchetId: ratchet.id,
      bitId: bit.id,
      beyType: bey.beyType ?? blade.beyType,
      totalAttack: totalAttack > 0 ? totalAttack : null,
      totalDefense: totalDefense > 0 ? totalDefense : null,
      totalStamina: totalStamina > 0 ? totalStamina : null,
      totalBurst,
      totalDash,
      totalWeight: totalWeight > 0 ? totalWeight : null,
      productId: product?.id,
      imageUrl: product?.imageUrl,
    }

    const existing = await prisma.beyblade.findUnique({
      where: { code: bey.code },
    })

    if (existing) {
      await prisma.beyblade.update({
        where: { code: bey.code },
        data,
      })
      updated++
      console.log(`📝 Updated: ${bey.nameEn} (${bey.code})`)
    } else {
      await prisma.beyblade.create({ data })
      created++
      console.log(`✅ Created: ${bey.nameEn} (${bey.code})`)
    }
  }

  console.log(`\n🎯 Beyblades seeded:`)
  console.log(`   - Created: ${created}`)
  console.log(`   - Updated: ${updated}`)
  console.log(`   - Skipped: ${skipped}`)
  console.log(`   - Total defined: ${beyblades.length}`)
}

async function main() {
  try {
    await seedBeyblades()
  } catch (error) {
    console.error('❌ Error seeding beyblades:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
