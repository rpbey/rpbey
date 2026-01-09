/**
 * RPB - Scrape Takara Tomy Official Beyblade X Data
 * Fetches official product information from beyblade.takaratomy.co.jp/beyblade-x/lineup/
 *
 * This script parses the lineup page directly which contains all product data
 * in the HTML without needing JavaScript rendering.
 *
 * Data collected:
 * - Product codes (BX-01, UX-01, CX-01, etc.)
 * - Japanese names
 * - Product types (スターター, ブースター, セット, ツール)
 * - Prices (税込)
 * - Release dates
 * - Limited edition info
 */

import 'dotenv/config'
import { PrismaClient, PartType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const LINEUP_URL = 'https://beyblade.takaratomy.co.jp/beyblade-x/lineup/'

// ============================================================================
// Types
// ============================================================================

interface OfficialProduct {
  code: string // BX-01, UX-01, CX-01, etc.
  name: string // ドランソード3-60F
  productType: string // スターター, ブースター, セット, ツール
  price: number // 1980 (税込)
  releaseDate: string // 2023.7.15
  url: string
  imageUrl: string
  isLimited: boolean
  limitedType?: string
  // Parsed components
  bladeName?: string
  ratchet?: string
  bit?: string
}

// ============================================================================
// Parser functions
// ============================================================================

/**
 * Parse Beyblade name into components
 * Example: "ドランソード3-60F" -> { blade: "ドランソード", ratchet: "3-60", bit: "F" }
 */
function parseBeyName(name: string): {
  blade?: string
  ratchet?: string
  bit?: string
} {
  // Remove any color/version suffixes first
  const cleanName = name
    .replace(/メタルコート:[^\s]+/g, '')
    .replace(/\s*(ブラックVer\.|レッドVer\.|クリアVer\.)/gi, '')
    .trim()

  // Pattern: BladeName + Ratchet (X-YY) + Bit (1-3 uppercase letters)
  // Supports: 3-60, 4-80, 1-60, 5-70, etc.
  const match = cleanName.match(/^(.+?)(\d-\d{2})([A-Z]{1,3})$/i)
  if (match && match[1] && match[2] && match[3]) {
    return {
      blade: match[1].trim(),
      ratchet: match[2],
      bit: match[3].toUpperCase(),
    }
  }
  return {}
}

/**
 * Parse the lineup page HTML to extract all products
 * The lineup page contains product data in this format:
 * [CODE] [NAME] [TYPE] ¥[PRICE]（税込） [DATE]発売
 */
async function parseLineupPage(): Promise<OfficialProduct[]> {
  console.log('📥 Fetching lineup page...')

  const response = await fetch(LINEUP_URL)
  const html = await response.text()

  const products: OfficialProduct[] = []

  // Regex to match the HTML structure:
  // <a href="bx01.html"> <img src="_image/BX01_list.png" alt="BX-01"> <b>BX-01<span>ドランソード3-60F</span></b>
  // <p class="category"><span>スターター</span></p>
  // <i>¥1,980（税込）</i> <i class="red">2023.7.15発売</i>
  
  const productPattern = /<a href="([^"]+)">[\s\S]*?<img\s+src="([^"]+)"[^>]*?>\s*<b>((?:BX|UX|CX|BXG)-\d{2,3}|(?:BX|UX|CX|BXG)-00)<span>([^<]+)<\/span><\/b>[\s\S]*?<p class="category"><span>([^<]+)<\/span><\/p>[\s\S]*?<i>¥([\d,]+)[^<]*<\/i>[\s\S]*?<i class="red">([\d.]+)[^<]*<\/i>/g;

  let match
  while ((match = productPattern.exec(html)) !== null) {
    const detailUrlRelative = match[1]
    const imgUrlRelative = match[2]
    const code = match[3]
    const rawName = match[4]
    const productType = match[5]
    const priceStr = match[6]
    const releaseDate = match[7]

    if (!code || !rawName || !priceStr || !detailUrlRelative || !imgUrlRelative || !productType || !releaseDate) continue

    const name = rawName.trim()
    const price = parseInt(priceStr.replace(',', ''), 10)
    
    // Construct absolute URLs
    const url = new URL(detailUrlRelative, LINEUP_URL).toString()
    const imageUrl = new URL(imgUrlRelative, LINEUP_URL).toString()

    // Determine limited type (basic heuristic based on name or if missing from standard types)
    // The HTML structure for limited items might be slightly different or use the same structure
    // We'll check if the name contains '限定'
    const isLimited = name.includes('限定')
    let limitedType: string | undefined
    if (isLimited) {
       limitedType = 'Limited'
    }

    const { blade, ratchet, bit } = parseBeyName(name)

    products.push({
      code,
      name,
      productType,
      price,
      releaseDate,
      url,
      imageUrl,
      isLimited,
      limitedType,
      bladeName: blade,
      ratchet,
      bit,
    })
  }
  
  // Fallback for limited items which might have slightly different HTML (e.g. BX-00)
  // The grep showed: <b>BX-00<span>【タカラトミーモール限定】...
  // Let's try a secondary pattern for these if the first one misses them
  
  if (products.length === 0) {
    console.log('  ⚠️ Regex pattern failed, trying alternative parsing...')

    // Split by product codes and parse
    const lines = html.split(/(?=\[(?:BX|UX|CX)-\d{2})/g)

    for (const line of lines) {
      // Match: [BX-01 ...
      const codeMatch = line.match(/^\[(BX|UX|CX)-(\d{2})/)
      if (!codeMatch) continue

      const code = `${codeMatch[1]}-${codeMatch[2]}`

      // Extract name - text after code and optional 【限定】 info
      const nameMatch = line.match(/\[(?:BX|UX|CX)-\d{2}\s+(?:【[^】]+】\s*)?([^\]¥]+)/)
      const name = nameMatch?.[1]?.trim() ?? ''

      // Extract type
      let productType = 'その他'
      if (line.includes('ランダムブースター')) productType = 'ランダムブースター'
      else if (line.includes('ダブルスターター')) productType = 'ダブルスターター'
      else if (line.includes('スターター')) productType = 'スターター'
      else if (line.includes('ブースター')) productType = 'ブースター'
      else if (line.includes('セット')) productType = 'セット'
      else if (line.includes('ツール')) productType = 'ツール'

      // Extract price
      const priceMatch = line.match(/¥([\d,]+)（税込）/)
      const price = priceMatch?.[1] ? parseInt(priceMatch[1].replace(',', ''), 10) : 0

      // Extract date
      const dateMatch = line.match(/(\d{4}\.\d{1,2}\.\d{1,2})発売/)
      const releaseDate = dateMatch?.[1] ?? ''

      // Extract URL
      const urlMatch = line.match(/\]\(([^)]+\.html)\)/)
      const url = urlMatch?.[1] ? new URL(urlMatch[1], LINEUP_URL).toString() : ''

      // Extract Image URL
      const imgMatch = line.match(/src="([^"]+)"/)
      const imageUrl = imgMatch?.[1] ? new URL(imgMatch[1], LINEUP_URL).toString() : ''

      // Limited check
      const isLimited = line.includes('限定')
      let limitedType: string | undefined
      if (line.includes('イベント限定')) limitedType = 'イベント限定'
      else if (line.includes('タカラトミーモール限定'))
        limitedType = 'タカラトミーモール限定'
      else if (line.includes('アプリ・イベント限定')) limitedType = 'アプリ・イベント限定'
      else if (line.includes('B4ストア限定')) limitedType = 'B4ストア限定'

      // Parse bey name
      const { blade, ratchet, bit } = parseBeyName(name)

      if (name) {
        products.push({
          code,
          name,
          productType,
          price,
          releaseDate,
          url,
          imageUrl,
          isLimited,
          limitedType,
          bladeName: blade,
          ratchet,
          bit,
        })
      }
    }
  }

  console.log(`  → Found ${products.length} products`)
  return products
}

