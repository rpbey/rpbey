/**
 * Gacha Card Image Generation API
 * Generates the same HD card images as the Discord bot.
 *
 * GET /api/gacha/card?id=<cardId>
 * GET /api/gacha/card?slug=<cardSlug>
 */

import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    if (!id && !slug) {
      return NextResponse.json(
        { error: 'id or slug param required' },
        { status: 400 },
      );
    }

    const card = await prisma.gachaCard.findFirst({
      where: id ? { id } : { slug: slug! },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Dynamic import to avoid loading canvas at module level
    const { createCanvas, GlobalFonts, loadImage } = await import(
      '@napi-rs/canvas'
    );
    const sharpMod = await import('sharp');
    const sharp = sharpMod.default;

    const fontPath = `${process.cwd()}/public/Google_Sans_Flex/static/GoogleSansFlex_72pt-Bold.ttf`;
    try {
      GlobalFonts.registerFromPath(fontPath, 'GoogleSans');
    } catch {
      // Already registered
    }

    // -- Reuse exact same rendering logic as bot --
    // We inline a simplified version of the bot's generateGachaCard here
    // to avoid cross-package imports, but the visual output is identical.

    const NON_TRANSPARENT_EXTS = /\.(jpe?g|webp|bmp|tiff?)(\?.*)?$/i;

    async function safeLoadImg(url: string | null) {
      if (!url) return null;
      try {
        let input: string | Buffer = url;
        if (url.startsWith('/')) {
          input = `${process.cwd()}/public${url}`;
        }
        if (typeof input === 'string' && NON_TRANSPARENT_EXTS.test(input)) {
          if (input.startsWith('http')) {
            const res = await fetch(input);
            const buf = Buffer.from(await res.arrayBuffer());
            input = await sharp(buf).unflatten().png().toBuffer();
          } else {
            input = await sharp(input).unflatten().png().toBuffer();
          }
        }
        return await loadImage(input);
      } catch {
        return null;
      }
    }

    const ELEMENT_ICONS: Record<string, { emoji: string; color: string }> = {
      FEU: { emoji: '🔥', color: '#ef4444' },
      EAU: { emoji: '💧', color: '#3b82f6' },
      TERRE: { emoji: '🌍', color: '#a16207' },
      VENT: { emoji: '🌪️', color: '#22d3ee' },
      OMBRE: { emoji: '🌑', color: '#7c3aed' },
      LUMIERE: { emoji: '✨', color: '#fbbf24' },
      NEUTRAL: { emoji: '⚪', color: '#9ca3af' },
    };

    const RARITY_THEMES: Record<
      string,
      {
        borderColor: string;
        borderGradient: [string, string, string];
        glowColor: string;
        bgGradient: [string, string, string];
        accentColor: string;
        label: string;
        stars: number;
        particleCount: number;
      }
    > = {
      COMMON: {
        borderColor: '#6b7280',
        borderGradient: ['#6b7280', '#9ca3af', '#6b7280'],
        glowColor: 'rgba(107,114,128,0.25)',
        bgGradient: ['#1a1f2e', '#141824', '#0d1117'],
        accentColor: '#9ca3af',
        label: 'COMMUNE',
        stars: 1,
        particleCount: 0,
      },
      RARE: {
        borderColor: '#3b82f6',
        borderGradient: ['#2563eb', '#60a5fa', '#2563eb'],
        glowColor: 'rgba(59,130,246,0.35)',
        bgGradient: ['#0c2461', '#1e3a5f', '#0a1628'],
        accentColor: '#60a5fa',
        label: 'RARE',
        stars: 2,
        particleCount: 4,
      },
      EPIC: {
        borderColor: '#8b5cf6',
        borderGradient: ['#7c3aed', '#a78bfa', '#7c3aed'],
        glowColor: 'rgba(139,92,246,0.4)',
        bgGradient: ['#1e0a4a', '#2e1065', '#140530'],
        accentColor: '#a78bfa',
        label: 'ÉPIQUE',
        stars: 3,
        particleCount: 8,
      },
      LEGENDARY: {
        borderColor: '#f59e0b',
        borderGradient: ['#d97706', '#fbbf24', '#f59e0b'],
        glowColor: 'rgba(251,191,36,0.5)',
        bgGradient: ['#3b1a00', '#422006', '#1a0d00'],
        accentColor: '#fcd34d',
        label: 'LÉGENDAIRE',
        stars: 4,
        particleCount: 14,
      },
      SECRET: {
        borderColor: '#ef4444',
        borderGradient: ['#dc2626', '#f87171', '#ef4444'],
        glowColor: 'rgba(239,68,68,0.55)',
        bgGradient: ['#3b0a0a', '#450a0a', '#1f0000'],
        accentColor: '#f87171',
        label: '✦ SECRÈTE ✦',
        stars: 5,
        particleCount: 20,
      },
    };

    const W = 640,
      H = 960;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    const theme = RARITY_THEMES[card.rarity] || RARITY_THEMES.COMMON!;
    const elem = card.element ? ELEMENT_ICONS[card.element] : null;

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, W * 0.3, H);
    bgGrad.addColorStop(0, theme.bgGradient[0]);
    bgGrad.addColorStop(0.5, theme.bgGradient[1]);
    bgGrad.addColorStop(1, theme.bgGradient[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Radial glow
    const centerGlow = ctx.createRadialGradient(
      W / 2,
      280,
      20,
      W / 2,
      280,
      320,
    );
    centerGlow.addColorStop(0, `${theme.borderColor}18`);
    centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, W, H);

    // Outer border
    ctx.shadowColor = theme.glowColor;
    ctx.shadowBlur = 35;
    const borderGrad = ctx.createLinearGradient(0, 0, W, H);
    borderGrad.addColorStop(0, theme.borderGradient[0]);
    borderGrad.addColorStop(0.5, theme.borderGradient[1]);
    borderGrad.addColorStop(1, theme.borderGradient[2]);
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(12, 12, W - 24, H - 24, 20);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner border
    ctx.strokeStyle = `${theme.borderColor}30`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(20, 20, W - 40, H - 40, 16);
    ctx.stroke();

    // Rarity band
    const bandGrad = ctx.createLinearGradient(24, 24, W - 24, 24);
    bandGrad.addColorStop(0, `${theme.borderColor}90`);
    bandGrad.addColorStop(0.5, `${theme.borderColor}DD`);
    bandGrad.addColorStop(1, `${theme.borderColor}90`);
    ctx.fillStyle = bandGrad;
    ctx.beginPath();
    ctx.roundRect(24, 24, W - 48, 44, [14, 14, 0, 0]);
    ctx.fill();

    ctx.font = 'bold 16px GoogleSans';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(theme.label, W / 2, 52);
    ctx.shadowBlur = 0;

    ctx.font = '14px GoogleSans';
    ctx.fillStyle = theme.accentColor;
    ctx.fillText(
      '★'.repeat(theme.stars) + '☆'.repeat(5 - theme.stars),
      W / 2,
      66,
    );

    // Element badge
    if (elem) {
      ctx.fillStyle = `${elem.color}40`;
      ctx.beginPath();
      ctx.arc(W - 56, 36, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '14px GoogleSans';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(elem.emoji, W - 56, 41);
    }

    // Character image
    const imgY = 78,
      imgH = 380,
      imgW = W - 60,
      imgX = 30;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, imgW, imgH, 12);
    ctx.fill();

    const charImg = await safeLoadImg(card.imageUrl);
    if (charImg) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgW, imgH, 12);
      ctx.clip();
      const aspect =
        (charImg as { width: number; height: number }).width /
        (charImg as { width: number; height: number }).height;
      let dW = imgW,
        dH = imgH,
        dX = imgX,
        dY = imgY;
      if (aspect > imgW / imgH) {
        dH = imgW / aspect;
        dY = imgY + (imgH - dH) / 2;
      } else {
        dW = imgH * aspect;
        dX = imgX + (imgW - dW) / 2;
      }
      ctx.drawImage(
        charImg as Parameters<typeof ctx.drawImage>[0],
        dX,
        dY,
        dW,
        dH,
      );
      const vigBot = ctx.createLinearGradient(0, imgY, 0, imgY + imgH);
      vigBot.addColorStop(0, 'rgba(0,0,0,0.15)');
      vigBot.addColorStop(0.3, 'rgba(0,0,0,0)');
      vigBot.addColorStop(0.65, 'rgba(0,0,0,0)');
      vigBot.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.fillStyle = vigBot;
      ctx.fillRect(imgX, imgY, imgW, imgH);
      ctx.restore();
    }
    ctx.strokeStyle = `${theme.borderColor}60`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, imgW, imgH, 12);
    ctx.stroke();

    // Name
    const nameY = imgY + imgH + 38;
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px GoogleSans';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    let dn = card.name;
    while (ctx.measureText(dn).width > W - 80 && dn.length > 10)
      dn = `${dn.substring(0, dn.length - 2)}…`;
    ctx.fillText(dn, W / 2, nameY);
    ctx.shadowBlur = 0;

    if (card.nameJp) {
      ctx.font = '15px GoogleSans';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillText(card.nameJp, W / 2, nameY + 24);
    }

    // Series badge
    const seriesY = nameY + (card.nameJp ? 48 : 30);
    const seriesText = card.series.replace(/_/g, ' ');
    ctx.font = 'bold 12px GoogleSans';
    const sW = ctx.measureText(seriesText).width + 28;
    ctx.fillStyle = `${theme.borderColor}20`;
    ctx.beginPath();
    ctx.roundRect(W / 2 - sW / 2, seriesY - 14, sW, 22, 11);
    ctx.fill();
    ctx.fillStyle = theme.accentColor;
    ctx.fillText(seriesText, W / 2, seriesY + 2);

    // Stats
    let contentY = seriesY + 20;
    if (card.beyblade) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.beginPath();
      ctx.roundRect(36, contentY, W - 72, 30, 8);
      ctx.fill();
      ctx.font = 'bold 12px GoogleSans';
      ctx.fillStyle = theme.accentColor;
      ctx.textAlign = 'left';
      ctx.fillText(`🌀 ${card.beyblade}`, 48, contentY + 20);
      ctx.textAlign = 'center';
      contentY += 38;
    }

    // Stat bars
    const drawBar = (
      bx: number,
      by: number,
      bw: number,
      value: number,
      max: number,
      label: string,
      color: string,
    ) => {
      const pct = Math.min(value / max, 1);
      ctx.font = 'bold 11px GoogleSans';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'left';
      ctx.fillText(label, bx, by + 10);
      const barX = bx + 36,
        barW = bw - 36;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.roundRect(barX, by + 2, barW, 10, 5);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(barX, by + 2, barW * pct, 10, 5);
      ctx.fill();
      ctx.font = '9px GoogleSans';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.fillText(String(value), bx + bw, by + 10);
    };

    const statsW = (W - 72 - 16) / 2;
    drawBar(36, contentY, statsW, card.att, 100, 'ATT', '#ef4444');
    drawBar(
      36 + statsW + 16,
      contentY,
      statsW,
      card.def,
      100,
      'DEF',
      '#3b82f6',
    );
    contentY += 20;
    drawBar(36, contentY, statsW, card.end, 100, 'END', '#22d3ee');
    drawBar(
      36 + statsW + 16,
      contentY,
      statsW,
      card.equilibre,
      100,
      'ÉQU',
      '#22c55e',
    );

    // Footer
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.roundRect(24, H - 68, W - 48, 50, [0, 0, 14, 14]);
    ctx.fill();
    ctx.font = 'bold 13px GoogleSans';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('rpbey.fr · RPB Gacha', W / 2, H - 38);

    const buffer = canvas.toBuffer('image/png');
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Gacha card generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate card' },
      { status: 500 },
    );
  }
}
