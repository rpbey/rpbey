/**
 * Leaderboard Card Image Generation
 * Generates a shareable top 10 leaderboard image
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function safeLoadImage(
  loadImage: (src: string | Buffer) => Promise<unknown>,
  url: string | null,
): Promise<unknown> {
  if (!url) return null;
  try {
    const src = url.startsWith('/') ? `${process.cwd()}/public${url}` : url;
    return await loadImage(src);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Get active season
    const season = await prisma.rankingSeason.findFirst({
      where: { isActive: true },
      include: {
        entries: {
          orderBy: { points: 'desc' },
          take: 10,
          include: {
            user: {
              select: { name: true, image: true },
            },
          },
        },
      },
    });

    if (!season || season.entries.length === 0) {
      return NextResponse.json(
        { error: 'No leaderboard data' },
        { status: 404 },
      );
    }

    const { createCanvas, GlobalFonts, loadImage } = await import(
      '@napi-rs/canvas'
    );

    const fontPath = `${process.cwd()}/public/Google_Sans_Flex/static/GoogleSansFlex_72pt-Bold.ttf`;
    try {
      GlobalFonts.registerFromPath(fontPath, 'GoogleSans');
    } catch {
      // Already registered
    }

    const load = (url: string | null) => safeLoadImage(loadImage, url);

    const width = 1000;
    const height = 1200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Load assets
    const [background, ...avatars] = (await Promise.all([
      load('/canvas.webp'),
      ...season.entries.map((e) => load(e.user?.image ?? null)),
    ])) as unknown[];

    // Background
    if (background) {
      ctx.drawImage(background as never, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, width, height);
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.font = 'bold 60px GoogleSans';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText('CLASSEMENT OFFICIEL RPB', width / 2, 80);

    // Season name
    ctx.font = '24px GoogleSans';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(season.name, width / 2, 120);

    const startY = 180;
    const rowHeight = 100;

    for (let i = 0; i < season.entries.length; i++) {
      const entry = season.entries[i]!;
      const avatar = avatars[i];
      const y = startY + i * rowHeight;
      const rank = i + 1;

      // Alternating rows
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(50, y - 60, width - 100, rowHeight - 10);
      }

      // Rank color
      let rankColor = '#94a3b8';
      if (rank === 1) rankColor = '#fbbf24';
      if (rank === 2) rankColor = '#e2e8f0';
      if (rank === 3) rankColor = '#cd7f32';

      // Rank circle
      ctx.fillStyle = rankColor;
      ctx.beginPath();
      ctx.arc(100, y - 15, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 32px GoogleSans';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.fillText(`#${rank}`, 100, y - 5);

      // Avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(200, y - 15, 40, 0, Math.PI * 2, true);
      ctx.clip();
      if (avatar) {
        ctx.drawImage(avatar as never, 160, y - 55, 80, 80);
      } else {
        ctx.fillStyle = '#444';
        ctx.fill();
      }
      ctx.restore();

      if (rank <= 3) {
        ctx.strokeStyle = rankColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(200, y - 15, 40, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Name
      ctx.textAlign = 'left';
      ctx.font = 'bold 36px GoogleSans';
      ctx.fillStyle = rank === 1 ? '#fbbf24' : '#ffffff';
      const name = (entry.user?.name || 'Anonyme').toUpperCase();
      ctx.fillText(name, 280, y);

      // Points
      ctx.textAlign = 'right';
      ctx.font = 'bold 40px GoogleSans';
      ctx.fillStyle = rankColor;
      ctx.fillText(`${entry.points}`, 750, y);
      ctx.font = '20px GoogleSans';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('PTS', 750, y + 25);

      // Win rate
      const totalGames = entry.wins + entry.losses;
      const wr =
        totalGames > 0 ? ((entry.wins / totalGames) * 100).toFixed(1) : '0';
      ctx.font = 'bold 28px GoogleSans';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${wr}%`, 900, y);
      ctx.font = '20px GoogleSans';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('WR', 900, y + 25);
    }

    // Footer
    ctx.textAlign = 'center';
    ctx.font = 'italic 20px GoogleSans';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillText(
      'rpbey.fr/rankings - Mis à jour en temps réel',
      width / 2,
      height - 30,
    );

    const buffer = canvas.toBuffer('image/png');
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="classement-rpb.png"',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('Error generating leaderboard card:', error);
    return NextResponse.json(
      { error: 'Failed to generate leaderboard card' },
      { status: 500 },
    );
  }
}
