/**
 * RPB - Seed Parts Database
 * Importe toutes les pièces Beyblade X depuis Beyblade-EX
 * https://github.com/Beyblade-EX/beyblade-ex.github.io/tree/master/db
 */

import 'dotenv/config'
import { PrismaClient, PartType, type BeyType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const BEYBLADE_EX_BASE =
  'https://raw.githubusercontent.com/Beyblade-EX/beyblade-ex.github.io/master/db'

// ============================================================================
// Types from Beyblade-EX JSON
// ============================================================================

interface RawBlade {
  name: string
  type: number // 0=Attack, 1=Defense, 2=Stamina, 3=Balance
  stat: [number, number, number, number, number] // [attack, defense, stamina, burst, dash]
  weight?: number
  img?: string
}

interface RawBit {
  name: string
  stat: [string, number, number] // [gearRatio, weight, shaftWidthIndex]
  type?: number // 0=Attack, 1=Defense, 2=Stamina, 3=Balance
  img?: string
}

interface RawRatchet {
  name: string
  stat: [number, number] // [weight, height]
  img?: string
}

interface PartMeta {
  blade?: { type: string[] }
  bit?: { ratio: string[]; shaft: string[] }
  [key: string]: unknown
}

// ============================================================================
// Utility Functions
// ============================================================================

function mapBeyType(typeIndex: number): BeyType {
  switch (typeIndex) {
    case 0:
      return 'ATTACK'
    case 1:
      return 'DEFENSE'
    case 2:
      return 'STAMINA'
    case 3:
      return 'BALANCE'
    default:
      return 'BALANCE'
  }
}

function normalizeId(id: string): string {
  // Remove special characters and normalize
  return id.replace(/[^a-zA-Z0-9-]/g, '')
}

async function fetchJson<T>(url: string): Promise<T> {
  console.log(`📥 Fetching ${url}...`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

// ============================================================================
// Seed Functions
// ============================================================================

async function seedBlades(): Promise<number> {
  const sources = [
    { url: `${BEYBLADE_EX_BASE}/part-blade.json`, type: 'standard' },
    { url: `${BEYBLADE_EX_BASE}/part-blade-CX.json`, type: 'custom-x' },
    { url: `${BEYBLADE_EX_BASE}/part-blade-collab.json`, type: 'collab' },
  ]

  let totalCount = 0

  for (const source of sources) {
    try {
      const blades = await fetchJson<Record<string, RawBlade>>(source.url)
      const entries = Object.entries(blades)

      console.log(`  → Found ${entries.length} blades (${source.type})`)

      for (const [id, blade] of entries) {
        try {
          const name = blade.name || id // Fallback to ID if name is missing
          // Convert stats to strings (they can be "29+" or just numbers)
          const toStatString = (val: unknown): string | null => {
            if (val === null || val === undefined) return null
            return String(val)
          }
          await prisma.part.upsert({
            where: { externalId: normalizeId(id) },
            update: {
              name,
              type: PartType.BLADE,
              beyType: mapBeyType(blade.type),
              attack: toStatString(blade.stat?.[0]),
              defense: toStatString(blade.stat?.[1]),
              stamina: toStatString(blade.stat?.[2]),
              burst: toStatString(blade.stat?.[3]),
              dash: toStatString(blade.stat?.[4]),
              weight: blade.weight ?? null,
              imageUrl: blade.img ?? null,
              rarity: source.type === 'collab' ? 'Collab' : source.type === 'custom-x' ? 'Custom X' : 'Standard',
            },
            create: {
              externalId: normalizeId(id),
              name,
              type: PartType.BLADE,
              beyType: mapBeyType(blade.type),
              attack: toStatString(blade.stat?.[0]),
              defense: toStatString(blade.stat?.[1]),
              stamina: toStatString(blade.stat?.[2]),
              burst: toStatString(blade.stat?.[3]),
              dash: toStatString(blade.stat?.[4]),
              weight: blade.weight ?? null,
              imageUrl: blade.img ?? null,
              rarity: source.type === 'collab' ? 'Collab' : source.type === 'custom-x' ? 'Custom X' : 'Standard',
            },
          })
          totalCount++
        } catch (err) {
          console.error(`  ⚠️ Failed to upsert blade ${id}:`, err)
        }
      }
    } catch (err) {
      console.warn(`  ⚠️ Could not fetch ${source.url}:`, err)
    }
  }

  return totalCount
}

async function seedRatchets(): Promise<number> {
  try {
    const ratchets = await fetchJson<Record<string, RawRatchet>>(
      `${BEYBLADE_EX_BASE}/part-ratchet.json`
    )
    const entries = Object.entries(ratchets)

    console.log(`  → Found ${entries.length} ratchets`)

    let count = 0
    for (const [id, ratchet] of entries) {
      try {
        const name = ratchet.name || id // Fallback to ID if name is missing
        // Parse protrusions from name (e.g., "3-60" -> 3)
        const protrusionMatch = name.match(/^(\d+)-/)
        const protrusions = protrusionMatch?.[1] ? parseInt(protrusionMatch[1], 10) : null

        await prisma.part.upsert({
          where: { externalId: normalizeId(id) },
          update: {
            name,
            type: PartType.RATCHET,
            weight: typeof ratchet.stat?.[0] === 'number' ? ratchet.stat[0] : null,
            height: typeof ratchet.stat?.[1] === 'number' ? ratchet.stat[1] : null,
            protrusions,
            imageUrl: ratchet.img ?? null,
          },
          create: {
            externalId: normalizeId(id),
            name,
            type: PartType.RATCHET,
            weight: typeof ratchet.stat?.[0] === 'number' ? ratchet.stat[0] : null,
            height: typeof ratchet.stat?.[1] === 'number' ? ratchet.stat[1] : null,
            protrusions,
            imageUrl: ratchet.img ?? null,
          },
        })
        count++
      } catch (err) {
        console.error(`  ⚠️ Failed to upsert ratchet ${id}:`, err)
      }
    }

    return count
  } catch (err) {
    console.error('  ❌ Failed to fetch ratchets:', err)
    return 0
  }
}

async function seedBits(): Promise<number> {
  // Fetch metadata for shaft width mapping
  let meta: PartMeta = {}
  try {
    meta = await fetchJson<PartMeta>(`${BEYBLADE_EX_BASE}/part-meta.json`)
  } catch {
    console.warn('  ⚠️ Could not fetch part-meta.json')
  }

  const shaftWidths = meta.bit?.shaft ?? ['L', 'M', 'S']

  try {
    const bits = await fetchJson<Record<string, RawBit>>(
      `${BEYBLADE_EX_BASE}/part-bit.json`
    )
    const entries = Object.entries(bits)

    console.log(`  → Found ${entries.length} bits`)

    let count = 0
    for (const [id, bit] of entries) {
      try {
        const shaftWidthIndex = bit.stat[2]
        const shaftWidth = shaftWidths[shaftWidthIndex] ?? null
        const name = bit.name || id // Fallback to ID if name is missing

        await prisma.part.upsert({
          where: { externalId: normalizeId(id) },
          update: {
            name,
            type: PartType.BIT,
            beyType: bit.type !== undefined ? mapBeyType(bit.type) : null,
            gearRatio: bit.stat[0],
            weight: typeof bit.stat[1] === 'number' ? bit.stat[1] : null,
            shaftWidth,
            tipType: name,
            imageUrl: bit.img ?? null,
          },
          create: {
            externalId: normalizeId(id),
            name,
            type: PartType.BIT,
            beyType: bit.type !== undefined ? mapBeyType(bit.type) : null,
            gearRatio: bit.stat[0],
            weight: typeof bit.stat[1] === 'number' ? bit.stat[1] : null,
            shaftWidth,
            tipType: name,
            imageUrl: bit.img ?? null,
          },
        })
        count++
      } catch (err) {
        console.error(`  ⚠️ Failed to upsert bit ${id}:`, err)
      }
    }

    return count
  } catch (err) {
    console.error('  ❌ Failed to fetch bits:', err)
    return 0
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('🌀 RPB Parts Database Seeder')
  console.log('============================\n')

  console.log('📦 Seeding Blades...')
  const bladeCount = await seedBlades()
  console.log(`  ✅ ${bladeCount} blades seeded\n`)

  console.log('⚙️ Seeding Ratchets...')
  const ratchetCount = await seedRatchets()
  console.log(`  ✅ ${ratchetCount} ratchets seeded\n`)

  console.log('💫 Seeding Bits...')
  const bitCount = await seedBits()
  console.log(`  ✅ ${bitCount} bits seeded\n`)

  console.log('============================')
  console.log(`🎉 Total: ${bladeCount + ratchetCount + bitCount} parts seeded!`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
