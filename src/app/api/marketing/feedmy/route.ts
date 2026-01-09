import { cacheLife } from 'next/cache';
import { NextResponse } from 'next/server';
import { fetchLatestBeyblades } from '@/lib/feedmy';

async function getCachedProducts() {
  'use cache';
  cacheLife('hours');
  return await fetchLatestBeyblades();
}

export async function GET() {
  const products = await getCachedProducts();
  return NextResponse.json(products);
}
