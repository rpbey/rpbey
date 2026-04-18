/**
 * Generate Kyoya SUPER_RARE TCG card with canvas energy effects
 * and send it as a DM to Yoyo via the Discord bot.
 *
 * Usage: pnpm tsx scripts/test-kyoya-card.ts
 */


import { createCanvas, loadImage } from '@napi-rs/canvas';
import { Client, GatewayIntentBits, AttachmentBuilder } from 'discord.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// We import generateGachaCard from the bot's canvas-utils
import { generateGachaCard } from '../bot/src/lib/canvas-utils.js';

const YOYO_ID = '281114294152724491';
const KYOYA_IMG = path.resolve('tmp-drive/TCG/Kyoya Lr/kyoya batch 1 without effect.png');
const EFFECT_IMG = path.resolve('tmp-drive/TCG/Kyoya Lr/kyoya batch 1 effect.png');
const COMPOSITE_OUT = path.resolve('tmp-drive/TCG/kyoya-composite.png');
const COMPOSITE_PUBLIC = path.resolve('public/gacha/kyoya-composite.png');

// ─── Energy Effect Generator (v2 — high-quality Leone energy) ────────────────

type Pt = { x: number; y: number };
const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Generate a single angular bolt path with branches.
 * Each bolt = main trunk + 0-3 branch forks.
 */
function generateBolt(
  startX: number,
  startY: number,
  mainAngle: number,
  segments: number,
  segLen: [number, number],
  deviation: number,
): Pt[][] {
  const paths: Pt[][] = [];
  const trunk: Pt[] = [{ x: startX, y: startY }];

  let cx = startX;
  let cy = startY;
  for (let s = 0; s < segments; s++) {
    const len = rand(segLen[0], segLen[1]);
    const angle = mainAngle + rand(-deviation, deviation);
    cx += Math.cos(angle) * len;
    cy += Math.sin(angle) * len;
    trunk.push({ x: cx, y: cy });

    // Fork a branch at ~30% of joints
    if (Math.random() < 0.3 && s < segments - 1) {
      const branch: Pt[] = [{ x: cx, y: cy }];
      let bx = cx;
      let by = cy;
      const branchAngle = angle + rand(-1.2, 1.2);
      const branchSegs = 2 + Math.floor(rand(0, 3));
      for (let b = 0; b < branchSegs; b++) {
        const bLen = rand(segLen[0] * 0.4, segLen[1] * 0.6);
        const bAngle = branchAngle + rand(-0.6, 0.6);
        bx += Math.cos(bAngle) * bLen;
        by += Math.sin(bAngle) * bLen;
        branch.push({ x: bx, y: by });
      }
      paths.push(branch);
    }
  }
  paths.unshift(trunk); // trunk first
  return paths;
}

/**
 * Draw a single bolt path with triple-pass rendering:
 * 1. Wide outer glow (blurred, low alpha)
 * 2. Main colored stroke
 * 3. Bright white inner core
 */
