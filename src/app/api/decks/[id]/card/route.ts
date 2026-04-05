/**
 * Deck Card Image Generation
 * Generates a shareable deck card image using Canvas
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const TYPE_COLORS: Record<string, string> = {
  ATTACK: '#ef4444',
  DEFENSE: '#3b82f6',
  STAMINA: '#22c55e',
  BALANCE: '#a855f7',
};

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

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: deckId } = await params;

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        user: { select: { name: true } },
        items: {
          include: {
            blade: true,
            ratchet: true,
            bit: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    const { createCanvas, GlobalFonts, loadImage } = await import(
      '@napi-rs/canvas'
    );

    // Register font
    const fontPath = `${process.cwd()}/public/Google_Sans_Flex/static/GoogleSansFlex_72pt-Bold.ttf`;
    try {
      GlobalFonts.registerFromPath(fontPath, 'GoogleSans');
    } catch {
      // Font may already be registered
    }

    const width = 900;
    const boxH = 500;
    const infoH = 180;
    const height = boxH + infoH;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Load images
    const load = (url: string | null) => safeLoadImage(loadImage, url);
    const bladeUrls = deck.items.map((item) => item.blade?.imageUrl ?? null);
    const [background, logo, ...beyImages] = (await Promise.all([
      load('/deckbox.webp'),
      load('/logo.webp'),
      ...bladeUrls.map(load),
    ])) as (ReturnType<typeof loadImage> extends Promise<infer T>
      ? T | null
      : never)[];

    // === Deckbox section ===
    if (background) {
      ctx.drawImage(background as never, 0, 0, width, boxH);
    } else {
      ctx.fillStyle = '#1a0a0a';
      ctx.fillRect(0, 0, width, boxH);
    }

    // Red inner glow
    const glowGrad = ctx.createRadialGradient(
      width / 2,
      boxH / 2,
      0,
      width / 2,
      boxH / 2,
      width * 0.6,
    );
    glowGrad.addColorStop(0, 'rgba(220, 38, 38, 0.08)');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, boxH);

    // Draw Beys in 3D perspective slots
    const positions = [
      { x: width * 0.21, y: boxH * 0.65 },
      { x: width * 0.5, y: boxH * 0.65 },
      { x: width * 0.79, y: boxH * 0.65 },
    ];
    const beySize = width * 0.2;

    for (let i = 0; i < 3; i++) {
      const img = beyImages[i];
      const pos = positions[i]!;

      // Slot shadow
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        pos.x,
        pos.y + beySize * 0.35,
        beySize * 0.4,
        beySize * 0.12,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.filter = 'blur(8px)';
      ctx.fill();
      ctx.filter = 'none';
      ctx.restore();

      if (img) {
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.transform(1, 0, 0, 0.82, 0, 0);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 12;
        ctx.drawImage(
          img as never,
          -beySize / 2,
          -beySize / 2,
          beySize,
          beySize,
        );
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.transform(1, 0, 0, 0.82, 0, 0);
        ctx.beginPath();
        ctx.arc(0, 0, beySize * 0.35, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    // === Info section ===
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, boxH, width, infoH);

    // Gradient separator
    const sepGrad = ctx.createLinearGradient(0, boxH, width, boxH);
    sepGrad.addColorStop(0, '#dc2626');
    sepGrad.addColorStop(0.5, '#fbbf24');
    sepGrad.addColorStop(1, '#dc2626');
    ctx.fillStyle = sepGrad;
    ctx.fillRect(0, boxH, width, 3);

    // Deck name + owner
    if (logo) ctx.drawImage(logo as never, 20, boxH + 15, 40, 40);
    ctx.font = 'bold 26px GoogleSans';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'left';
    ctx.fillText(deck.name.toUpperCase(), 70, boxH + 40);

    ctx.font = '14px GoogleSans';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(
      `${deck.user?.name || 'Unknown'}${deck.isActive ? ' · DECK ACTIF' : ''}`,
      70,
      boxH + 58,
    );

    // Bey info columns
    const colW = (width - 40) / 3;
    for (let i = 0; i < Math.min(deck.items.length, 3); i++) {
      const item = deck.items[i]!;
      const cx = 20 + i * colW + colW / 2;
      const baseY = boxH + 80;
      const typeColor = TYPE_COLORS[item.blade?.beyType || ''] || '#888';

      // Type indicator dot
      ctx.beginPath();
      ctx.arc(cx - colW / 2 + 10, baseY + 8, 4, 0, Math.PI * 2);
      ctx.fillStyle = typeColor;
      ctx.fill();

      // Combo name
      ctx.font = 'bold 15px GoogleSans';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      const combo = [item.blade?.name, item.ratchet?.name, item.bit?.name]
        .filter(Boolean)
        .join(' ');
      let displayCombo = combo;
      while (
        ctx.measureText(displayCombo).width > colW - 30 &&
        displayCombo.length > 10
      ) {
        displayCombo = `${displayCombo.slice(0, -2)}…`;
      }
      ctx.fillText(displayCombo, cx - colW / 2 + 22, baseY + 13);

      // Stats mini bars
      const stats = [
        {
          label: 'ATK',
          value: Number(item.blade?.attack) || 0,
          color: '#ef4444',
        },
        {
          label: 'DEF',
          value: Number(item.blade?.defense) || 0,
          color: '#3b82f6',
        },
        {
          label: 'STA',
          value: Number(item.blade?.stamina) || 0,
          color: '#22c55e',
        },
      ];
      const barW = colW - 80;

      for (let si = 0; si < stats.length; si++) {
        const stat = stats[si]!;
        const sy = baseY + 28 + si * 20;

        ctx.font = '11px GoogleSans';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.textAlign = 'left';
        ctx.fillText(stat.label, cx - colW / 2 + 22, sy + 4);

        const barX = cx - colW / 2 + 55;
        ctx.beginPath();
        ctx.roundRect(barX, sy - 3, barW, 8, 4);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fill();

        const fillW = Math.max(4, (stat.value / 100) * barW);
        ctx.beginPath();
        ctx.roundRect(barX, sy - 3, fillW, 8, 4);
        ctx.fillStyle = stat.color;
        ctx.fill();

        ctx.font = 'bold 11px GoogleSans';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.textAlign = 'right';
        ctx.fillText(`${stat.value}`, cx + colW / 2 - 10, sy + 4);
      }
    }

    // Footer
    ctx.textAlign = 'right';
    ctx.font = 'italic 12px GoogleSans';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillText('rpbey.fr/builder', width - 20, height - 15);

    const buffer = canvas.toBuffer('image/png');
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${deck.name}-deck.png"`,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Error generating deck card:', error);
    return NextResponse.json(
      { error: 'Failed to generate deck card' },
      { status: 500 },
    );
  }
}