// ============================================================================
// Database operations
// ============================================================================

/**
 * Store official product data
 * This updates existing parts with official Takara Tomy data
 */
async function storeOfficialData(products: OfficialProduct[]): Promise<number> {
  let updated = 0

  // Group products by blade name for efficient updates
  const bladeProducts = products.filter((p) => p.bladeName)

  console.log(`  📝 Processing ${bladeProducts.length} products with valid blade names...`)

  for (const product of bladeProducts) {
    if (!product.bladeName) continue

    try {
      // Update parts with official data
      const result = await prisma.part.updateMany({
        where: {
          type: PartType.BLADE,
          name: {
            contains: product.bladeName,
            mode: 'insensitive',
          },
        },
        data: {
          rarity: product.isLimited ? product.limitedType || 'Limited' : 'Standard',
        },
      })

      if (result.count > 0) {
        console.log(`    ✓ ${product.bladeName} → ${product.isLimited ? product.limitedType : 'Standard'}`)
        updated += result.count
      }
    } catch {
      // Part might not exist yet
    }
  }

  return updated
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('🌀 RPB Takara Tomy Official Scraper')
  console.log('====================================\n')

  try {
    // Parse the lineup page
    const products = await parseLineupPage()

    console.log(`\n📊 Parsed ${products.length} products\n`)

    // Show some stats
    const types = products.reduce(
      (acc, p) => {
        acc[p.productType] = (acc[p.productType] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    console.log('📈 By type:')
    for (const [type, count] of Object.entries(types)) {
      console.log(`   ${type}: ${count}`)
    }

    const limitedCount = products.filter((p) => p.isLimited).length
    console.log(`\n🏷️  Limited editions: ${limitedCount}`)

    const withBey = products.filter((p) => p.bladeName).length
    console.log(`🎯 Products with valid Bey names: ${withBey}`)

    // Store to database
    console.log('\n💾 Updating parts database...')
    const updated = await storeOfficialData(products)
    console.log(`   ✓ Updated ${updated} parts`)

    // Save raw data to JSON for reference
    const fs = await import('fs/promises')
    await fs.writeFile(
      '/root/rpb-dashboard/data/takaratomy-products.json',
      JSON.stringify(products, null, 2),
      'utf-8'
    )
    console.log('\n📁 Saved raw data to data/takaratomy-products.json')

    // Show sample data
    console.log('\n📋 Sample products:')
    products.slice(0, 5).forEach((p) => {
      console.log(`   ${p.code}: ${p.name} (${p.productType}) ¥${p.price} - ${p.releaseDate}`)
      if (p.bladeName) {
        console.log(`      → Blade: ${p.bladeName}, Ratchet: ${p.ratchet}, Bit: ${p.bit}`)
      }
    })

    console.log('\n====================================')
    console.log(`🎉 Done! ${products.length} products scraped`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    pool.end()
  }
}

main()