function drawBoltPath(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  pts: Pt[],
  color: string,
  width: number,
  glowSize: number,
  alpha: number,
) {
  if (pts.length < 2) return;

  const tracePath = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0]!.x, pts[0]!.y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
  };

  // Pass 1: wide outer glow
  ctx.save();
  ctx.globalAlpha = alpha * 0.35;
  ctx.strokeStyle = color;
  ctx.lineWidth = width * 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = glowSize * 2;
  tracePath();
  ctx.stroke();
  ctx.restore();

  // Pass 2: main colored line
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'bevel';
  ctx.shadowColor = color;
  ctx.shadowBlur = glowSize;
  tracePath();
  ctx.stroke();
  ctx.restore();

  // Pass 3: bright white core
  ctx.save();
  ctx.globalAlpha = alpha * 0.7;
  ctx.strokeStyle = '#e0ffe0';
  ctx.lineWidth = Math.max(width * 0.35, 1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = glowSize * 0.5;
  tracePath();
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw Leone's green energy effects on a canvas.
 * Analyzed from the artist's effect layer:
 * - Angular lightning bolts from upper-right
 * - Bright/neon green with white-hot cores
 * - Multiple main strands with forking branches
 * - Strong glow bloom
 */
function drawEnergyEffects(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  w: number,
  h: number,
) {
  const greens = ['#22c55e', '#4ade80', '#39ff14', '#00ff41', '#16a34a'];

  ctx.save();

  // Large radial glow at energy source (upper-right)
  const glowX = w * 0.68;
  const glowY = h * 0.08;
  const radGlow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, w * 0.45);
  radGlow.addColorStop(0, 'rgba(34, 197, 94, 0.25)');
  radGlow.addColorStop(0.3, 'rgba(34, 197, 94, 0.10)');
  radGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = radGlow;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';

  // Main bolts (6 large, prominent)
  for (let i = 0; i < 6; i++) {
    const sx = w * 0.50 + rand(0, w * 0.45);
    const sy = rand(-h * 0.03, h * 0.18);
    const angle = Math.PI * 0.65 + rand(-0.35, 0.35);
    const paths = generateBolt(sx, sy, angle, 5 + Math.floor(rand(0, 4)), [60, 160], 0.7);
    const color = greens[Math.floor(rand(0, 3))]!;
    const mainW = rand(3, 6);

    for (let p = 0; p < paths.length; p++) {
      const isTrunk = p === 0;
      drawBoltPath(
        ctx,
        paths[p]!,
        color,
        isTrunk ? mainW : mainW * 0.5,
        isTrunk ? rand(18, 30) : rand(8, 16),
        isTrunk ? rand(0.8, 1.0) : rand(0.4, 0.7),
      );
    }
  }

  // Secondary bolts (10 thinner, fill the gaps)
  for (let i = 0; i < 10; i++) {
    const sx = w * 0.40 + rand(0, w * 0.55);
    const sy = rand(-h * 0.01, h * 0.28);
    const angle = Math.PI * 0.6 + rand(-0.5, 0.5);
    const paths = generateBolt(sx, sy, angle, 3 + Math.floor(rand(0, 3)), [30, 90], 0.9);
    const color = greens[Math.floor(rand(1, greens.length))]!;

    for (const pts of paths) {
      drawBoltPath(ctx, pts, color, rand(1.5, 3), rand(10, 18), rand(0.4, 0.7));
    }
  }

  // Energy sparks (small bright dots along the upper-right area)
  for (let i = 0; i < 15; i++) {
    const sx = w * 0.45 + rand(0, w * 0.5);
    const sy = rand(0, h * 0.35);
    const size = rand(2, 8);
    ctx.save();
    ctx.globalAlpha = rand(0.5, 1.0);
    ctx.fillStyle = '#86efac';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = size * 3;
    ctx.beginPath();
    // 4-point star sparkle
    ctx.moveTo(sx, sy - size);
    ctx.lineTo(sx + size * 0.2, sy - size * 0.2);
    ctx.lineTo(sx + size, sy);
    ctx.lineTo(sx + size * 0.2, sy + size * 0.2);
    ctx.lineTo(sx, sy + size);
    ctx.lineTo(sx - size * 0.2, sy + size * 0.2);
    ctx.lineTo(sx - size, sy);
    ctx.lineTo(sx - size * 0.2, sy - size * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎴 Generating Kyoya full-art card (original artist effects)...\n');

  // Use the original image WITH artist effects (green lightning on hand)
  const KYOYA_ORIGINAL = path.resolve('tmp-drive/TCG/Kyoya Lr/kyoya batch 1.png');
  const PUBLIC_PATH = path.resolve('public/gacha/kyoya-original.png');

  // Copy to public/ so the card generator can load it
  await fs.mkdir(path.dirname(PUBLIC_PATH), { recursive: true });
  await fs.copyFile(KYOYA_ORIGINAL, PUBLIC_PATH);
  console.log('📷 Using original artwork with artist effects');

  // Generate TCG card — full-art mode, no cropping
  const cardBuffer = await generateGachaCard({
    name: 'Kyoya Tategami',
    nameJp: '盾神キョウヤ',
    series: 'METAL_FUSION',
    rarity: 'SUPER_RARE',
    beyblade: 'Rock Leone',
    beybladeImageUrl: '/gacha/rock-leone.webp',
    description: 'Le lion solitaire. Sa féroce détermination et Leone font trembler tous les stadiums.',
    imageUrl: '/gacha/kyoya-original.png',
    isDuplicate: false,
    isWished: false,
    balance: 0,
    element: 'TERRE',
    fullArt: true,
    artist: '',
  });

  const cardPath = path.resolve('tmp-drive/TCG/kyoya-card-sr.png');
  await fs.writeFile(cardPath, cardBuffer);
  console.log(`🎴 Card saved: ${cardPath} (${(cardBuffer.length / 1024).toFixed(0)} KB)`);

  // Send DM to Yoyo
  console.log('\n📨 Connecting to Discord...');
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  });

  await client.login(process.env.DISCORD_TOKEN);
  console.log(`✅ Logged in as ${client.user?.tag}`);

  try {
    const user = await client.users.fetch(YOYO_ID);
    const cardAttachment = new AttachmentBuilder(cardBuffer, {
      name: 'kyoya-super-rare.png',
    });

    await user.send({
      content: '🎴 **Kyoya Tategami — SUPER RARE (full-art)**\nDessin original avec effets artiste, pas de crop.',
      files: [cardAttachment],
    });

    console.log('✅ DM sent to Yoyo!');
  } catch (err) {
    console.error('❌ Failed to send DM:', err);
  }

  await client.destroy();
  console.log('\n🎴 Done!');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
