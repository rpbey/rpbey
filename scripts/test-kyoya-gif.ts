/**
 * Animated holographic GIF — Kyoya card + Beyblade X lightning VFX.
 * Usage: pnpm tsx scripts/test-kyoya-gif.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { AttachmentBuilder, Client, GatewayIntentBits } from 'discord.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

const YOYO_ID = '281114294152724491';
const CLEAN_ART = '/gacha/kyoya-clean.png'; // version sans éclairs artiste
const W = 640, H = 900, FRAMES = 24, DELAY = 50;

type Ctx = ReturnType<ReturnType<typeof createCanvas>['getContext']>;
type Pt = { x: number; y: number };
const rand = (a: number, b: number) => a + Math.random() * (b - a);

// ─── Beyblade X Lightning Bolt Generator ────────────────────────────────────

function generateBolt(
  sx: number, sy: number,
  angle: number, segs: number,
  segLen: [number, number], deviation: number,
): Pt[][] {
  const paths: Pt[][] = [];
  const trunk: Pt[] = [{ x: sx, y: sy }];
  let cx = sx, cy = sy;

  for (let s = 0; s < segs; s++) {
    const len = rand(segLen[0], segLen[1]);
    const a = angle + rand(-deviation, deviation);
    cx += Math.cos(a) * len;
    cy += Math.sin(a) * len;
    trunk.push({ x: cx, y: cy });

    // Branch fork ~30%
    if (Math.random() < 0.3 && s < segs - 1) {
      const branch: Pt[] = [{ x: cx, y: cy }];
      let bx = cx, by = cy;
      const ba = a + rand(-1.2, 1.2);
      for (let b = 0; b < 2 + Math.floor(rand(0, 2)); b++) {
        bx += Math.cos(ba + rand(-0.5, 0.5)) * rand(segLen[0] * 0.3, segLen[1] * 0.5);
        by += Math.sin(ba + rand(-0.5, 0.5)) * rand(segLen[0] * 0.3, segLen[1] * 0.5);
        branch.push({ x: bx, y: by });
      }
      paths.push(branch);
    }
  }
  paths.unshift(trunk);
  return paths;
}

// Triple-pass bolt: wide glow → colored stroke → white core (Beyblade X style)
function drawBolt(ctx: Ctx, pts: Pt[], color: string, w: number, glow: number, alpha: number) {
  if (pts.length < 2) return;
  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0]!.x, pts[0]!.y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
  };

  // Pass 1: outer glow
  ctx.save();
  ctx.globalAlpha = alpha * 0.3;
  ctx.strokeStyle = color;
  ctx.lineWidth = w * 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = glow * 2;
  trace(); ctx.stroke();
  ctx.restore();

  // Pass 2: main color
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'bevel';
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  trace(); ctx.stroke();
  ctx.restore();

  // Pass 3: white-hot core
  ctx.save();
  ctx.globalAlpha = alpha * 0.75;
  ctx.strokeStyle = '#e0f4ff';
  ctx.lineWidth = Math.max(w * 0.35, 1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = glow * 0.4;
  trace(); ctx.stroke();
  ctx.restore();
}

// ─── Beyblade X Lightning VFX (re-generated each frame for crackling) ───────

// Leone green palette
const BX_COLORS = ['#22c55e', '#4ade80', '#16a34a', '#39ff14', '#86efac'];

function drawLightningVFX(ctx: Ctx, w: number, h: number) {
  ctx.save();

  // Radial glow source (upper-right)
  const gx = w * 0.72, gy = h * 0.06;
  const radial = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * 0.4);
  radial.addColorStop(0, 'rgba(34,197,94,0.15)');
  radial.addColorStop(0.3, 'rgba(34,197,94,0.05)');
  radial.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';

  // 2 main bolts only
  for (let i = 0; i < 2; i++) {
    const sx = w * 0.55 + rand(0, w * 0.35);
    const sy = rand(-h * 0.02, h * 0.12);
    const angle = Math.PI * 0.6 + rand(-0.25, 0.25);
    const paths = generateBolt(sx, sy, angle, 4 + Math.floor(rand(0, 3)), [50, 130], 0.6);
    const color = BX_COLORS[Math.floor(rand(0, 3))]!;
    const mw = rand(2, 4);

    for (let p = 0; p < paths.length; p++) {
      drawBolt(ctx, paths[p]!, color,
        p === 0 ? mw : mw * 0.4,
        p === 0 ? rand(14, 24) : rand(5, 12),
        p === 0 ? rand(0.7, 0.9) : rand(0.3, 0.55));
    }
  }

  // 3 thinner secondary bolts
  for (let i = 0; i < 3; i++) {
    const sx = w * 0.4 + rand(0, w * 0.5);
    const sy = rand(-h * 0.01, h * 0.2);
    const angle = Math.PI * 0.55 + rand(-0.4, 0.4);
    const paths = generateBolt(sx, sy, angle, 2 + Math.floor(rand(0, 2)), [20, 65], 0.8);
    const color = BX_COLORS[Math.floor(rand(0, BX_COLORS.length))]!;
    for (const pts of paths) {
      drawBolt(ctx, pts, color, rand(1, 2), rand(6, 12), rand(0.25, 0.5));
    }
  }

  // 5 spark particles
  for (let i = 0; i < 5; i++) {
    const sx = w * 0.45 + rand(0, w * 0.5);
    const sy = rand(0, h * 0.35);
    const size = rand(1.5, 5);
    ctx.save();
    ctx.globalAlpha = rand(0.35, 0.85);
    ctx.fillStyle = '#86efac';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = size * 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy - size);
    ctx.lineTo(sx + size * 0.18, sy - size * 0.18);
    ctx.lineTo(sx + size, sy);
    ctx.lineTo(sx + size * 0.18, sy + size * 0.18);
    ctx.lineTo(sx, sy + size);
    ctx.lineTo(sx - size * 0.18, sy + size * 0.18);
    ctx.lineTo(sx - size, sy);
    ctx.lineTo(sx - size * 0.18, sy - size * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// ─── Smooth lightning: pre-generate keyframe bolt sets, interpolate between ──

interface BoltSet {
  paths: Pt[][];
  color: string;
  width: number;
  glow: number;
  alpha: number;
  isTrunk: boolean[];
}

function generateBoltSet(): BoltSet[] {
  const bolts: BoltSet[] = [];

  // 2 main bolts
  for (let i = 0; i < 2; i++) {
    const sx = W * 0.55 + rand(0, W * 0.35);
    const sy = rand(-H * 0.02, H * 0.12);
    const angle = Math.PI * 0.6 + rand(-0.25, 0.25);
    const paths = generateBolt(sx, sy, angle, 4 + Math.floor(rand(0, 3)), [50, 130], 0.6);
    const color = BX_COLORS[Math.floor(rand(0, 3))]!;
    const mw = rand(2, 4);
    bolts.push({
      paths,
      color,
      width: mw,
      glow: rand(14, 24),
      alpha: rand(0.7, 0.9),
      isTrunk: paths.map((_, idx) => idx === 0),
    });
  }

  // 3 thinner secondary
  for (let i = 0; i < 3; i++) {
    const sx = W * 0.4 + rand(0, W * 0.5);
    const sy = rand(-H * 0.01, H * 0.2);
    const angle = Math.PI * 0.55 + rand(-0.4, 0.4);
    const paths = generateBolt(sx, sy, angle, 2 + Math.floor(rand(0, 2)), [20, 65], 0.8);
    const color = BX_COLORS[Math.floor(rand(0, BX_COLORS.length))]!;
    bolts.push({
      paths,
      color,
      width: rand(1, 2),
      glow: rand(6, 12),
      alpha: rand(0.25, 0.5),
      isTrunk: paths.map(() => false),
    });
  }

  return bolts;
}

/** Interpolate between two bolt sets with a small jitter for organic motion */
function lerpBoltSets(a: BoltSet[], b: BoltSet[], t: number, jitter: number): BoltSet[] {
  const result: BoltSet[] = [];
  const count = Math.min(a.length, b.length);

  for (let i = 0; i < count; i++) {
    const ba = a[i]!, bb = b[i]!;
    const paths: Pt[][] = [];
    const pathCount = Math.min(ba.paths.length, bb.paths.length);

    for (let p = 0; p < pathCount; p++) {
      const pa = ba.paths[p]!, pb = bb.paths[p]!;
      const ptCount = Math.min(pa.length, pb.length);
      const pts: Pt[] = [];
      for (let k = 0; k < ptCount; k++) {
        pts.push({
          x: pa[k]!.x + (pb[k]!.x - pa[k]!.x) * t + rand(-jitter, jitter),
          y: pa[k]!.y + (pb[k]!.y - pa[k]!.y) * t + rand(-jitter, jitter),
        });
      }
      paths.push(pts);
    }

    result.push({
      paths,
      color: t < 0.5 ? ba.color : bb.color,
      width: ba.width + (bb.width - ba.width) * t,
      glow: ba.glow + (bb.glow - ba.glow) * t,
      alpha: ba.alpha + (bb.alpha - ba.alpha) * t,
      isTrunk: ba.isTrunk,
    });
  }
  return result;
}

