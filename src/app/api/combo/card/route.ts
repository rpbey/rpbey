/**
 * Combo Card Image Generation
 * Generates a shareable beyblade combo card from query params
 */

import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TYPE_COLORS: Record<string, number> = {
  ATTACK: 0xef4444,
  DEFENSE: 0x3b82f6,
  STAMINA: 0x22c55e,
  BALANCE: 0xa855f7,
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const bladeId = searchParams.get('blade');
    const ratchetId = searchParams.get('ratchet');
    const bitId = searchParams.get('bit');

    if (!bladeId || !ratchetId || !bitId) {
      return NextResponse.json(
        { error: 'blade, ratchet, and bit params required' },
        { status: 400 },
      );
    }

    const [blade, ratchet, bit] = await Promise.all([
      prisma.part.findUnique({ where: { id: bladeId } }),
      prisma.part.findUnique({ where: { id: ratchetId } }),
      prisma.part.findUnique({ where: { id: bitId } }),
    ]);

    if (!blade || !ratchet || !bit) {
      return NextResponse.json({ error: 'Parts not found' }, { status: 404 });
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

    const comboName = `${blade.name} ${ratchet.name} ${bit.name}`;
    const beyType = blade.beyType || 'BALANCE';
    const hexColor = `#${(TYPE_COLORS[beyType] || 0xa855f7).toString(16).padStart(6, '0')}`;

    const width = 800;
    const height = 550;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const [background, bladeImg] = (await Promise.all([
      load('/background-seasson-2.webp'),
      load(blade.imageUrl),
    ])) as unknown[];

    // Background
    if (background) {
      ctx.drawImage(background as never, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = hexColor;
    ctx.lineWidth = 15;
    ctx.strokeRect(0, 0, width, height);

    // Combo name
    ctx.font = 'bold 50px GoogleSans';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(comboName.toUpperCase(), width / 2, 80);

    // Type badge
    ctx.fillStyle = hexColor;
    ctx.beginPath();
    ctx.roundRect(width / 2 - 100, 100, 200, 40, 20);
    ctx.fill();
    ctx.font = 'bold 24px GoogleSans';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(beyType.toUpperCase(), width / 2, 128);

    // Blade image
    if (bladeImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(150, 275, 100, 0, Math.PI * 2, true);
      ctx.clip();
      ctx.drawImage(bladeImg as never, 50, 175, 200, 200);
      ctx.restore();
      ctx.strokeStyle = hexColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(150, 275, 100, 0, Math.PI * 2, true);
      ctx.stroke();
    }

    // Parts labels
    const partsX = blade.imageUrl ? 500 : width / 2;
    const drawPart = (label: string, value: string, y: number) => {
      ctx.textAlign = 'right';
      ctx.font = '24px GoogleSans';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(label, partsX - 20, y);
      ctx.textAlign = 'left';
      ctx.font = 'bold 32px GoogleSans';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(value, partsX + 20, y);
    };

    drawPart('BLADE', blade.name, 200);
    drawPart('RATCHET', ratchet.name, 260);
    drawPart('BIT', bit.name, 320);

    // Weight
    const totalWeight =
      (blade.weight || 0) + (ratchet.weight || 0) + (bit.weight || 0);
    if (totalWeight > 0) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 30px GoogleSans';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${totalWeight.toFixed(1)}g`, partsX, 360);
    }

    // Stat bars
    const drawProgressBar = (
      label: string,
      value: number,
      y: number,
      color: string,
    ) => {
      ctx.textAlign = 'left';
      ctx.font = 'bold 20px GoogleSans';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, 100, y);
      const barWidth = 350;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(220, y - 15, barWidth, 20, 10);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(
        220,
        y - 15,
        Math.min((value / 100) * barWidth, barWidth),
        20,
        10,
      );
      ctx.fill();
      ctx.font = 'bold 20px GoogleSans';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(value.toString(), 220 + barWidth + 20, y);
    };

    drawProgressBar('ATTAQUE', Number(blade.attack) || 0, 400, '#ef4444');
    drawProgressBar('DÉFENSE', Number(blade.defense) || 0, 440, '#3b82f6');
    drawProgressBar('ENDURANCE', Number(blade.stamina) || 0, 480, '#22c55e');
    drawProgressBar('DASH', Number(blade.dash) || 0, 520, '#eab308');

    const buffer = canvas.toBuffer('image/png');
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${comboName}.png"`,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Error generating combo card:', error);
    return NextResponse.json(
      { error: 'Failed to generate combo card' },
      { status: 500 },
    );
  }
}
