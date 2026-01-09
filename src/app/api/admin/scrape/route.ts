import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TakaraTomyScraper } from '@/lib/scraper/takaratomy';

export const maxDuration = 300; // 5 minutes timeout for scraping

export async function POST(_req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (
      !session ||
      (session.user.role !== 'admin' && session.user.role !== 'superadmin')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scraper = new TakaraTomyScraper(prisma);
    const result = await scraper.syncLineup();

    return NextResponse.json({
      success: true,
      message: `Scraping completed. Found ${result.total} products, updated ${result.updated}.`,
      data: result,
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as Error).message },
      { status: 500 },
    );
  }
}