// ─── Frame renderer (lightning only, no holo shimmer) ───────────────────────

function renderFrameWithBolts(
  ctx: Ctx, w: number, h: number,
  bolts: BoltSet[], sparkSeed: number,
) {
  ctx.save();

  // Subtle radial glow source
  const gx = w * 0.72, gy = h * 0.06;
  const radial = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * 0.4);
  radial.addColorStop(0, 'rgba(34,197,94,0.12)');
  radial.addColorStop(0.3, 'rgba(34,197,94,0.04)');
  radial.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';

  // Draw interpolated bolts
  for (const bolt of bolts) {
    for (let p = 0; p < bolt.paths.length; p++) {
      const trunk = bolt.isTrunk[p];
      drawBolt(ctx, bolt.paths[p]!, bolt.color,
        trunk ? bolt.width : bolt.width * 0.4,
        trunk ? bolt.glow : bolt.glow * 0.5,
        trunk ? bolt.alpha : bolt.alpha * 0.6);
    }
  }

  // A few sparks with slight position variation per frame
  for (let i = 0; i < 4; i++) {
    const seed = i * 137.508 + sparkSeed * 23.7;
    const sx = ((seed * 5.13) % (w * 0.55)) + w * 0.4;
    const sy = ((seed * 3.47) % (h * 0.35));
    const size = 2 + Math.sin(sparkSeed * 0.8 + i) * 1.5;
    const alpha = 0.4 + Math.sin(sparkSeed * 1.2 + i * 0.7) * 0.3;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#86efac';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = size * 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy - size);
    ctx.lineTo(sx + size * 0.18, sy - size * 0.18);
    ctx.lineTo(sx + size, sy);
    ctx.lineTo(sx + size * 0.18, sy + size * 0.18);
    ctx.lineTo(sx, sy + size);
    ctx.lineTo(sx - size * 0.18, sy + size * 0.18);
    ctx.lineTo(sx - size, sy);
    ctx.lineTo(sx - size * 0.18, sy - size * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('⚡ Generating Kyoya GIF with Beyblade X lightning VFX...\n');

  // Step 1: generate the static TCG card from the clean artwork (no artist effects)
  const { generateGachaCard } = await import('../bot/src/lib/canvas-utils.js');
  console.log('🎴 Generating static card from clean artwork...');
  const staticCard = await generateGachaCard({
    name: 'Kyoya Tategami',
    nameJp: '盾神キョウヤ',
    series: 'METAL_FUSION',
    rarity: 'SUPER_RARE',
    beyblade: 'Rock Leone',
    beybladeImageUrl: '/gacha/rock-leone.webp',
    description: 'Le lion solitaire. Sa féroce détermination et Leone font trembler tous les stadiums.',
    imageUrl: CLEAN_ART,
    isDuplicate: false,
    isWished: false,
    balance: 0,
    element: 'TERRE',
    fullArt: true,
    artist: '',
    themeOverride: {
      headerBg: '#166534',      // vert foncé Leone
      borderColor: '#22c55e',   // vert Leone
      accentColor: '#4ade80',   // vert clair
      frameColor: '#16a34a',    // vert cadre
    },
  });
  console.log(`  Static card: ${(staticCard.length / 1024).toFixed(0)} KB`);

  const base = await loadImage(staticCard);
  console.log(`📷 Base: ${base.width}x${base.height}`);

  // Pre-generate 4 keyframe bolt sets for smooth interpolation
  const KEYFRAMES = 4;
  const keyBolts: BoltSet[][] = [];
  for (let k = 0; k < KEYFRAMES + 1; k++) {
    keyBolts.push(generateBoltSet());
  }
  // Loop: last keyframe = first keyframe for seamless loop
  keyBolts[KEYFRAMES] = keyBolts[0]!;

  console.log(`🎬 Rendering ${FRAMES} frames (smooth interpolation, ${KEYFRAMES} keyframes)...`);
  const pngs: Buffer[] = [];
  for (let i = 0; i < FRAMES; i++) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Draw base card
    ctx.drawImage(base, 0, 0, W, H);

    // Interpolate between keyframes
    const progress = i / FRAMES; // 0..1
    const keyPos = progress * KEYFRAMES;
    const keyA = Math.floor(keyPos);
    const keyB = keyA + 1;
    const t = keyPos - keyA; // 0..1 between two keyframes
    const smoothT = t * t * (3 - 2 * t); // smoothstep for fluid motion

    const bolts = lerpBoltSets(keyBolts[keyA]!, keyBolts[keyB]!, smoothT, 3);
    renderFrameWithBolts(ctx, W, H, bolts, i);

    pngs.push(Buffer.from(canvas.toBuffer('image/png')));
    process.stdout.write(`  ${i + 1}/${FRAMES}\r`);
  }
  console.log(`  ✅ Done`);

  console.log('🔧 Assembling GIF...');
  const composites = pngs.slice(1).map((buf, i) => ({ input: buf, top: (i + 1) * H, left: 0 }));
  const tall = await sharp(pngs[0]!)
    .extend({ bottom: H * (FRAMES - 1), background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .composite(composites).png().toBuffer();
  const raw = await sharp(tall).ensureAlpha().raw().toBuffer();

  const gif = await sharp(raw, {
    raw: { width: W, height: H * FRAMES, channels: 4,
      // @ts-expect-error — pageHeight is valid libvips option
      pageHeight: H },
  }).gif({
    delay: Array.from({ length: FRAMES }, () => DELAY),
    loop: 0, colours: 180, dither: 0.4, effort: 8,
  }).toBuffer();

  console.log(`✅ GIF: ${(gif.length / 1024).toFixed(0)} KB\n`);

  const out = path.resolve('public/gacha/kyoya-holo.gif');
  await fs.writeFile(out, gif);
  console.log(`💾 ${out}`);

  console.log('📨 Sending DM...');
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages] });
  await client.login(process.env.DISCORD_TOKEN);
  try {
    const user = await client.users.fetch(YOYO_ID);
    await user.send({
      content: `⚡ **Kyoya — SUPER RARE (éclairs verts fluides)**\n\nArtwork clean + éclairs verts Leone, interpolation smoothstep entre keyframes.\nPas de shimmer/holo, juste les éclairs.\n*${FRAMES}f · ${DELAY}ms · ${(gif.length / 1024).toFixed(0)}KB*`,
      files: [new AttachmentBuilder(gif, { name: 'kyoya-bx-lightning.gif' })],
    });
    console.log('✅ Sent!');
  } catch (e) { console.error('❌', e); }
  client.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
