import { fetchLatestBeyblades } from '@/lib/feedmy'
import { NextResponse } from 'next/server'
import { cacheLife } from 'next/cache'

async function getCachedProducts() {
  'use cache'
  cacheLife('hours')
  return await fetchLatestBeyblades()
}

export async function GET() {
  const products = await getCachedProducts()
  return NextResponse.json(products)
}
