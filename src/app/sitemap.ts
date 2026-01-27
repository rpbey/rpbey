import fs from 'node:fs';
import path from 'node:path';
import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600;

const STATIC_ROUTES = {
  '': 'src/app/(marketing)/page.tsx',
  '/tournaments': 'src/app/(marketing)/tournaments/page.tsx',
  '/rankings': 'src/app/(marketing)/rankings/page.tsx',
  '/notre-equipe': 'src/app/(marketing)/notre-equipe/page.tsx',
  '/a-propos': 'src/app/(marketing)/a-propos/page.tsx',
  '/tv': 'src/app/(marketing)/tv/page.tsx',
  '/reglement': 'src/app/(marketing)/reglement/page.tsx',
  '/privacy': 'src/app/(marketing)/privacy/page.tsx',
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rpbey.fr';
  const cwd = process.cwd();

  // Static routes with actual file modification times
  const routes = Object.entries(STATIC_ROUTES).map(([route, filePath]) => {
    let lastModified = new Date();
    try {
      const fullPath = path.join(cwd, filePath);
      const stats = fs.statSync(fullPath);
      lastModified = stats.mtime;
    } catch {
      console.warn(`Could not get stats for ${filePath}, using current date.`);
    }

    return {
      url: `${baseUrl}${route}`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1 : 0.8,
    };
  });

  // Dynamic Tournaments
  let tournamentRoutes: MetadataRoute.Sitemap = [];
  try {
    const tournaments = await prisma.tournament.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 1000,
    });

    tournamentRoutes = tournaments.map((tournament) => ({
      url: `${baseUrl}/tournaments/${tournament.id}`,
      lastModified: tournament.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.warn('Failed to fetch tournaments for sitemap:', error);
  }

  // Dynamic Profiles (Publicly visible)
  let profileRoutes: MetadataRoute.Sitemap = [];
  try {
    const profiles = await prisma.profile.findMany({
      select: { userId: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 1000,
    });

    profileRoutes = profiles.map((profile) => ({
      url: `${baseUrl}/profile/${profile.userId}`,
      lastModified: profile.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));
  } catch (error) {
    console.warn('Failed to fetch profiles for sitemap:', error);
  }

  return [...routes, ...tournamentRoutes, ...profileRoutes];
}
