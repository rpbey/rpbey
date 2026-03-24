import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import sharp from 'sharp';

import { resolveRootPath } from './paths.js';

const getAssetPath = (relative: string) => resolveRootPath(relative);

// Register fonts
const fontPath = getAssetPath(
  'public/Google_Sans_Flex/static/GoogleSansFlex_72pt-Bold.ttf',
);
GlobalFonts.registerFromPath(fontPath, 'GoogleSans');

// Register emoji font for canvas text rendering
try {
  GlobalFonts.registerFromPath(
    '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf',
    'NotoEmoji',
  );
} catch {
  // Emoji font not available — fallback to text symbols
}

// Font string with emoji fallback
const _FONT = (weight: string, size: number) =>
  `${weight} ${size}px GoogleSans, NotoEmoji, sans-serif`;

type CanvasImage = Awaited<ReturnType<typeof loadImage>>;

const NON_TRANSPARENT_EXTS = /\.(jpe?g|webp|bmp|tiff?)(\?.*)?$/i;

/**
 * Remove white/light backgrounds from images.
 * Uses sharp unflatten for simple cases, then applies a pixel-level
 * threshold to catch near-white (#F0F0F0+) backgrounds with tolerance.
 */
async function removeWhiteBackground(input: string | Buffer): Promise<Buffer> {
  // First pass: sharp unflatten handles pure white
  const unflattened = await sharp(input).unflatten().png().toBuffer();

  // Second pass: threshold-based removal for near-white pixels
  // This catches light grey backgrounds (#F0F0F0+)
  const { data, info } = await sharp(unflattened)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = 240; // Pixels with R,G,B all >= 240 → transparent
  const pixels = new Uint8Array(data.buffer, data.byteOffset, data.length);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]!;
    const g = pixels[i + 1]!;
    const b = pixels[i + 2]!;
    if (r >= threshold && g >= threshold && b >= threshold) {
      pixels[i + 3] = 0; // Set alpha to 0
    }
  }

  return sharp(Buffer.from(pixels.buffer), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

// Domains where we should NOT apply white background removal (avatars, CDN)
const SKIP_BG_REMOVAL_DOMAINS = [
  'cdn.discordapp.com',
  'cdn.discord.com',
  'images-ext-',
  'media.discordapp.net',
];

async function safeLoadImage(url: string | null): Promise<CanvasImage | null> {
  if (!url) return null;
  try {
    let imageToLoad: string | Buffer = url;
    if (url.startsWith('/')) {
      imageToLoad = getAssetPath(`public${url}`);
    }

    // Skip bg removal for avatar/CDN URLs — they don't need it
    const isExternalAvatar =
      typeof imageToLoad === 'string' &&
      SKIP_BG_REMOVAL_DOMAINS.some((d) => imageToLoad.toString().includes(d));

    // Remove white background only for local non-transparent formats
    if (
      !isExternalAvatar &&
      typeof imageToLoad === 'string' &&
      NON_TRANSPARENT_EXTS.test(imageToLoad)
    ) {
      if (imageToLoad.startsWith('http')) {
        const res = await fetch(imageToLoad);
        const buf = Buffer.from(await res.arrayBuffer());
        imageToLoad = await removeWhiteBackground(buf);
      } else {
        imageToLoad = await removeWhiteBackground(imageToLoad);
      }
    }

    // For HTTP URLs that weren't processed above, fetch as buffer first
    if (typeof imageToLoad === 'string' && imageToLoad.startsWith('http')) {
      const res = await fetch(imageToLoad);
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return await loadImage(buf);
    }

    return await loadImage(imageToLoad);
  } catch (_e) {
    return null;
  }
}

/**
 * Force-remove white background even for PNG images.
 * Use this specifically for character/portrait images that may have
 * white backgrounds even in PNG format.
 */
async function _loadImageNoWhiteBg(
  url: string | null,
): Promise<CanvasImage | null> {
  if (!url) return null;
  try {
    let source: string | Buffer = url;
    if (url.startsWith('/')) {
      source = getAssetPath(`public${url}`);
    }
    if (typeof source === 'string' && source.startsWith('http')) {
      const res = await fetch(source);
      source = Buffer.from(await res.arrayBuffer());
    }
    const cleaned = await removeWhiteBackground(source);
    return await loadImage(cleaned);
  } catch (_e) {
    return null;
  }
}

/** Load image directly without white background removal */
async function _loadImageDirect(
  url: string | null,
): Promise<CanvasImage | null> {
  if (!url) return null;
  try {
    let source: string | Buffer = url;
    if (url.startsWith('/')) {
      source = getAssetPath(`public${url}`);
    }
    if (typeof source === 'string' && source.startsWith('http')) {
      const res = await fetch(source);
      source = Buffer.from(await res.arrayBuffer());
    }
    return await loadImage(source);
  } catch (_e) {
    return null;
  }
}

export async function generateWelcomeImage(
  displayName: string,
  avatarUrl: string,
  memberCount: number,
) {
  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const [background, avatar] = await Promise.all([
    safeLoadImage('/banner.png'),
    safeLoadImage(avatarUrl),
  ]);

  if (background) ctx.drawImage(background, 0, 0, width, height);
  else {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.beginPath();
  ctx.arc(150, 200, 100, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  if (avatar) ctx.drawImage(avatar, 50, 100, 200, 200);
  else {
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(150, 200, 100, 0, Math.PI * 2, true);
  ctx.stroke();

  ctx.font = 'bold 48px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('BIENVENUE À LA', 300, 150);
  ctx.font = 'bold 64px GoogleSans';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('RPB !', 300, 210);
  ctx.font = '32px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(displayName.toUpperCase(), 300, 270);
  ctx.font = '24px GoogleSans';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(`MEMBRE #${memberCount}`, 300, 310);

  return canvas.toBuffer('image/png');
}

export interface ProfileCardData {
  bladerName: string;
  avatarUrl: string;
  rankTitle: string;
  rank: number;
  wins: number;
  losses: number;
  tournamentWins: number;
  tournamentsPlayed: number;
  rankingPoints: number;
  joinedAt: string;
  currentStreak: number;
  bestStreak: number;
  winRate: string;
  activeDeck?: {
    name: string;
    blades: { name: string; imageUrl: string | null }[];
  } | null;
}

export async function generateProfileCard(data: ProfileCardData) {
  const width = 1000;
  const height = 750;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const [background, avatar, logo, ...bladeImages] = await Promise.all([
    safeLoadImage('/canvas.png'),
    safeLoadImage(data.avatarUrl),
    safeLoadImage('/logo.png'),
    ...(data.activeDeck?.blades.map((b) => safeLoadImage(b.imageUrl)) || []),
  ]);

  if (background) ctx.drawImage(background, 0, 0, width, height);
  else {
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, width, height);
  }

  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.beginPath();
  ctx.roundRect(20, 20, width - 40, height - 40, 20);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(180, 180, 130, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  if (avatar) ctx.drawImage(avatar, 50, 50, 260, 260);
  else {
    ctx.fillStyle = '#444';
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(180, 180, 130, 0, Math.PI * 2, true);
  ctx.stroke();

  ctx.font = 'bold 64px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.bladerName.toUpperCase(), 350, 100);

  let badgeColor = '#ffffff';
  if (data.rank === 1) badgeColor = '#FFD700';
  else if (data.rank === 2) badgeColor = '#C0C0C0';
  else if (data.rank === 3) badgeColor = '#CD7F32';
  else if (data.rankTitle === 'Champion') badgeColor = '#fbbf24';
  else if (data.rankTitle === 'Expert') badgeColor = '#f472b6';
  else badgeColor = '#94a3b8';

  ctx.fillStyle = badgeColor;
  ctx.beginPath();
  ctx.roundRect(350, 120, 400, 40, 10);
  ctx.fill();
  ctx.font = 'bold 24px GoogleSans';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.fillText(
    `RANG #${data.rank} • ${data.rankTitle.toUpperCase()}`,
    350 + 200,
    148,
  );
  ctx.textAlign = 'start';

  const drawStat = (
    label: string,
    value: string | number,
    x: number,
    y: number,
    color = '#fbbf24',
    size = 42,
  ) => {
    ctx.font = '20px GoogleSans';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(label, x, y);
    ctx.font = `bold ${size}px GoogleSans`;
    ctx.fillStyle = color;
    ctx.fillText(value.toString(), x, y + size + 8);
  };

  const startY = 230;
  drawStat('POINTS', data.rankingPoints.toLocaleString(), 350, startY);
  drawStat('WIN RATE', data.winRate, 550, startY, '#ffffff');
  drawStat(
    'TOURNOIS',
    `${data.tournamentWins}/${data.tournamentsPlayed}`,
    750,
    startY,
    '#f472b6',
  );
  drawStat('VICTOIRES', data.wins, 350, startY + 100, '#4ade80');
  drawStat('DÉFAITES', data.losses, 550, startY + 100, '#f87171');
  drawStat('TOTAL', data.wins + data.losses, 750, startY + 100, '#ffffff');

  if (data.activeDeck) {
    const deckY = 520;
    ctx.font = 'bold 24px GoogleSans';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(
      `EQUIPEMENT ACTIF : ${data.activeDeck.name.toUpperCase()}`,
      50,
      deckY,
    );

    const bladeSize = 100;
    const spacing = 300;
    for (let i = 0; i < data.activeDeck.blades.length; i++) {
      const blade = data.activeDeck.blades[i];
      const bladeImg = bladeImages[i];
      const x = 100 + i * spacing;
      const y = deckY + 40;

      ctx.save();
      ctx.beginPath();
      ctx.arc(
        x + bladeSize / 2,
        y + bladeSize / 2,
        bladeSize / 2,
        0,
        Math.PI * 2,
      );
      ctx.clip();
      if (bladeImg) ctx.drawImage(bladeImg, x, y, bladeSize, bladeSize);
      else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
      }
      ctx.restore();

      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.font = 'bold 18px GoogleSans';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(
        blade.name.toUpperCase(),
        x + bladeSize / 2,
        y + bladeSize + 30,
      );
      ctx.textAlign = 'start';
    }
  }

  ctx.font = 'italic 20px GoogleSans';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.textAlign = 'right';
  ctx.fillText(`Membre depuis le ${data.joinedAt}`, width - 40, height - 30);

  if (logo) ctx.drawImage(logo, width - 130, 30, 100, 100);

  return canvas.toBuffer('image/png');
}

export interface ComboCardData {
  color: number;
  name: string;
  type: string;
  blade: string;
  ratchet: string;
  bit: string;
  bladeImageUrl: string | null;
  attack: number;
  defense: number;
  stamina: number;
  dash: number;
  weight: number;
}

export async function generateComboCard(data: ComboCardData) {
  const width = 800;
  const height = 550;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const hexColor = `#${data.color.toString(16).padStart(6, '0')}`;

  const [background, bladeImg] = await Promise.all([
    safeLoadImage('/background-seasson-2.webp'),
    safeLoadImage(data.bladeImageUrl),
  ]);

  if (background) ctx.drawImage(background, 0, 0, width, height);
  else {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = hexColor;
  ctx.lineWidth = 15;
  ctx.strokeRect(0, 0, width, height);

  ctx.font = 'bold 50px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(data.name.toUpperCase(), width / 2, 80);

  ctx.fillStyle = hexColor;
  ctx.beginPath();
  ctx.roundRect(width / 2 - 100, 100, 200, 40, 20);
  ctx.fill();
  ctx.font = 'bold 24px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.type.toUpperCase(), width / 2, 128);

  if (bladeImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(150, 275, 100, 0, Math.PI * 2, true);
    ctx.clip();
    ctx.drawImage(bladeImg, 50, 175, 200, 200);
    ctx.restore();
    ctx.strokeStyle = hexColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(150, 275, 100, 0, Math.PI * 2, true);
    ctx.stroke();
  }

  const partsX = data.bladeImageUrl ? 500 : width / 2;
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

  drawPart('BLADE', data.blade, 200);
  drawPart('RATCHET', data.ratchet, 260);
  drawPart('BIT', data.bit, 320);

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

  drawProgressBar('ATTAQUE', data.attack, 380, '#ef4444');
  drawProgressBar('DÉFENSE', data.defense, 420, '#3b82f6');
  drawProgressBar('ENDURANCE', data.stamina, 460, '#22c55e');
  drawProgressBar('DASH', data.dash, 500, '#eab308');

  ctx.textAlign = 'center';
  ctx.font = 'bold 30px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${data.weight}g`, partsX, 350);

  return canvas.toBuffer('image/png');
}

export interface BattleCardData {
  winnerName: string;
  winnerAvatarUrl: string;
  loserName: string;
  loserAvatarUrl: string;
  finishType: string;
  finishMessage: string;
  finishEmoji: string;
}

export async function generateBattleCard(data: BattleCardData) {
  const width = 1000;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const [background, winnerAvatar, loserAvatar] = await Promise.all([
    safeLoadImage('/banner.png'),
    safeLoadImage(data.winnerAvatarUrl),
    safeLoadImage(data.loserAvatarUrl),
  ]);

  if (background) ctx.drawImage(background, 0, 0, width, height);
  else {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, width, height);

  ctx.font = 'italic bold 80px GoogleSans';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.textAlign = 'center';
  ctx.fillText('VS', width / 2, height / 2 + 30);

  const drawAvatar = (
    avatar: CanvasImage | null,
    x: number,
    y: number,
    r: number,
    border: string,
    lw: number,
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, true);
    ctx.clip();
    if (avatar) ctx.drawImage(avatar, x - r, y - r, r * 2, r * 2);
    else {
      ctx.fillStyle = border;
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = border;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, true);
    ctx.stroke();
  };

  drawAvatar(winnerAvatar, 250, 200, 120, '#fbbf24', 10);
  drawAvatar(loserAvatar, 750, 200, 100, '#94a3b8', 5);

  ctx.font = '40px GoogleSans';
  ctx.fillText('🏆', 250, 70);
  ctx.font = 'bold 32px GoogleSans';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(data.winnerName.toUpperCase(), 250, 360);
  ctx.font = 'bold 24px GoogleSans';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(data.loserName.toUpperCase(), 750, 360);

  ctx.font = 'bold 40px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(
    data.finishMessage.replace(/\*\*/g, '').toUpperCase(),
    width / 2,
    height - 40,
  );

  return canvas.toBuffer('image/png');
}

export interface DeckBeyData {
  bladeName: string;
  ratchetName: string;
  bitName: string;
  bladeImageUrl: string | null;
  beyType?: string | null;
  atk: number;
  def: number;
  sta: number;
}

export interface DeckCardData {
  name: string;
  ownerName: string;
  isActive: boolean;
  beys: DeckBeyData[];
}

// Keep backward compat for old callers
export interface DeckCardDataLegacy {
  name: string;
  beys: { name: string; imageUrl: string | null; type?: string }[];
}

function isDeckLegacy(
  data: DeckCardData | DeckCardDataLegacy,
): data is DeckCardDataLegacy {
  return (
    'beys' in data &&
    data.beys.length > 0 &&
    'name' in data.beys[0] &&
    !('bladeName' in data.beys[0])
  );
}

const TYPE_COLORS: Record<string, string> = {
  ATTACK: '#ef4444',
  DEFENSE: '#3b82f6',
  STAMINA: '#22c55e',
  BALANCE: '#a855f7',
};

export async function generateDeckCard(
  data: DeckCardData | DeckCardDataLegacy,
) {
  // Handle legacy format
  if (isDeckLegacy(data)) {
    return generateDeckCardLegacy(data);
  }

  const width = 900;
  const boxH = 500;
  const infoH = 180;
  const height = boxH + infoH;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Load images
  const [background, logo, ...beyImages] = await Promise.all([
    safeLoadImage('/deckbox.png'),
    safeLoadImage('/logo.png'),
    ...data.beys.map((b) => safeLoadImage(b.bladeImageUrl)),
  ]);

  // === Deckbox section ===
  if (background) {
    ctx.drawImage(background, 0, 0, width, boxH);
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

  // Draw Beys in slots (3D perspective)
  const positions = [
    { x: width * 0.21, y: boxH * 0.65 },
    { x: width * 0.5, y: boxH * 0.65 },
    { x: width * 0.79, y: boxH * 0.65 },
  ];
  const beySize = width * 0.2;

  for (let i = 0; i < 3; i++) {
    const bey = data.beys[i];
    const img = beyImages[i];
    const pos = positions[i];
    if (!pos) continue;

    // Slot shadow (ellipse at bottom)
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
      // 3D tilt perspective (like the website's rotateX(45deg) scaleY(0.85))
      ctx.transform(1, 0, 0, 0.82, 0, 0);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 12;

      ctx.drawImage(img, -beySize / 2, -beySize / 2, beySize, beySize);
      ctx.restore();
    } else if (bey) {
      // Empty slot indicator
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

  // === Info section (below deckbox) ===
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
  if (logo) ctx.drawImage(logo, 20, boxH + 15, 40, 40);
  ctx.font = 'bold 26px GoogleSans';
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'left';
  ctx.fillText(data.name.toUpperCase(), 70, boxH + 40);

  ctx.font = '14px GoogleSans';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText(
    `${data.ownerName}${data.isActive ? ' · DECK ACTIF' : ''}`,
    70,
    boxH + 58,
  );

  // Bey info columns
  const colW = (width - 40) / 3;

  for (let i = 0; i < Math.min(data.beys.length, 3); i++) {
    const bey = data.beys[i];
    const cx = 20 + i * colW + colW / 2;
    const baseY = boxH + 80;
    const typeColor = TYPE_COLORS[bey.beyType || ''] || '#888';

    // Type indicator dot
    ctx.beginPath();
    ctx.arc(cx - colW / 2 + 10, baseY + 8, 4, 0, Math.PI * 2);
    ctx.fillStyle = typeColor;
    ctx.fill();

    // Combo name
    ctx.font = 'bold 15px GoogleSans';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    const combo = `${bey.bladeName} ${bey.ratchetName} ${bey.bitName}`;
    // Truncate if needed
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
      { label: 'ATK', value: bey.atk, color: '#ef4444' },
      { label: 'DEF', value: bey.def, color: '#3b82f6' },
      { label: 'STA', value: bey.sta, color: '#22c55e' },
    ];
    const barW = colW - 80;

    for (let si = 0; si < stats.length; si++) {
      const stat = stats[si];
      const sy = baseY + 28 + si * 20;

      ctx.font = '11px GoogleSans';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'left';
      ctx.fillText(stat.label, cx - colW / 2 + 22, sy + 4);

      // Bar background
      const barX = cx - colW / 2 + 55;
      ctx.beginPath();
      ctx.roundRect(barX, sy - 3, barW, 8, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fill();

      // Bar fill
      const fillW = Math.max(4, (stat.value / 100) * barW);
      ctx.beginPath();
      ctx.roundRect(barX, sy - 3, fillW, 8, 4);
      ctx.fillStyle = stat.color;
      ctx.fill();

      // Value
      ctx.font = 'bold 11px GoogleSans';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.textAlign = 'right';
      ctx.fillText(`${stat.value}`, cx + colW / 2 - 10, sy + 4);
    }
  }

  ctx.textAlign = 'left';
  return canvas.toBuffer('image/png');
}

// Legacy version for backward compat (old callers)
async function generateDeckCardLegacy(data: DeckCardDataLegacy) {
  const width = 800;
  const height = 550;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const [background, ...beyImages] = await Promise.all([
    safeLoadImage('/deckbox.png'),
    ...data.beys.map((b) => safeLoadImage(b.imageUrl)),
  ]);

  if (background) {
    ctx.drawImage(background, 0, 0, width, 500);
  } else {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, width, 500);
  }

  const positions = [
    { x: width * 0.21, y: 500 * 0.65 },
    { x: width * 0.5, y: 500 * 0.65 },
    { x: width * 0.79, y: 500 * 0.65 },
  ];
  const beySize = width * 0.22;

  for (let i = 0; i < 3; i++) {
    const img = beyImages[i];
    const pos = positions[i];
    if (img) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.transform(1, 0, 0, 0.85, 0, 0);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 10;
      ctx.drawImage(img, -beySize / 2, -beySize / 2, beySize, beySize);
      ctx.restore();
    }
  }

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 500, width, 50);
  ctx.font = 'bold 28px GoogleSans';
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'left';
  ctx.fillText(data.name.toUpperCase(), 30, 535);
  ctx.textAlign = 'right';
  ctx.font = 'italic 18px GoogleSans';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(data.beys.map((b) => b.name).join('  |  '), width - 30, 535);

  return canvas.toBuffer('image/png');
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  winRate: string | number;
  avatarUrl: string | null;
}

export async function generateLeaderboardCard(entries: LeaderboardEntry[]) {
  const width = 1000;
  const height = 1200;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const [background, ...avatars] = await Promise.all([
    safeLoadImage('/canvas.png'),
    ...entries.map((e) => safeLoadImage(e.avatarUrl)),
  ]);

  if (background) ctx.drawImage(background, 0, 0, width, height);
  else {
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, width, height);
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.font = 'bold 60px GoogleSans';
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'center';
  ctx.fillText('CLASSEMENT OFFICIEL RPB', width / 2, 80);

  const startY = 160;
  const rowHeight = 100;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const avatar = avatars[i];
    const y = startY + i * rowHeight;

    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(50, y - 60, width - 100, rowHeight - 10);
    }

    let rankColor = '#94a3b8';
    if (entry.rank === 1) rankColor = '#fbbf24';
    if (entry.rank === 2) rankColor = '#e2e8f0';
    if (entry.rank === 3) rankColor = '#cd7f32';

    ctx.fillStyle = rankColor;
    ctx.beginPath();
    ctx.arc(100, y - 15, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 32px GoogleSans';
    ctx.fillStyle = '#000';
    ctx.fillText(`#${entry.rank}`, 100, y - 5);

    ctx.save();
    ctx.beginPath();
    ctx.arc(200, y - 15, 40, 0, Math.PI * 2, true);
    ctx.clip();
    if (avatar) ctx.drawImage(avatar, 160, y - 55, 80, 80);
    else {
      ctx.fillStyle = '#444';
      ctx.fill();
    }
    ctx.restore();

    if (entry.rank <= 3) {
      ctx.strokeStyle = rankColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(200, y - 15, 40, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.textAlign = 'left';
    ctx.font = 'bold 36px GoogleSans';
    ctx.fillStyle = entry.rank === 1 ? '#fbbf24' : '#ffffff';
    ctx.fillText(entry.name.toUpperCase(), 280, y);

    ctx.textAlign = 'right';
    ctx.font = 'bold 40px GoogleSans';
    ctx.fillStyle = rankColor;
    ctx.fillText(`${entry.points}`, 750, y);
    ctx.font = '20px GoogleSans';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('PTS', 750, y + 25);

    ctx.font = 'bold 28px GoogleSans';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${entry.winRate}%`, 900, y);
    ctx.font = '20px GoogleSans';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('WR', 900, y + 25);
  }

  ctx.textAlign = 'center';
  ctx.font = 'italic 20px GoogleSans';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillText(
    'rpbey.fr/rankings - Mis à jour en temps réel',
    width / 2,
    height - 30,
  );

  return canvas.toBuffer('image/png');
}

// ─── Interaction Card ───

export interface InteractionCardData {
  userAName: string;
  userAAvatarUrl: string;
  userBName: string;
  userBAvatarUrl: string;
  mentionsAtoB: number;
  mentionsBtoA: number;
  total: number;
  score: number;
  label: string;
  color: number;
}

function drawCircularAvatar(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  img: CanvasImage | null,
  cx: number,
  cy: number,
  radius: number,
  borderColor: string,
) {
  // Border
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
  ctx.fillStyle = borderColor;
  ctx.fill();

  // Clip & draw
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img) {
    ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
  } else {
    ctx.fillStyle = '#374151';
    ctx.fill();
  }
  ctx.restore();
}

export async function generateInteractionCard(
  data: InteractionCardData,
): Promise<Buffer> {
  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // ── Background gradient ──
  const hexColor = `#${data.color.toString(16).padStart(6, '0')}`;
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#1a1a2e');
  bg.addColorStop(0.5, '#16213e');
  bg.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Subtle pattern overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 1);
  }

  // ── Top accent line ──
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, width, 4);

  // ── Load avatars ──
  const [avatarA, avatarB] = await Promise.all([
    safeLoadImage(data.userAAvatarUrl),
    safeLoadImage(data.userBAvatarUrl),
  ]);

  // ── Avatars ──
  const avatarRadius = 65;
  const avatarY = 110;
  const avatarAX = 160;
  const avatarBX = width - 160;

  drawCircularAvatar(ctx, avatarA, avatarAX, avatarY, avatarRadius, hexColor);
  drawCircularAvatar(ctx, avatarB, avatarBX, avatarY, avatarRadius, hexColor);

  // ── Connection line between avatars ──
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(avatarAX + avatarRadius + 10, avatarY);
  ctx.lineTo(avatarBX - avatarRadius - 10, avatarY);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Center score circle ──
  const centerX = width / 2;
  const scoreRadius = 42;

  // Glow
  ctx.beginPath();
  ctx.arc(centerX, avatarY, scoreRadius + 8, 0, Math.PI * 2);
  ctx.fillStyle = `${hexColor}33`;
  ctx.fill();

  // Circle bg
  ctx.beginPath();
  ctx.arc(centerX, avatarY, scoreRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#0f0f23';
  ctx.fill();

  // Circle border
  ctx.beginPath();
  ctx.arc(centerX, avatarY, scoreRadius, 0, Math.PI * 2);
  ctx.strokeStyle = hexColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Score text
  ctx.textAlign = 'center';
  ctx.font = 'bold 36px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(data.score), centerX, avatarY + 12);

  // ── Names under avatars ──
  ctx.font = 'bold 18px GoogleSans';
  ctx.fillStyle = '#ffffff';
  const nameA =
    data.userAName.length > 14
      ? `${data.userAName.slice(0, 13)}…`
      : data.userAName;
  const nameB =
    data.userBName.length > 14
      ? `${data.userBName.slice(0, 13)}…`
      : data.userBName;
  ctx.fillText(nameA, avatarAX, avatarY + avatarRadius + 25);
  ctx.fillText(nameB, avatarBX, avatarY + avatarRadius + 25);

  // ── Label ──
  ctx.font = 'bold 28px GoogleSans';
  ctx.fillStyle = hexColor;
  ctx.fillText(data.label, centerX, 245);

  // ── Progress bar ──
  const barX = 100;
  const barY = 265;
  const barW = width - 200;
  const barH = 16;
  const barRadius = barH / 2;
  const fill = Math.min(data.score / 100, 1);

  // Bar background
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, barRadius);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fill();

  // Bar fill
  if (fill > 0) {
    const fillW = Math.max(barH, barW * fill);
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillW, barH, barRadius);
    const barGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    barGrad.addColorStop(0, hexColor);
    barGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = barGrad;
    ctx.fill();
  }

  // ── Mention stats ──
  const statsY = 320;
  ctx.font = '16px GoogleSans';

  // Left: A → B
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText(`💬 ${data.userAName} → ${data.userBName}`, barX, statsY);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px GoogleSans';
  ctx.fillText(
    `${data.mentionsAtoB} mention${data.mentionsAtoB > 1 ? 's' : ''}`,
    barX,
    statsY + 22,
  );

  // Right: B → A
  ctx.textAlign = 'right';
  ctx.font = '16px GoogleSans';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText(`💬 ${data.userBName} → ${data.userAName}`, barX + barW, statsY);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px GoogleSans';
  ctx.fillText(
    `${data.mentionsBtoA} mention${data.mentionsBtoA > 1 ? 's' : ''}`,
    barX + barW,
    statsY + 22,
  );

  // ── Footer ──
  ctx.textAlign = 'center';
  ctx.font = '12px GoogleSans';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillText(
    `${data.total} mentions mutuelles · rpbey.fr`,
    centerX,
    height - 15,
  );

  return canvas.toBuffer('image/png');
}

// ─── WANTED Poster (One Piece template) ───

export async function generateWantedImage(
  displayName: string,
  avatarUrl: string,
  bounty: string,
  _crime: string,
) {
  // Load the One Piece wanted template
  const templatePath = getAssetPath('bot/assets/wanted-template.png');
  const template = await loadImage(templatePath);

  // Output at a readable size (scale down from 3508x4961)
  const width = 700;
  const height = Math.round((width / template.width) * template.height);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw template as background
  ctx.drawImage(template, 0, 0, width, height);

  // Scale factor from original template coordinates
  const sx = width / 3508;
  const sy = height / 4961;

  // ── Photo area ──
  // The black rectangle in template: (330, 1070) to (3180, 3120)
  const frameX = Math.round(330 * sx);
  const frameY = Math.round(1070 * sy);
  const frameW = Math.round((3180 - 330) * sx);
  const frameH = Math.round((3120 - 1070) * sy);

  // Fill the black rectangle with matching parchment color
  ctx.fillStyle = '#bfb196';
  ctx.fillRect(frameX, frameY, frameW, frameH);

  // Draw avatar centered at 60% of frame size
  const avatar = await safeLoadImage(avatarUrl);
  if (avatar) {
    const avatarSize = Math.round(Math.min(frameW, frameH) * 0.6);
    const avatarX = frameX + Math.round((frameW - avatarSize) / 2);
    const avatarY = frameY + Math.round((frameH - avatarSize) / 2);
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
  }

  // ── Name (below DEAD OR ALIVE, above the small text) ──
  // Position: centered, approx y=4050 in original
  const nameY = Math.round(4100 * sy);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3b2a14';

  const nameText = displayName.toUpperCase();
  ctx.font = `bold ${Math.round(200 * sx)}px GoogleSans`;
  if (ctx.measureText(nameText).width > width * 0.85) {
    ctx.font = `bold ${Math.round(150 * sx)}px GoogleSans`;
  }
  ctx.fillText(nameText, width / 2, nameY);

  // ── Bounty (below the name) ──
  const bountyY = Math.round(4450 * sy);
  ctx.font = `bold ${Math.round(230 * sx)}px GoogleSans`;
  ctx.fillStyle = '#3b2a14';
  if (ctx.measureText(bounty).width > width * 0.85) {
    ctx.font = `bold ${Math.round(170 * sx)}px GoogleSans`;
  }
  ctx.fillText(bounty, width / 2, bountyY);

  return canvas.toBuffer('image/png');
}

// ─── Gacha Card Generator (v3 — TCG Layout) ─────────────────────────────────

export interface GachaCardData {
  name: string;
  nameJp?: string | null;
  series: string;
  rarity: string;
  beyblade?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  isDuplicate: boolean;
  isWished: boolean;
  balance: number;
  att?: number;
  def?: number;
  end?: number;
  equilibre?: number;
  element?: string | null;
  fullArt?: boolean;
  artist?: string | null;
  beybladeImageUrl?: string | null;
  themeOverride?: {
    headerBg?: string;
    borderColor?: string;
    accentColor?: string;
    frameColor?: string;
  };
}

const ELEMENT_ICONS: Record<
  string,
  { symbol: string; color: string; name: string }
> = {
  FEU: { symbol: '🔥', color: '#ef4444', name: 'Feu' },
  EAU: { symbol: '💧', color: '#3b82f6', name: 'Eau' },
  TERRE: { symbol: '🌍', color: '#a16207', name: 'Terre' },
  VENT: { symbol: '🌪', color: '#22d3ee', name: 'Vent' },
  OMBRE: { symbol: '🌑', color: '#7c3aed', name: 'Ombre' },
  LUMIERE: { symbol: '✨', color: '#fbbf24', name: 'Lumière' },
  NEUTRAL: { symbol: '⚪', color: '#9ca3af', name: 'Neutre' },
};

// Element weakness cycle: Feu > Vent > Terre > Eau > Feu, Ombre <> Lumière
const ELEMENT_WEAKNESS: Record<string, string> = {
  FEU: 'EAU',
  EAU: 'TERRE',
  TERRE: 'VENT',
  VENT: 'FEU',
  OMBRE: 'LUMIERE',
  LUMIERE: 'OMBRE',
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
    frameColor: string;
    headerBg: string;
  }
> = {
  COMMON: {
    borderColor: '#6b7280',
    borderGradient: ['#6b7280', '#9ca3af', '#6b7280'],
    glowColor: 'rgba(107,114,128,0.25)',
    bgGradient: ['#e8e6e1', '#d4d0c8', '#c4c0b8'],
    accentColor: '#9ca3af',
    label: 'COMMUNE',
    stars: 1,
    particleCount: 0,
    frameColor: '#8a8a8a',
    headerBg: '#4b5563',
  },
  RARE: {
    borderColor: '#3b82f6',
    borderGradient: ['#2563eb', '#60a5fa', '#2563eb'],
    glowColor: 'rgba(59,130,246,0.35)',
    bgGradient: ['#c7d9f0', '#a8c4e8', '#8db0e0'],
    accentColor: '#60a5fa',
    label: 'RARE',
    stars: 2,
    particleCount: 4,
    frameColor: '#2563eb',
    headerBg: '#1e40af',
  },
  SUPER_RARE: {
    borderColor: '#8b5cf6',
    borderGradient: ['#7c3aed', '#a78bfa', '#7c3aed'],
    glowColor: 'rgba(139,92,246,0.4)',
    bgGradient: ['#ddd0f5', '#c4b0f0', '#b098e8'],
    accentColor: '#a78bfa',
    label: 'SUPER RARE',
    stars: 3,
    particleCount: 8,
    frameColor: '#7c3aed',
    headerBg: '#5b21b6',
  },
  LEGENDARY: {
    borderColor: '#f59e0b',
    borderGradient: ['#d97706', '#fbbf24', '#f59e0b'],
    glowColor: 'rgba(251,191,36,0.5)',
    bgGradient: ['#fef3c7', '#fde68a', '#fcd34d'],
    accentColor: '#fcd34d',
    label: 'LÉGENDAIRE',
    stars: 4,
    particleCount: 14,
    frameColor: '#b45309',
    headerBg: '#92400e',
  },
  SECRET: {
    borderColor: '#ef4444',
    borderGradient: ['#dc2626', '#f87171', '#ef4444'],
    glowColor: 'rgba(239,68,68,0.55)',
    bgGradient: ['#fecaca', '#fca5a5', '#f87171'],
    accentColor: '#f87171',
    label: '✦ SECRÈTE ✦',
    stars: 5,
    particleCount: 20,
    frameColor: '#dc2626',
    headerBg: '#991b1b',
  },
};

type CanvasCtx = ReturnType<ReturnType<typeof createCanvas>['getContext']>;

/** Draw noise texture overlay for depth */
function drawNoise(ctx: CanvasCtx, w: number, h: number, alpha = 0.03) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * 255 * alpha;
    d[i] = Math.min(255, Math.max(0, d[i]! + noise));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1]! + noise));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2]! + noise));
  }
  ctx.putImageData(imgData, 0, 0);
}

/** Draw a 4-point sparkle at given position */
function drawSparkle(
  ctx: CanvasCtx,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha = 0.7,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x + size * 0.15, y - size * 0.15, x + size, y);
  ctx.quadraticCurveTo(x + size * 0.15, y + size * 0.15, x, y + size);
  ctx.quadraticCurveTo(x - size * 0.15, y + size * 0.15, x - size, y);
  ctx.quadraticCurveTo(x - size * 0.15, y - size * 0.15, x, y - size);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = alpha * 0.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 2;
  ctx.fill();
  ctx.restore();
}

/** Draw light rays from top for legendary/secret */
function drawLightRays(
  ctx: CanvasCtx,
  w: number,
  h: number,
  color: string,
  count = 3,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < count; i++) {
    const x = w * 0.2 + (w * 0.6 * i) / (count - 1 || 1);
    const grad = ctx.createLinearGradient(x, 0, x + w * 0.05, h * 0.7);
    grad.addColorStop(0, color);
    grad.addColorStop(0.5, `${color}40`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - 15, 0);
    ctx.lineTo(x + 15, 0);
    ctx.lineTo(x + 40, h * 0.7);
    ctx.lineTo(x - 10, h * 0.7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Draw a rounded rect with fill + optional stroke */
function drawBox(
  ctx: CanvasCtx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | number[],
  fill: string,
  stroke?: string,
  strokeW = 1,
) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeW;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
  }
}

/** Draw a horizontal separator line with gradient fade */
function drawSeparator(
  ctx: CanvasCtx,
  x: number,
  y: number,
  w: number,
  color: string,
) {
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, `${color}00`);
  grad.addColorStop(0.15, `${color}60`);
  grad.addColorStop(0.5, color);
  grad.addColorStop(0.85, `${color}60`);
  grad.addColorStop(1, `${color}00`);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
}

// Generation colors: Bakuten=red, Metal=gold, Burst=green, X=blue
const GEN_COLORS: Record<string, string> = {
  BAKUTEN: '#ef4444',
  BAKUTEN_SHOOT: '#ef4444',
  METAL: '#f59e0b',
  BURST: '#22c55e',
  X: '#3b82f6',
  METAL_MASTERS: '#f59e0b',
  METAL_FURY: '#f59e0b',
  METAL_FUSION: '#f59e0b',
  BEYBLADE_X: '#3b82f6',
  BURST_SURGE: '#22c55e',
  BURST_GT: '#22c55e',
};

/** Draw holographic foil overlay — rainbow conic gradient, screen-blended */
function drawHoloFoil(
  ctx: CanvasCtx,
  x: number,
  y: number,
  w: number,
  h: number,
  intensity: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = intensity;
  const holo = ctx.createConicGradient(0, x + w / 2, y + h / 2);
  holo.addColorStop(0, '#ff000040');
  holo.addColorStop(0.12, '#ff880040');
  holo.addColorStop(0.25, '#ffff0040');
  holo.addColorStop(0.37, '#00ff0040');
  holo.addColorStop(0.5, '#00ffff40');
  holo.addColorStop(0.62, '#0044ff40');
  holo.addColorStop(0.75, '#8800ff40');
  holo.addColorStop(0.87, '#ff00ff40');
  holo.addColorStop(1, '#ff000040');
  ctx.fillStyle = holo;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  ctx.restore();
}

/** Draw holographic seal stamp */
function drawHoloSeal(
  ctx: CanvasCtx,
  cx: number,
  cy: number,
  radius: number,
  color: string,
) {
  // Rainbow ring
  ctx.save();
  const sealHolo = ctx.createConicGradient(0, cx, cy);
  sealHolo.addColorStop(0, '#ef4444');
  sealHolo.addColorStop(0.2, '#f59e0b');
  sealHolo.addColorStop(0.4, '#22c55e');
  sealHolo.addColorStop(0.6, '#3b82f6');
  sealHolo.addColorStop(0.8, '#a855f7');
  sealHolo.addColorStop(1, '#ef4444');
  ctx.strokeStyle = sealHolo;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  // Inner fill
  ctx.fillStyle = `${color}30`;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
  ctx.fill();
  // Text
  ctx.font = 'bold 9px GoogleSans';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText('RPB', cx, cy + 3);
  ctx.restore();
}

/** Draw Battle Edge — row of 6 colored diamonds */
function _drawBattleEdge(
  ctx: CanvasCtx,
  x: number,
  y: number,
  w: number,
  h: number,
  genColor: string,
  glowStars: number,
) {
  // Background bar
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, [8, 8, 0, 0]);
  ctx.fill();
  const edgeColors = [
    '#ef4444',
    '#f59e0b',
    '#22c55e',
    '#3b82f6',
    '#a855f7',
    genColor,
  ];
  const dSize = 7;
  const gap = w / 7;
  for (let i = 0; i < 6; i++) {
    const dx = x + gap * (i + 1);
    const dy = y + h / 2;
    ctx.fillStyle = edgeColors[i]!;
    ctx.beginPath();
    ctx.moveTo(dx, dy - dSize);
    ctx.lineTo(dx + dSize, dy);
    ctx.lineTo(dx, dy + dSize);
    ctx.lineTo(dx - dSize, dy);
    ctx.closePath();
    ctx.fill();
    if (glowStars >= 3) {
      ctx.shadowColor = edgeColors[i]!;
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TCG CARD — Full-size single pull (v4 — Holo foil + Battle Edge + Full-Art)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateGachaCard(data: GachaCardData): Promise<Buffer> {
  const W = 640;
  const H = 900;
  const FRAME = 14;
  const PAD = FRAME + 10;
  const INNER_W = W - PAD * 2;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const baseTheme = RARITY_THEMES[data.rarity] || RARITY_THEMES.COMMON!;
  const theme = data.themeOverride
    ? { ...baseTheme, ...data.themeOverride }
    : baseTheme;
  const hasStats = data.att != null;
  const genColor = GEN_COLORS[data.series.toUpperCase()] || theme.accentColor;
  const elem =
    ELEMENT_ICONS[(data.element || 'NEUTRAL').toUpperCase()] ||
    ELEMENT_ICONS.NEUTRAL!;
  const weakness = ELEMENT_WEAKNESS[(data.element || '').toUpperCase()];
  const _weakElem = weakness ? ELEMENT_ICONS[weakness] : null;
  const isSecret = data.rarity === 'SECRET';
  const isFullArt = data.fullArt || isSecret;
  const isLegendary = data.rarity === 'LEGENDARY';
  const isHighRarity = ['SUPER_RARE', 'LEGENDARY', 'SECRET'].includes(
    data.rarity,
  );

  // ══════════════════════════════════════════════════════════════════════════
  // 1. CARD BACKGROUND — Grey base + white text zone
  // ══════════════════════════════════════════════════════════════════════════
  if (isFullArt) {
    ctx.fillStyle = '#08060a';
    ctx.fillRect(0, 0, W, H);
  } else {
    // Grey background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#e5e7eb');
    bgGrad.addColorStop(0.5, '#d1d5db');
    bgGrad.addColorStop(1, '#c8cbd0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
  }

  // Element-tinted radial glow (non full-art only)
  if (!isFullArt) {
    const elemGlow = ctx.createRadialGradient(W / 2, 300, 20, W / 2, 300, 320);
    elemGlow.addColorStop(0, `${elem.color}12`);
    elemGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = elemGlow;
    ctx.fillRect(0, 0, W, H);

    if (isLegendary) {
      drawLightRays(ctx, W, H, theme.accentColor, 5);
    }

    drawNoise(ctx, W, H, 0.015);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 1b. FULL-ART BLEED — character art behind everything (contain-fit)
  // ══════════════════════════════════════════════════════════════════════════
  let charImg = isFullArt
    ? await _loadImageDirect(data.imageUrl || null)
    : await _loadImageNoWhiteBg(data.imageUrl || null);
  if (isFullArt && charImg) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(FRAME, FRAME, W - FRAME * 2, H - FRAME * 2, 24);
    ctx.clip();
    // Fill full card height, center horizontally (no black gap at bottom)
    const aspect = charImg.width / charImg.height;
    const dH = H;
    const dW = H * aspect;
    ctx.drawImage(charImg, (W - dW) / 2, 0, dW, dH);
    // Dark overlay for text readability (stronger at bottom for stats)
    const overlay = ctx.createLinearGradient(0, 0, 0, H);
    overlay.addColorStop(0, 'rgba(8,6,10,0.25)');
    overlay.addColorStop(0.4, 'rgba(8,6,10,0.08)');
    overlay.addColorStop(0.6, 'rgba(8,6,10,0.08)');
    overlay.addColorStop(0.78, 'rgba(8,6,10,0.5)');
    overlay.addColorStop(1, 'rgba(8,6,10,0.88)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. OUTER FRAME — Rounded grey border with wave effect
  // ══════════════════════════════════════════════════════════════════════════
  const CORNER_R = 28;

  // Grey border base
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = FRAME;
  ctx.beginPath();
  ctx.roundRect(FRAME / 2, FRAME / 2, W - FRAME, H - FRAME, CORNER_R);
  ctx.stroke();

  // Wave texture on border only (clipped to border strip)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, FRAME);
  ctx.rect(0, H - FRAME, W, FRAME);
  ctx.rect(0, 0, FRAME, H);
  ctx.rect(W - FRAME, 0, FRAME, H);
  ctx.clip();
  ctx.globalAlpha = 0.18;
  for (let wave = 0; wave < 6; wave++) {
    const waveY0 = wave * (H / 5);
    ctx.strokeStyle = wave % 2 === 0 ? '#6b7280' : '#b0b5bc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 2) {
      const y = waveY0 + Math.sin((x / W) * Math.PI * 4 + wave * 1.2) * 6;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Inner frame line (rounded)
  ctx.strokeStyle = `${theme.frameColor}40`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(
    FRAME + 4,
    FRAME + 4,
    W - FRAME * 2 - 8,
    H - FRAME * 2 - 8,
    CORNER_R - 4,
  );
  ctx.stroke();

  // Holographic rainbow foil overlay for SR+ (non full-art only)
  if (isHighRarity && !isFullArt) {
    drawHoloFoil(ctx, 0, 0, W, H, isSecret ? 0.35 : isLegendary ? 0.25 : 0.15);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. NAME HEADER BAR — Beyblade name + Character name + ÉQU
  // ══════════════════════════════════════════════════════════════════════════
  const headerY = FRAME;
  const headerH = 52;

  // Dark header background with gen color tint
  const headerGrad = ctx.createLinearGradient(
    PAD,
    headerY,
    PAD + INNER_W,
    headerY,
  );
  headerGrad.addColorStop(0, theme.headerBg);
  headerGrad.addColorStop(0.6, `${theme.headerBg}E0`);
  headerGrad.addColorStop(1, `${genColor}90`);
  ctx.fillStyle = headerGrad;
  ctx.beginPath();
  ctx.roundRect(PAD, headerY, INNER_W, headerH, [10, 10, 0, 0]);
  ctx.fill();

  // Beyblade image icon (left of character name)
  let nameX = PAD + 12;
  const beyImg = await _loadImageDirect(data.beybladeImageUrl || null);
  if (beyImg) {
    const iconSize = 42;
    const iconX = PAD + 8;
    const iconY = headerY + (headerH - iconSize) / 2;
    // Circle clip for beyblade icon
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      iconX + iconSize / 2,
      iconY + iconSize / 2,
      iconSize / 2,
      0,
      Math.PI * 2,
    );
    ctx.clip();
    ctx.drawImage(beyImg, iconX, iconY, iconSize, iconSize);
    ctx.restore();
    // Thin border around icon
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(
      iconX + iconSize / 2,
      iconY + iconSize / 2,
      iconSize / 2,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    nameX = iconX + iconSize + 8;
  }

  // Character name
  ctx.textAlign = 'left';
  ctx.font = 'bold 26px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  let displayName = data.name;
  while (
    ctx.measureText(displayName).width > INNER_W - (nameX - PAD) - 120 &&
    displayName.length > 8
  )
    displayName = `${displayName.slice(0, -2)}...`;
  ctx.fillText(displayName, nameX, headerY + 34);
  ctx.shadowBlur = 0;

  // HP display (right side)
  if (hasStats && data.equilibre != null) {
    ctx.textAlign = 'right';
    ctx.font = 'bold 13px GoogleSans';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('ÉQU', W - PAD - 68, headerY + 22);
    ctx.font = 'bold 28px GoogleSans';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${data.equilibre}`, W - PAD - 12, headerY + 24);
    // Balance icon
    ctx.font = 'bold 14px GoogleSans, NotoEmoji';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('\u2696', W - PAD - 12, headerY + 44);
  }

  // Rarity label badge (over header right edge)
  ctx.font = 'bold 11px GoogleSans';
  const rarityBadgeW = ctx.measureText(theme.label).width + 20;
  const rbX = W - PAD - rarityBadgeW - 6;
  const rbY = headerY - 4;
  drawBox(ctx, rbX, rbY, rarityBadgeW + 12, 18, 9, theme.borderColor);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(theme.label, rbX + (rarityBadgeW + 12) / 2, rbY + 13);

  // ══════════════════════════════════════════════════════════════════════════
  // 4. ART WINDOW — Character illustration with inner frame
  //    (Skipped for full-art — image is already drawn as card background)
  // ══════════════════════════════════════════════════════════════════════════
  const artY = headerY + headerH + 4;
  const artH = isFullArt ? H - headerY - headerH - 4 - 200 : 440;
  const artX = PAD + 6;
  const artInnerW = INNER_W - 12;

  if (!isFullArt) {
    // Art background (dark)
    drawBox(
      ctx,
      artX,
      artY,
      artInnerW,
      artH,
      4,
      '#0a0a12',
      `${theme.frameColor}50`,
      2,
    );

    // Character image
    if (!charImg) charImg = await _loadImageNoWhiteBg(data.imageUrl || null);
    if (charImg) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(artX + 2, artY + 2, artInnerW - 4, artH - 4, 3);
      ctx.clip();

      // Radial spotlight behind character
      const spot = ctx.createRadialGradient(
        W / 2,
        artY + artH * 0.4,
        10,
        W / 2,
        artY + artH * 0.4,
        artH * 0.65,
      );
      spot.addColorStop(0, `${elem.color}20`);
      spot.addColorStop(1, 'transparent');
      ctx.fillStyle = spot;
      ctx.fillRect(artX, artY, artInnerW, artH);

      // Draw image (cover-fit — fills the window, crops overflow)
      const aspect = charImg.width / charImg.height;
      const windowW = artInnerW - 4;
      const windowH = artH - 4;
      let dW: number, dH: number, dX: number, dY: number;
      if (aspect > windowW / windowH) {
        dH = windowH;
        dW = windowH * aspect;
        dX = artX + 2 + (windowW - dW) / 2;
        dY = artY + 2;
      } else {
        dW = windowW;
        dH = windowW / aspect;
        dX = artX + 2;
        dY = artY + 2 - (dH - windowH) * 0.15;
      }
      ctx.drawImage(charImg, dX, dY, dW, dH);

      // Bottom vignette
      const vig = ctx.createLinearGradient(0, artY, 0, artY + artH);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(0.75, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vig;
      ctx.fillRect(artX, artY, artInnerW, artH);
      ctx.restore();
    } else {
      ctx.font = 'bold 100px GoogleSans';
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.textAlign = 'center';
      ctx.fillText('?', W / 2, artY + artH / 2 + 35);
    }

    // Inner art frame highlight (metallic for high rarity)
    if (isHighRarity) {
      const innerFrameGrad = ctx.createLinearGradient(
        artX,
        artY,
        artX + artInnerW,
        artY + artH,
      );
      innerFrameGrad.addColorStop(0, `${theme.borderColor}60`);
      innerFrameGrad.addColorStop(0.3, `${theme.borderColor}20`);
      innerFrameGrad.addColorStop(0.7, `${theme.borderColor}20`);
      innerFrameGrad.addColorStop(1, `${theme.borderColor}60`);
      ctx.strokeStyle = innerFrameGrad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(artX, artY, artInnerW, artH, 4);
      ctx.stroke();
      if (isLegendary || isSecret) {
        drawHoloFoil(ctx, artX, artY, artInnerW, artH, isSecret ? 0.2 : 0.12);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5. WHITE TEXT ZONE + TYPE STRIP
  // ══════════════════════════════════════════════════════════════════════════
  // Full-art: flush text to very bottom edge
  const contentH =
    26 + 4 + (data.description ? 35 : 0) + 4 + (hasStats ? 30 : 0);
  const typeY = isFullArt ? H - FRAME - contentH : artY + artH + 6;
  const typeH = 26;
  const textZoneTop = typeY - 2;
  const textZoneBottom = H - FRAME - 6;

  // White background for the entire text area below the art
  if (!isFullArt) {
    drawBox(
      ctx,
      PAD,
      textZoneTop,
      INNER_W,
      textZoneBottom - textZoneTop,
      6,
      '#ffffff',
    );
  }

  const typeGrad = ctx.createLinearGradient(PAD, typeY, PAD + INNER_W, typeY);
  typeGrad.addColorStop(0, `${genColor}30`);
  typeGrad.addColorStop(1, `${theme.borderColor}20`);
  ctx.fillStyle = typeGrad;
  ctx.beginPath();
  ctx.roundRect(PAD + 2, typeY, INNER_W - 4, typeH, 3);
  ctx.fill();

  // Text colors adapt: full-art = light on dark, others = dark on white
  const textDark = isFullArt ? '#e0dcd4' : '#1f2937';
  const textMuted = isFullArt ? '#a09888' : '#4b5563';
  const textSubtle = isFullArt ? '#807868' : '#6b7280';

  ctx.font = 'bold 12px GoogleSans';
  ctx.textAlign = 'left';
  ctx.fillStyle = genColor;
  ctx.fillText(data.series.replace(/_/g, ' '), PAD + 10, typeY + 18);

  if (data.beyblade) {
    ctx.textAlign = 'right';
    ctx.fillStyle = textDark;
    ctx.font = 'bold 12px GoogleSans';
    let bey = data.beyblade;
    while (ctx.measureText(bey).width > INNER_W * 0.5 && bey.length > 12)
      bey = `${bey.slice(0, -2)}...`;
    ctx.fillText(bey, W - PAD - 10, typeY + 18);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 6. DESCRIPTION (optional, compact)
  // ══════════════════════════════════════════════════════════════════════════
  const descY = typeY + typeH + 4;
  let descBlockH = 0;
  if (data.description) {
    drawSeparator(ctx, PAD, descY, INNER_W, theme.frameColor);
    ctx.font = '11px GoogleSans';
    ctx.fillStyle = textMuted;
    ctx.textAlign = 'left';
    const words = data.description.split(' ');
    let descLine = '';
    let ly = descY + 16;
    let lc = 0;
    for (const word of words) {
      if (lc >= 2) break;
      const test = descLine ? `${descLine} ${word}` : word;
      if (ctx.measureText(test).width > INNER_W - 30) {
        ctx.fillText(descLine, PAD + 12, ly);
        descLine = word;
        ly += 15;
        lc++;
      } else descLine = test;
    }
    if (descLine && lc < 2) ctx.fillText(descLine, PAD + 12, ly);
    descBlockH = 20 + lc * 15;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 6b. STATS — Single line: ATT / DEF / END / EQL
  // ══════════════════════════════════════════════════════════════════════════
  const statsStartY = descY + descBlockH + 4;
  if (hasStats) {
    drawSeparator(ctx, PAD, statsStartY, INNER_W, theme.frameColor);
    const sy = statsStartY + 16;
    const stats = [
      { label: 'ATT', val: data.att!, color: '#dc2626' },
      { label: 'DEF', val: data.def!, color: '#2563eb' },
      { label: 'END', val: data.end!, color: '#0891b2' },
      { label: 'EQL', val: data.equilibre!, color: '#22c55e' },
    ];
    const colW = INNER_W / stats.length;
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i]!;
      const cx = PAD + colW * i + colW / 2;
      // Label
      ctx.font = 'bold 10px GoogleSans';
      ctx.fillStyle = isFullArt ? 'rgba(255,255,255,0.6)' : textMuted;
      ctx.textAlign = 'center';
      ctx.fillText(s.label, cx, sy - 2);
      // Value
      ctx.font = 'bold 16px GoogleSans';
      ctx.fillStyle = s.color;
      ctx.fillText(`${s.val}`, cx, sy + 16);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 9. FOOTER + STATUS BAR (hidden in full-art — text is already at bottom)
  // ══════════════════════════════════════════════════════════════════════════
  const footerY = H - FRAME - 80;
  const statusY = footerY + 32;
  const statusH = 36;

  if (!isFullArt) {
    drawSeparator(ctx, PAD, footerY, INNER_W, theme.frameColor);

    // Card number (left)
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px GoogleSans';
    ctx.fillStyle = textSubtle;
    ctx.fillText('#???/032', PAD + 10, footerY + 18);

    if (isHighRarity) {
      drawHoloSeal(ctx, W - PAD - 24, footerY + 48, 13, theme.accentColor);
    }

    drawBox(
      ctx,
      PAD,
      statusY,
      INNER_W,
      statusH,
      [0, 0, 8, 8],
      'rgba(0,0,0,0.15)',
    );
  }

  if (!isFullArt) {
    if (data.balance > 0) {
      ctx.font = 'bold 14px GoogleSans';
      ctx.textAlign = 'left';
      ctx.fillStyle = textSubtle;
      ctx.fillText(
        `${data.balance.toLocaleString('fr-FR')} coins`,
        PAD + 14,
        statusY + 23,
      );
    }

    if (data.isWished) {
      const wishBadgeW = 90;
      drawBox(
        ctx,
        W - PAD - wishBadgeW - 8,
        statusY + 6,
        wishBadgeW,
        24,
        12,
        '#fbbf2430',
        '#fbbf24',
        1.5,
      );
      ctx.font = 'bold 12px GoogleSans';
      ctx.fillStyle = isSecret ? '#fcd34d' : '#b45309';
      ctx.textAlign = 'center';
      ctx.fillText('WISHED', W - PAD - wishBadgeW / 2 - 8, statusY + 22);
    } else if (data.isDuplicate) {
      const dupBadgeW = 90;
      drawBox(
        ctx,
        W - PAD - dupBadgeW - 8,
        statusY + 6,
        dupBadgeW,
        24,
        12,
        'rgba(107,114,128,0.15)',
        '#9ca3af',
        1,
      );
      ctx.font = 'bold 12px GoogleSans';
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'center';
      ctx.fillText('DOUBLON', W - PAD - dupBadgeW / 2 - 8, statusY + 22);
    }
  }

  // Illu credit (bottom-right on border)
  ctx.textAlign = 'right';
  ctx.font = '11px GoogleSans';
  ctx.fillStyle = '#6b7280';
  ctx.fillText('made by Illu', W - FRAME - 6, H - FRAME / 2 + 4);

  // ══════════════════════════════════════════════════════════════════════════
  // 11. SPARKLES & CORNER ORNAMENTS (high rarity)
  // ══════════════════════════════════════════════════════════════════════════
  if (theme.particleCount > 0 && !isFullArt) {
    for (let i = 0; i < theme.particleCount; i++) {
      const sx = FRAME + 20 + Math.random() * (W - FRAME * 2 - 40);
      const sy = FRAME + 20 + Math.random() * (H - FRAME * 2 - 40);
      drawSparkle(
        ctx,
        sx,
        sy,
        3 + Math.random() * 6,
        theme.accentColor,
        0.25 + Math.random() * 0.45,
      );
    }
  }

  if (isHighRarity && !isFullArt) {
    ctx.strokeStyle = `${theme.borderColor}50`;
    ctx.lineWidth = 2.5;
    const c = 35;
    const ox = FRAME + 6;
    const oy = FRAME + 6;
    const corners: [number, number, number, number][] = [
      [ox, oy + c, ox, oy],
      [ox, oy, ox + c, oy],
      [W - ox - c, oy, W - ox, oy],
      [W - ox, oy, W - ox, oy + c],
      [ox, H - oy - c, ox, H - oy],
      [ox, H - oy, ox + c, H - oy],
      [W - ox - c, H - oy, W - ox, H - oy],
      [W - ox, H - oy, W - ox, H - oy - c],
    ];
    for (const [x1, y1, x2, y2] of corners) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // Copyright on bottom-left border
  ctx.font = '11px GoogleSans';
  ctx.fillStyle = '#6b7280';
  ctx.textAlign = 'left';
  ctx.fillText('\u00A9 RPBey 2026', FRAME + 6, H - FRAME / 2 + 4);

  return canvas.toBuffer('image/png');
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED GACHA CARD — Beyblade X lightning VFX overlay (GIF)
// ─────────────────────────────────────────────────────────────────────────────

type Pt = { x: number; y: number };
const _rand = (a: number, b: number) => a + Math.random() * (b - a);

function _generateBoltPath(
  sx: number,
  sy: number,
  angle: number,
  segs: number,
  segLen: [number, number],
  deviation: number,
): Pt[][] {
  const paths: Pt[][] = [];
  const trunk: Pt[] = [{ x: sx, y: sy }];
  let cx = sx,
    cy = sy;
  for (let s = 0; s < segs; s++) {
    const len = _rand(segLen[0], segLen[1]);
    const a = angle + _rand(-deviation, deviation);
    cx += Math.cos(a) * len;
    cy += Math.sin(a) * len;
    trunk.push({ x: cx, y: cy });
    if (Math.random() < 0.3 && s < segs - 1) {
      const branch: Pt[] = [{ x: cx, y: cy }];
      let bx = cx,
        by = cy;
      const ba = a + _rand(-1.2, 1.2);
      for (let b = 0; b < 2 + Math.floor(_rand(0, 2)); b++) {
        bx +=
          Math.cos(ba + _rand(-0.5, 0.5)) *
          _rand(segLen[0] * 0.3, segLen[1] * 0.5);
        by +=
          Math.sin(ba + _rand(-0.5, 0.5)) *
          _rand(segLen[0] * 0.3, segLen[1] * 0.5);
        branch.push({ x: bx, y: by });
      }
      paths.push(branch);
    }
  }
  paths.unshift(trunk);
  return paths;
}

function _drawBoltTriplePass(
  ctx: CanvasCtx,
  pts: Pt[],
  color: string,
  w: number,
  glow: number,
  alpha: number,
) {
  if (pts.length < 2) return;
  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0]?.x, pts[0]?.y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]?.x, pts[i]?.y);
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
  trace();
  ctx.stroke();
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
  trace();
  ctx.stroke();
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
  trace();
  ctx.stroke();
  ctx.restore();
}

const BX_BOLT_COLORS = ['#00ccff', '#00e5ff', '#40c4ff', '#00b0ff', '#80d8ff'];

function _drawBXLightning(ctx: CanvasCtx, w: number, h: number) {
  ctx.save();
  // Radial glow source
  const gx = w * 0.72,
    gy = h * 0.06;
  const rad = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * 0.5);
  rad.addColorStop(0, 'rgba(0,204,255,0.18)');
  rad.addColorStop(0.3, 'rgba(0,204,255,0.06)');
  rad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';

  // Main bolts
  for (let i = 0; i < 5; i++) {
    const sx = w * 0.5 + _rand(0, w * 0.45);
    const sy = _rand(-h * 0.02, h * 0.15);
    const angle = Math.PI * 0.6 + _rand(-0.3, 0.3);
    const paths = _generateBoltPath(
      sx,
      sy,
      angle,
      4 + Math.floor(_rand(0, 4)),
      [50, 140],
      0.65,
    );
    const color = BX_BOLT_COLORS[Math.floor(_rand(0, 3))]!;
    const mw = _rand(2.5, 5);
    for (let p = 0; p < paths.length; p++) {
      _drawBoltTriplePass(
        ctx,
        paths[p]!,
        color,
        p === 0 ? mw : mw * 0.45,
        p === 0 ? _rand(16, 28) : _rand(6, 14),
        p === 0 ? _rand(0.75, 1) : _rand(0.35, 0.65),
      );
    }
  }
  // Secondary bolts
  for (let i = 0; i < 8; i++) {
    const sx = w * 0.35 + _rand(0, w * 0.6);
    const sy = _rand(-h * 0.01, h * 0.25);
    const angle = Math.PI * 0.55 + _rand(-0.45, 0.45);
    const paths = _generateBoltPath(
      sx,
      sy,
      angle,
      3 + Math.floor(_rand(0, 2)),
      [25, 80],
      0.85,
    );
    const color = BX_BOLT_COLORS[Math.floor(_rand(0, BX_BOLT_COLORS.length))]!;
    for (const pts of paths) {
      _drawBoltTriplePass(
        ctx,
        pts,
        color,
        _rand(1.2, 2.5),
        _rand(8, 16),
        _rand(0.3, 0.6),
      );
    }
  }
  // Spark particles
  for (let i = 0; i < 10; i++) {
    const sx = w * 0.4 + _rand(0, w * 0.55);
    const sy = _rand(0, h * 0.4);
    const size = _rand(1.5, 5);
    ctx.save();
    ctx.globalAlpha = _rand(0.4, 1);
    ctx.fillStyle = '#b3e5fc';
    ctx.shadowColor = '#00ccff';
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

/**
 * Generate an animated GIF from a static gacha card PNG.
 * Overlays Beyblade X lightning VFX + shimmer + border glow.
 * Returns a GIF buffer (~2-3 MB, 18 frames, 65ms delay).
 */
export async function generateAnimatedGachaCard(
  staticCardPng: Buffer,
): Promise<Buffer> {
  const W = 640,
    H = 900;
  const FRAMES = 18,
    DELAY = 65;

  const baseImg = await loadImage(staticCardPng);
  const framePngs: Buffer[] = [];

  for (let i = 0; i < FRAMES; i++) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    const t = i / FRAMES;

    // Base card
    ctx.drawImage(baseImg, 0, 0, W, H);

    // Shimmer sweep
    const sx = t * W * 2.2 - W * 0.6;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const shimmer = ctx.createLinearGradient(sx - 180, 0, sx + 180, H);
    shimmer.addColorStop(0, 'rgba(255,255,255,0)');
    shimmer.addColorStop(0.42, 'rgba(255,255,255,0)');
    shimmer.addColorStop(0.48, 'rgba(0,200,255,0.10)');
    shimmer.addColorStop(0.5, 'rgba(255,255,255,0.20)');
    shimmer.addColorStop(0.52, 'rgba(0,200,255,0.10)');
    shimmer.addColorStop(0.58, 'rgba(255,255,255,0)');
    shimmer.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shimmer;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Pulsing border glow
    const pulse = 0.5 + Math.sin(t * Math.PI * 2) * 0.5;
    ctx.save();
    ctx.shadowColor = `rgba(0,204,255,${0.4 * pulse})`;
    ctx.shadowBlur = 12 + pulse * 18;
    ctx.strokeStyle = `rgba(0,204,255,${0.25 * pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(10, 10, W - 20, H - 20, 22);
    ctx.stroke();
    ctx.restore();

    // Lightning VFX (regenerated each frame = crackling)
    _drawBXLightning(ctx, W, H);

    framePngs.push(Buffer.from(canvas.toBuffer('image/png')));
  }

  // Assemble GIF: stack frames → raw RGBA → sharp with pageHeight
  const composites = framePngs.slice(1).map((buf, i) => ({
    input: buf,
    top: (i + 1) * H,
    left: 0,
  }));
  const tallPng = await sharp(framePngs[0]!)
    .extend({
      bottom: H * (FRAMES - 1),
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .composite(composites)
    .png()
    .toBuffer();
  const rawData = await sharp(tallPng).ensureAlpha().raw().toBuffer();

  return sharp(rawData, {
    raw: {
      width: W,
      height: H * FRAMES,
      channels: 4,
      pageHeight: H,
    },
  })
    .gif({
      delay: Array.from({ length: FRAMES }, () => DELAY),
      loop: 0,
      colours: 180,
      dither: 0.4,
      effort: 8,
    })
    .toBuffer();
}

// ─────────────────────────────────────────────────────────────────────────────
// STAR FRAGMENT — Summoning animation for multi-pulls (Metal Fury style)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a "Star Fragment" summoning animation GIF.
 * Realistic meteor-like fragments falling from space with glowing tails,
 * dust particles, and atmospheric entry glow. No text overlay.
 */
/**
 * Rarity → fragment color theme.
 * LEGENDARY = multicolor rainbow, SUPER_RARE = gold, RARE = violet, COMMON/MISS = white
 */
const FRAGMENT_COLORS: Record<
  string,
  {
    hues: number[];
    saturation: number;
    lightness: number;
    size: [number, number];
    tailLen: [number, number];
    brightness: [number, number];
    rainbow?: boolean;
  }
> = {
  LEGENDARY: {
    hues: [0, 30, 60, 120, 200, 280],
    saturation: 90,
    lightness: 80,
    size: [4, 6],
    tailLen: [100, 160],
    brightness: [0.9, 1],
    rainbow: true,
  },
  SUPER_RARE: {
    hues: [40, 45, 50],
    saturation: 85,
    lightness: 75,
    size: [3, 5],
    tailLen: [80, 130],
    brightness: [0.8, 0.95],
  },
  RARE: {
    hues: [270, 280, 290],
    saturation: 70,
    lightness: 70,
    size: [2.5, 4],
    tailLen: [60, 100],
    brightness: [0.6, 0.8],
  },
  COMMON: {
    hues: [210, 220],
    saturation: 15,
    lightness: 90,
    size: [1.5, 3],
    tailLen: [30, 60],
    brightness: [0.4, 0.65],
  },
};

export async function generateStarFragmentGif(
  rarities?: (string | null)[],
): Promise<Buffer> {
  const W = 640,
    H = 400;
  const FRAMES = 24;
  const r = (a: number, b: number) => a + Math.random() * (b - a);

  // Resolve 10 rarities (fallback to COMMON if not provided)
  const slots = Array.from({ length: 10 }, (_, i) => {
    const raw = rarities?.[i] ?? 'COMMON';
    return FRAGMENT_COLORS[raw || 'COMMON'] || FRAGMENT_COLORS.COMMON!;
  });

  // Background stars (fixed)
  const STARS = Array.from({ length: 120 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H * 0.85,
    size: 0.3 + Math.random() * 1.8,
    brightness: 0.15 + Math.random() * 0.6,
    twinkle: 1 + Math.random() * 4,
  }));

  // Meteor fragments — colored by rarity
  const FRAGMENTS = slots.map((color) => {
    const startX = r(W * 0.05, W * 0.95);
    const startY = r(-H * 0.5, -H * 0.1);
    return {
      sx: startX,
      sy: startY,
      angle: r(0.55, 0.85) * Math.PI,
      speed: r(0.6, 1.2),
      delay: r(0, 0.3),
      len: r(300, 600),
      size: r(color.size[0], color.size[1]),
      tailLen: r(color.tailLen[0], color.tailLen[1]),
      hues: color.hues,
      saturation: color.saturation,
      lightness: color.lightness,
      brightness: r(color.brightness[0], color.brightness[1]),
      rainbow: color.rainbow ?? false,
    };
  });

  // Dust particles spawned along fragment trails
  const DUST_COUNT = 50;
  const dust = Array.from({ length: DUST_COUNT }, () => ({
    fragIdx: Math.floor(Math.random() * FRAGMENTS.length),
    offset: Math.random(), // position along the trail (0=head, 1=tail)
    drift: { x: r(-2, 2), y: r(-1, 1) },
    size: r(0.5, 2),
    alpha: r(0.2, 0.6),
    decay: r(0.3, 0.8),
  }));

  const framePngs: Buffer[] = [];

  for (let f = 0; f < FRAMES; f++) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    const t = f / FRAMES;

    // 1. Deep space background with subtle nebula
    ctx.fillStyle = '#020208';
    ctx.fillRect(0, 0, W, H);

    // Nebula haze
    const neb1 = ctx.createRadialGradient(
      W * 0.3,
      H * 0.2,
      0,
      W * 0.3,
      H * 0.2,
      W * 0.5,
    );
    neb1.addColorStop(0, 'rgba(20,10,50,0.3)');
    neb1.addColorStop(0.5, 'rgba(10,5,30,0.1)');
    neb1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb1;
    ctx.fillRect(0, 0, W, H);

    const neb2 = ctx.createRadialGradient(
      W * 0.75,
      H * 0.15,
      0,
      W * 0.75,
      H * 0.15,
      W * 0.35,
    );
    neb2.addColorStop(0, 'rgba(5,15,40,0.25)');
    neb2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, W, H);

    // 2. Planet horizon (subtle curve)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(W / 2, H + 220, W * 0.95, 350, 0, Math.PI, 0);
    ctx.closePath();
    const pGrad = ctx.createLinearGradient(0, H * 0.72, 0, H);
    pGrad.addColorStop(0, '#0e1228');
    pGrad.addColorStop(0.5, '#0a0e1e');
    pGrad.addColorStop(1, '#060810');
    ctx.fillStyle = pGrad;
    ctx.fill();
    // Thin atmosphere line
    const atm = ctx.createLinearGradient(0, H * 0.73, 0, H * 0.78);
    atm.addColorStop(0, 'rgba(80,130,220,0.12)');
    atm.addColorStop(0.5, 'rgba(60,100,180,0.06)');
    atm.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = atm;
    ctx.fillRect(0, H * 0.73, W, H * 0.05);
    ctx.restore();

    // 3. Stars
    for (const s of STARS) {
      const tw = 0.4 + Math.sin(t * Math.PI * 2 * s.twinkle + s.x) * 0.4;
      ctx.save();
      ctx.globalAlpha = s.brightness * tw;
      ctx.fillStyle = '#ddeeff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Meteor fragments
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (const frag of FRAGMENTS) {
      const fragT = Math.max(0, (t - frag.delay) / (1 - frag.delay));
      if (fragT <= 0) continue;
      const eased = fragT * fragT * (3 - 2 * fragT); // smoothstep

      const headX =
        frag.sx + Math.cos(frag.angle) * frag.len * eased * frag.speed;
      const headY =
        frag.sy + Math.sin(frag.angle) * frag.len * eased * frag.speed;

      // Tail: line from head back along trajectory
      const tailX = headX - Math.cos(frag.angle) * frag.tailLen;
      const tailY = headY - Math.sin(frag.angle) * frag.tailLen;

      // Skip if fully off-screen
      if (headY > H + 50) continue;

      const alpha =
        frag.brightness *
        Math.min(fragT * 3, 1) *
        (headY < H * 0.75
          ? 1
          : Math.max(0, 1 - (headY - H * 0.75) / (H * 0.3)));

      // Pick hue — rainbow cycles through all hues per frame, others use fixed
      const hue = frag.rainbow
        ? frag.hues[Math.floor((fragT * 8 + f * 0.5) % frag.hues.length)]!
        : frag.hues[Math.floor(r(0, frag.hues.length))]!;
      const sat = frag.saturation;
      const lit = frag.lightness;

      // Outer glow trail (wide, faint)
      const tailGrad = ctx.createLinearGradient(tailX, tailY, headX, headY);
      tailGrad.addColorStop(0, 'rgba(0,0,0,0)');
      if (frag.rainbow) {
        // Rainbow gradient along the tail
        const rh = frag.hues;
        for (let ci = 0; ci < rh.length; ci++) {
          const stop = 0.3 + (ci / rh.length) * 0.7;
          tailGrad.addColorStop(
            stop,
            `hsla(${rh[ci]},${sat}%,${lit}%,${alpha * 0.2})`,
          );
        }
      } else {
        tailGrad.addColorStop(
          0.3,
          `hsla(${hue},${sat}%,${lit}%,${alpha * 0.15})`,
        );
        tailGrad.addColorStop(
          1,
          `hsla(${hue},${sat - 10}%,${lit + 10}%,${alpha * 0.4})`,
        );
      }
      ctx.save();
      ctx.strokeStyle = tailGrad;
      ctx.lineWidth = frag.size * 5;
      ctx.lineCap = 'round';
      ctx.shadowColor = `hsla(${hue},${sat}%,${lit}%,0.6)`;
      ctx.shadowBlur = frag.rainbow ? 25 : 15;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();
      ctx.restore();

      // Main colored trail
      const mainGrad = ctx.createLinearGradient(tailX, tailY, headX, headY);
      mainGrad.addColorStop(0, 'rgba(0,0,0,0)');
      mainGrad.addColorStop(
        0.5,
        `hsla(${hue},${sat - 20}%,${lit + 10}%,${alpha * 0.5})`,
      );
      mainGrad.addColorStop(
        1,
        `hsla(${hue},${sat - 30}%,${Math.min(lit + 20, 95)}%,${alpha * 0.8})`,
      );
      ctx.save();
      ctx.strokeStyle = mainGrad;
      ctx.lineWidth = frag.size * 1.5;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();
      ctx.restore();

      // White-hot head point
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = `hsla(${hue},${sat}%,${lit + 5}%,1)`;
      ctx.shadowBlur = frag.size * (frag.rainbow ? 10 : 6);
      ctx.beginPath();
      ctx.arc(headX, headY, frag.size * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Atmospheric entry glow (orange-warm near planet)
      if (headY > H * 0.5) {
        const entryAlpha = alpha * ((headY - H * 0.5) / (H * 0.3)) * 0.4;
        ctx.save();
        ctx.globalAlpha = entryAlpha;
        const entryGrad = ctx.createRadialGradient(
          headX,
          headY,
          0,
          headX,
          headY,
          frag.size * 8,
        );
        entryGrad.addColorStop(0, 'rgba(255,180,80,0.6)');
        entryGrad.addColorStop(0.3, 'rgba(255,120,40,0.3)');
        entryGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = entryGrad;
        ctx.fillRect(
          headX - frag.size * 8,
          headY - frag.size * 8,
          frag.size * 16,
          frag.size * 16,
        );
        ctx.restore();
      }
    }

    // 5. Dust particles drifting off fragments
    for (const d of dust) {
      const frag = FRAGMENTS[d.fragIdx]!;
      const fragT = Math.max(0, (t - frag.delay) / (1 - frag.delay));
      if (fragT <= 0) continue;
      const eased = fragT * fragT * (3 - 2 * fragT);

      const headX =
        frag.sx + Math.cos(frag.angle) * frag.len * eased * frag.speed;
      const headY =
        frag.sy + Math.sin(frag.angle) * frag.len * eased * frag.speed;
      const px =
        headX -
        Math.cos(frag.angle) * frag.tailLen * d.offset +
        d.drift.x * fragT * 30;
      const py =
        headY -
        Math.sin(frag.angle) * frag.tailLen * d.offset +
        d.drift.y * fragT * 30;

      if (py > H || py < 0 || px < 0 || px > W) continue;

      const dustAlpha = d.alpha * Math.max(0, 1 - fragT * d.decay);
      ctx.save();
      ctx.globalAlpha = dustAlpha;
      const dHue = frag.hues[Math.floor(Math.random() * frag.hues.length)]!;
      ctx.fillStyle = `hsla(${dHue},${frag.saturation * 0.6}%,${frag.lightness + 5}%,1)`;
      ctx.beginPath();
      ctx.arc(px, py, d.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // 6. Impact flash when fragments hit atmosphere
    if (t > 0.6 && t < 0.85) {
      const flashP = (t - 0.6) / 0.25;
      const flashA =
        flashP < 0.3 ? (flashP / 0.3) * 0.35 : ((1 - flashP) / 0.7) * 0.35;
      ctx.save();
      ctx.globalAlpha = flashA;
      const impactGrad = ctx.createRadialGradient(
        W / 2,
        H * 0.75,
        0,
        W / 2,
        H * 0.75,
        W * 0.6,
      );
      impactGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
      impactGrad.addColorStop(0.2, 'rgba(200,220,255,0.4)');
      impactGrad.addColorStop(0.5, 'rgba(100,140,220,0.1)');
      impactGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = impactGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    framePngs.push(Buffer.from(canvas.toBuffer('image/png')));
  }

  // Assemble GIF
  const composites = framePngs.slice(1).map((buf, i) => ({
    input: buf,
    top: (i + 1) * H,
    left: 0,
  }));
  const tallPng = await sharp(framePngs[0]!)
    .extend({
      bottom: H * (FRAMES - 1),
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .composite(composites)
    .png()
    .toBuffer();
  const rawData = await sharp(tallPng).ensureAlpha().raw().toBuffer();

  return sharp(rawData, {
    raw: { width: W, height: H * FRAMES, channels: 4, pageHeight: H },
  })
    .gif({
      delay: [
        ...Array.from({ length: 5 }, () => 80), // space intro
        ...Array.from({ length: 12 }, () => 50), // fragments streaking
        ...Array.from({ length: 4 }, () => 45), // impact
        ...Array.from({ length: 3 }, () => 100), // linger
      ],
      loop: 1,
      colours: 160,
      dither: 0.35,
      effort: 8,
    })
    .toBuffer();
}

// ─────────────────────────────────────────────────────────────────────────────
// MISS CARD — TCG-style "cracked" card for failed pulls
// ─────────────────────────────────────────────────────────────────────────────

export async function generateGachaMissCard(
  message: string,
  balance: number,
): Promise<Buffer> {
  const W = 640;
  const H = 380;
  const FRAME = 10;
  const PAD = FRAME + 10;
  const INNER_W = W - PAD * 2;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // TCG-style grey parchment background
  const bg = ctx.createLinearGradient(0, 0, W * 0.3, H);
  bg.addColorStop(0, '#d4d0c8');
  bg.addColorStop(0.5, '#c4c0b8');
  bg.addColorStop(1, '#b8b4ac');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  drawNoise(ctx, W, H, 0.03);

  // Grey frame border
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = FRAME;
  ctx.beginPath();
  ctx.roundRect(FRAME / 2, FRAME / 2, W - FRAME, H - FRAME, 16);
  ctx.stroke();

  // Inner frame
  ctx.strokeStyle = 'rgba(100,100,100,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(FRAME + 4, FRAME + 4, W - FRAME * 2 - 8, H - FRAME * 2 - 8, 12);
  ctx.stroke();

  // Faded X watermark (cracked card feel)
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.font = 'bold 220px GoogleSans';
  ctx.fillStyle = '#4b4b4b';
  ctx.textAlign = 'center';
  ctx.fillText('\u2715', W / 2, H / 2 + 60);
  ctx.restore();

  // Diagonal crack lines
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W * 0.3, 0);
  ctx.lineTo(W * 0.6, H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W * 0.7, 0);
  ctx.lineTo(W * 0.4, H);
  ctx.stroke();
  ctx.restore();

  // Header bar (dark like TCG name header)
  drawBox(ctx, PAD, PAD + 2, INNER_W, 44, [8, 8, 0, 0], '#4b5563');

  // Title
  ctx.font = 'bold 28px GoogleSans';
  ctx.fillStyle = '#d1d5db';
  ctx.textAlign = 'center';
  ctx.fillText('BURST OUT !', W / 2, PAD + 32);

  drawSeparator(ctx, PAD, PAD + 52, INNER_W, '#6b7280');

  // Message text
  ctx.font = '14px GoogleSans';
  ctx.fillStyle = '#4b4540';
  ctx.textAlign = 'center';
  const words = message.split(' ');
  let line = '';
  let y = PAD + 80;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > INNER_W - 40) {
      ctx.fillText(line, W / 2, y);
      line = word;
      y += 22;
    } else line = test;
  }
  if (line) ctx.fillText(line, W / 2, y);

  // Flavor text
  ctx.font = 'bold 11px GoogleSans';
  ctx.fillStyle = '#9ca3af';
  ctx.fillText('-- La toupie a quitté le stadium... --', W / 2, H - PAD - 60);

  // Bottom status bar
  drawSeparator(ctx, PAD, H - PAD - 46, INNER_W, '#8a8a8a');
  drawBox(
    ctx,
    PAD,
    H - PAD - 40,
    INNER_W,
    30,
    [0, 0, 8, 8],
    'rgba(0,0,0,0.08)',
  );

  ctx.font = 'bold 13px GoogleSans';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#6b5e50';
  ctx.fillText(
    `${balance.toLocaleString('fr-FR')} coins restants`,
    PAD + 14,
    H - PAD - 20,
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = '#9ca3af';
  ctx.font = 'bold 12px GoogleSans';
  ctx.fillText('RPB TCG', W - PAD - 14, H - PAD - 20);

  return canvas.toBuffer('image/png');
}

// ─── Multi-Pull Canvas (v3 — TCG Layout) ────────────────────────────────────

export interface MultiPullSlot {
  rarity: string | null; // null = miss
  name?: string;
  imageUrl?: string | null;
  isDuplicate?: boolean;
  isWished?: boolean;
}

export interface MultiPullData {
  slots: MultiPullSlot[];
  balance: number;
  hitsCount: number;
  missCount: number;
}

export async function generateMultiPullCard(
  data: MultiPullData,
): Promise<Buffer> {
  const COLS = 5;
  const ROWS = 2;
  const CARD_W = 190;
  const CARD_H = 270;
  const GAP = 12;
  const PAD = 28;
  const HEADER = 76;
  const FOOTER = 56;
  const W = PAD * 2 + COLS * CARD_W + (COLS - 1) * GAP;
  const H = HEADER + ROWS * CARD_H + (ROWS - 1) * GAP + FOOTER + PAD;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ── TCG table background (dark felt green) ──
  const bgGrad = ctx.createLinearGradient(0, 0, W * 0.3, H);
  bgGrad.addColorStop(0, '#0f1a14');
  bgGrad.addColorStop(0.5, '#0c1610');
  bgGrad.addColorStop(1, '#08100c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle radial light
  const radGrad = ctx.createRadialGradient(
    W / 2,
    H / 2,
    50,
    W / 2,
    H / 2,
    W * 0.55,
  );
  radGrad.addColorStop(0, 'rgba(251,191,36,0.04)');
  radGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, W, H);

  drawNoise(ctx, W, H, 0.015);

  // Gold border frame
  const borderG = ctx.createLinearGradient(0, 0, W, H);
  borderG.addColorStop(0, 'rgba(180,83,9,0.4)');
  borderG.addColorStop(0.5, 'rgba(251,191,36,0.3)');
  borderG.addColorStop(1, 'rgba(180,83,9,0.4)');
  ctx.strokeStyle = borderG;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(6, 6, W - 12, H - 12, 16);
  ctx.stroke();

  // Header
  ctx.font = 'bold 30px GoogleSans';
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(251,191,36,0.25)';
  ctx.shadowBlur = 10;
  ctx.fillText('MULTI-PULL  \u00d710', W / 2, 48);
  ctx.shadowBlur = 0;

  // Subtitle
  ctx.font = 'bold 12px GoogleSans';
  ctx.fillStyle = '#6b5e50';
  ctx.fillText('RPB TCG \u2022 Drop 1', W / 2, 66);

  drawSeparator(ctx, PAD, HEADER - 4, W - PAD * 2, '#b45309');

  // ── Draw 10 mini TCG cards ──
  for (let i = 0; i < data.slots.length; i++) {
    const slot = data.slots[i]!;
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + col * (CARD_W + GAP);
    const y = HEADER + row * (CARD_H + GAP);
    const FR = 4; // mini frame

    if (!slot.rarity) {
      // ── MISS — greyed out TCG card ──
      // Parchment bg
      drawBox(ctx, x, y, CARD_W, CARD_H, 8, '#2a2a28', '#4b4b4840', 1.5);

      // Faded X watermark
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.font = 'bold 90px GoogleSans';
      ctx.fillStyle = '#888888';
      ctx.textAlign = 'center';
      ctx.fillText('\u2715', x + CARD_W / 2, y + CARD_H / 2 + 20);
      ctx.restore();

      // Grey header bar
      drawBox(
        ctx,
        x + FR,
        y + FR,
        CARD_W - FR * 2,
        22,
        [6, 6, 0, 0],
        '#3a3a38',
      );
      ctx.font = 'bold 11px GoogleSans';
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'center';
      ctx.fillText('BURST OUT', x + CARD_W / 2, y + FR + 16);

      // Bottom label
      ctx.font = 'bold 13px GoogleSans';
      ctx.fillStyle = '#4b5563';
      ctx.fillText('RAT\u00c9', x + CARD_W / 2, y + CARD_H - 16);
    } else {
      // ── Card drop — mini TCG card ──
      const t = RARITY_THEMES[slot.rarity] || RARITY_THEMES.COMMON!;

      // Card parchment background
      const cardGrad = ctx.createLinearGradient(
        x,
        y,
        x + CARD_W * 0.3,
        y + CARD_H,
      );
      cardGrad.addColorStop(0, t.bgGradient[0]);
      cardGrad.addColorStop(0.5, t.bgGradient[1]);
      cardGrad.addColorStop(1, t.bgGradient[2]);
      ctx.fillStyle = cardGrad;
      ctx.beginPath();
      ctx.roundRect(x, y, CARD_W, CARD_H, 8);
      ctx.fill();

      // Rarity border frame with glow
      ctx.shadowColor = t.glowColor;
      ctx.shadowBlur =
        slot.rarity === 'SECRET' || slot.rarity === 'LEGENDARY' ? 16 : 6;
      const bGrad = ctx.createLinearGradient(x, y, x + CARD_W, y + CARD_H);
      bGrad.addColorStop(0, t.borderGradient[0]);
      bGrad.addColorStop(0.5, t.borderGradient[1]);
      bGrad.addColorStop(1, t.borderGradient[2]);
      ctx.strokeStyle = bGrad;
      ctx.lineWidth = FR;
      ctx.beginPath();
      ctx.roundRect(x + FR / 2, y + FR / 2, CARD_W - FR, CARD_H - FR, 7);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Name header bar (dark, like TCG)
      const hdrH = 26;
      ctx.fillStyle = t.headerBg;
      ctx.beginPath();
      ctx.roundRect(x + FR, y + FR, CARD_W - FR * 2, hdrH, [5, 5, 0, 0]);
      ctx.fill();

      // Card name in header
      ctx.font = 'bold 12px GoogleSans';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      let name = slot.name || '???';
      if (ctx.measureText(name).width > CARD_W - 30)
        name = `${name.substring(0, 13)}\u2026`;
      ctx.fillText(name, x + FR + 8, y + FR + 18);

      // Rarity stars (right of header)
      ctx.textAlign = 'right';
      ctx.font = '10px GoogleSans';
      ctx.fillStyle = t.accentColor;
      ctx.fillText('\u2605'.repeat(t.stars), x + CARD_W - FR - 6, y + FR + 17);

      // Art window
      const imgY2 = y + FR + hdrH + 3;
      const imgH2 = 150;
      drawBox(
        ctx,
        x + FR + 3,
        imgY2,
        CARD_W - FR * 2 - 6,
        imgH2,
        3,
        '#0a0a12',
        `${t.frameColor}40`,
        1.5,
      );

      if (slot.imageUrl) {
        const img = await _loadImageNoWhiteBg(slot.imageUrl);
        if (img) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(
            x + FR + 4,
            imgY2 + 1,
            CARD_W - FR * 2 - 8,
            imgH2 - 2,
            2,
          );
          ctx.clip();
          const aspect = img.width / img.height;
          let dw = CARD_W - FR * 2 - 8,
            dh = imgH2 - 2;
          if (aspect > dw / dh) dh = dw / aspect;
          else dw = dh * aspect;
          ctx.drawImage(
            img,
            x + FR + 4 + (CARD_W - FR * 2 - 8 - dw) / 2,
            imgY2 + 1 + (imgH2 - 2 - dh) / 2,
            dw,
            dh,
          );
          // Bottom vignette
          const vig = ctx.createLinearGradient(0, imgY2, 0, imgY2 + imgH2);
          vig.addColorStop(0, 'rgba(0,0,0,0)');
          vig.addColorStop(0.8, 'rgba(0,0,0,0)');
          vig.addColorStop(1, 'rgba(0,0,0,0.5)');
          ctx.fillStyle = vig;
          ctx.fillRect(x + FR + 4, imgY2, CARD_W - FR * 2 - 8, imgH2);
          ctx.restore();
        }
      }

      // Rarity label below art
      const labelY2 = imgY2 + imgH2 + 6;
      ctx.font = 'bold 10px GoogleSans';
      ctx.fillStyle = t.borderColor;
      ctx.textAlign = 'center';
      ctx.fillText(t.label, x + CARD_W / 2, labelY2 + 4);

      // Status badge (WISHED / DOUBLON)
      const statusY2 = labelY2 + 18;
      if (slot.isWished) {
        drawBox(
          ctx,
          x + CARD_W / 2 - 38,
          statusY2,
          76,
          18,
          9,
          '#fbbf2420',
          '#fbbf24',
          1,
        );
        ctx.font = 'bold 10px GoogleSans';
        ctx.fillStyle = '#b45309';
        ctx.textAlign = 'center';
        ctx.fillText('WISHED', x + CARD_W / 2, statusY2 + 13);
      } else if (slot.isDuplicate) {
        drawBox(
          ctx,
          x + CARD_W / 2 - 38,
          statusY2,
          76,
          18,
          9,
          'rgba(107,114,128,0.12)',
          '#9ca3af80',
          1,
        );
        ctx.font = 'bold 10px GoogleSans';
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'center';
        ctx.fillText('DOUBLON', x + CARD_W / 2, statusY2 + 13);
      }

      // Bottom accent bar
      const accentGrad = ctx.createLinearGradient(x, 0, x + CARD_W, 0);
      accentGrad.addColorStop(0, `${t.borderColor}00`);
      accentGrad.addColorStop(0.5, t.borderColor);
      accentGrad.addColorStop(1, `${t.borderColor}00`);
      ctx.fillStyle = accentGrad;
      ctx.beginPath();
      ctx.roundRect(
        x + FR + 4,
        y + CARD_H - FR - 4,
        CARD_W - FR * 2 - 8,
        2.5,
        1,
      );
      ctx.fill();

      // Sparkles for high rarity
      if (slot.rarity === 'LEGENDARY' || slot.rarity === 'SECRET') {
        for (let s = 0; s < 4; s++) {
          drawSparkle(
            ctx,
            x + 12 + Math.random() * (CARD_W - 24),
            y + 30 + Math.random() * (CARD_H - 55),
            2 + Math.random() * 3,
            t.accentColor,
            0.3 + Math.random() * 0.35,
          );
        }
      }
    }
  }

  // ── Footer ──
  const footY = H - FOOTER - 6;
  drawSeparator(ctx, PAD, footY - 2, W - PAD * 2, '#b45309');
  drawBox(
    ctx,
    PAD,
    footY,
    W - PAD * 2,
    FOOTER,
    [0, 0, 10, 10],
    'rgba(0,0,0,0.2)',
  );

  ctx.font = 'bold 15px GoogleSans';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#22c55e';
  ctx.fillText(`${data.hitsCount} cartes`, PAD + 20, footY + 24);
  ctx.fillStyle = '#6b7280';
  ctx.fillText(`${data.missCount} rat\u00e9s`, PAD + 140, footY + 24);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#b4530990';
  ctx.font = 'bold 14px GoogleSans';
  ctx.fillText(
    `${data.balance.toLocaleString('fr-FR')} coins`,
    W - PAD - 20,
    footY + 24,
  );

  ctx.textAlign = 'center';
  ctx.font = '11px GoogleSans';
  ctx.fillStyle = 'rgba(180,83,9,0.35)';
  ctx.fillText(
    '\u00c9conomie : 50 coins vs tirages individuels',
    W / 2,
    footY + 46,
  );

  return canvas.toBuffer('image/png');
}

// ─── Collection Canvas (v2 — HD) ────────────────────────────────────────────

export interface CollectionCardData {
  username: string;
  avatarUrl: string;
  currency: number;
  streak: number;
  cards: Array<{
    name: string;
    rarity: string;
    count: number;
    imageUrl: string | null;
  }>;
  totalCards: number;
  badges: string[];
}

const RARITY_BORDER: Record<string, string> = {
  SECRET: '#ef4444',
  LEGENDARY: '#fbbf24',
  SUPER_RARE: '#8b5cf6',
  RARE: '#3b82f6',
  COMMON: '#6b7280',
};

export async function generateCollectionCard(
  data: CollectionCardData,
): Promise<Buffer> {
  const COLS = 5;
  const CELL = 110;
  const CELL_GAP = 12;
  const PAD = 28;
  const HEADER = 180;
  const rows = Math.ceil(data.cards.length / COLS);
  const gridH = rows * (CELL + CELL_GAP);
  const W = PAD * 2 + COLS * (CELL + CELL_GAP);
  const H = HEADER + gridH + 60;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  const bg = ctx.createLinearGradient(0, 0, W * 0.2, H);
  bg.addColorStop(0, '#0c1220');
  bg.addColorStop(0.5, '#0a0f1a');
  bg.addColorStop(1, '#050810');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawNoise(ctx, W, H, 0.02);

  // Border with gold gradient
  const bGrad = ctx.createLinearGradient(0, 0, W, H);
  bGrad.addColorStop(0, 'rgba(251,191,36,0.2)');
  bGrad.addColorStop(0.5, 'rgba(251,191,36,0.35)');
  bGrad.addColorStop(1, 'rgba(251,191,36,0.2)');
  ctx.strokeStyle = bGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(8, 8, W - 16, H - 16, 16);
  ctx.stroke();

  // ── Header ──
  const avatar = await safeLoadImage(data.avatarUrl);
  const avX = PAD + 36,
    avY = 42,
    avR = 32;
  // Avatar glow
  ctx.shadowColor = 'rgba(251,191,36,0.3)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(avX, avY, avR, 0, Math.PI * 2);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Avatar image
  ctx.save();
  ctx.beginPath();
  ctx.arc(avX, avY, avR - 2, 0, Math.PI * 2);
  ctx.clip();
  if (avatar)
    ctx.drawImage(
      avatar,
      avX - avR + 2,
      avY - avR + 2,
      (avR - 2) * 2,
      (avR - 2) * 2,
    );
  else {
    ctx.fillStyle = '#374151';
    ctx.fill();
  }
  ctx.restore();

  // Username
  ctx.font = 'bold 24px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 4;
  ctx.fillText(data.username, avX + avR + 16, avY + 8);
  ctx.shadowBlur = 0;

  // Stats row
  const pct =
    data.totalCards > 0
      ? Math.round((data.cards.length / data.totalCards) * 100)
      : 0;
  ctx.font = 'bold 14px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  const statsY = 95;
  ctx.fillText(`🪙 ${data.currency.toLocaleString('fr-FR')}`, PAD, statsY);
  ctx.fillText(`🔥 ${data.streak}j`, PAD + 140, statsY);
  ctx.fillText(
    `🃏 ${data.cards.length}/${data.totalCards} (${pct}%)`,
    PAD + 230,
    statsY,
  );

  // Progress bar
  const barY2 = statsY + 18;
  const barW2 = W - PAD * 2;
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.roundRect(PAD, barY2, barW2, 10, 5);
  ctx.fill();
  // Gold fill with gradient
  if (pct > 0) {
    const progGrad = ctx.createLinearGradient(
      PAD,
      0,
      PAD + (barW2 * pct) / 100,
      0,
    );
    progGrad.addColorStop(0, '#d97706');
    progGrad.addColorStop(1, '#fbbf24');
    ctx.fillStyle = progGrad;
    ctx.beginPath();
    ctx.roundRect(PAD, barY2, (barW2 * pct) / 100, 10, 5);
    ctx.fill();
  }

  // Badges
  if (data.badges.length > 0) {
    ctx.font = '13px GoogleSans';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(data.badges.join('  '), PAD, barY2 + 28);
  }

  // Section title
  ctx.font = 'bold 14px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'left';
  ctx.fillText('COLLECTION', PAD, HEADER - 10);
  // Decorative line
  const titleLineW = ctx.measureText('COLLECTION').width;
  const tlGrad = ctx.createLinearGradient(PAD + titleLineW + 10, 0, W - PAD, 0);
  tlGrad.addColorStop(0, 'rgba(251,191,36,0.2)');
  tlGrad.addColorStop(1, 'rgba(251,191,36,0)');
  ctx.strokeStyle = tlGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD + titleLineW + 10, HEADER - 14);
  ctx.lineTo(W - PAD, HEADER - 14);
  ctx.stroke();

  // ── Card grid ──
  for (let i = 0; i < data.cards.length; i++) {
    const card = data.cards[i]!;
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + col * (CELL + CELL_GAP);
    const y = HEADER + row * (CELL + CELL_GAP);
    const borderColor = RARITY_BORDER[card.rarity] || '#6b7280';

    // Card background
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.beginPath();
    ctx.roundRect(x, y, CELL, CELL, 10);
    ctx.fill();

    // Card image — force white bg removal for character art
    const img = await _loadImageNoWhiteBg(card.imageUrl);
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, CELL - 6, CELL - 24, 8);
      ctx.clip();
      const imgAspect = img.width / img.height;
      let dw = CELL - 6,
        dh = CELL - 24;
      if (imgAspect > 1) dh = dw / imgAspect;
      else dw = dh * imgAspect;
      ctx.drawImage(
        img,
        x + 3 + (CELL - 6 - dw) / 2,
        y + 3 + (CELL - 24 - dh) / 2,
        dw,
        dh,
      );
      // Subtle vignette
      const vg = ctx.createLinearGradient(0, y + 3, 0, y + CELL - 24);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(0.8, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = vg;
      ctx.fillRect(x + 3, y + 3, CELL - 6, CELL - 24);
      ctx.restore();
    }

    // Rarity border with glow for high rarities
    if (
      card.rarity === 'LEGENDARY' ||
      card.rarity === 'SECRET' ||
      card.rarity === 'SUPER_RARE'
    ) {
      ctx.shadowColor = `${borderColor}40`;
      ctx.shadowBlur = 6;
    }
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, CELL, CELL, 10);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Name
    ctx.font = 'bold 10px GoogleSans';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    let name = card.name.split(' ')[0] || card.name;
    if (ctx.measureText(name).width > CELL - 8)
      name = `${name.substring(0, 8)}…`;
    ctx.fillText(name, x + CELL / 2, y + CELL - 5);

    // Count badge
    if (card.count > 1) {
      ctx.fillStyle = borderColor;
      ctx.shadowColor = `${borderColor}60`;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(x + CELL - 10, y + 10, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = 'bold 10px GoogleSans';
      ctx.fillStyle = '#fff';
      ctx.fillText(`x${card.count}`, x + CELL - 10, y + 13);
    }
    ctx.textAlign = 'left';
  }

  // ── Footer ──
  ctx.font = '12px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.textAlign = 'center';
  ctx.fillText('RPB Gacha · /gacha collection', W / 2, H - 16);

  return canvas.toBuffer('image/png');
}

// ─── Battle Result Canvas (enhanced) ────────────────────────────────────────

export interface BattleResultData {
  winnerName: string;
  winnerAvatarUrl: string;
  winnerCombo: string;
  winnerType: string | null;
  loserName: string;
  loserAvatarUrl: string;
  loserCombo: string;
  loserType: string | null;
  finishMessage: string;
  hpWinner: number;
  hpLoser: number;
  maxHp: number;
  rounds: number;
  coinReward: number;
  log: string[];
}

const BEY_TYPE_COLORS: Record<string, string> = {
  ATTACK: '#ef4444',
  DEFENSE: '#3b82f6',
  STAMINA: '#22c55e',
  BALANCE: '#a855f7',
};

export async function generateBattleResultCard(
  data: BattleResultData,
): Promise<Buffer> {
  const W = 900;
  const H = 520;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0f0a1a');
  bg.addColorStop(0.5, '#1a0a0a');
  bg.addColorStop(1, '#0a0f1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Diagonal slash
  ctx.strokeStyle = 'rgba(220,38,38,0.15)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W * 0.4, 0);
  ctx.lineTo(W * 0.6, H);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(220,38,38,0.08)';
  ctx.beginPath();
  ctx.moveTo(W * 0.42, 0);
  ctx.lineTo(W * 0.62, H);
  ctx.stroke();

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(8, 8, W - 16, H - 16, 14);
  ctx.stroke();

  // ── Finish banner ──
  ctx.fillStyle = 'rgba(220,38,38,0.9)';
  ctx.beginPath();
  ctx.roundRect(W / 2 - 180, 15, 360, 40, 20);
  ctx.fill();
  ctx.font = 'bold 20px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(data.finishMessage, W / 2, 42);

  // ── Winner side (left) ──
  const wAvatar = await safeLoadImage(data.winnerAvatarUrl);
  const wColor = BEY_TYPE_COLORS[data.winnerType || ''] || '#fbbf24';

  // Glow
  ctx.shadowColor = `${wColor}60`;
  ctx.shadowBlur = 30;
  ctx.strokeStyle = wColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(150, 170, 65, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(150, 170, 63, 0, Math.PI * 2);
  ctx.clip();
  if (wAvatar) ctx.drawImage(wAvatar, 87, 107, 126, 126);
  else {
    ctx.fillStyle = '#1f2937';
    ctx.fill();
  }
  ctx.restore();

  // Crown
  ctx.font = '30px GoogleSans';
  ctx.fillText('👑', 150, 90);

  // Winner name
  ctx.font = 'bold 22px GoogleSans';
  ctx.fillStyle = wColor;
  ctx.fillText(data.winnerName, 150, 260);

  // Combo
  ctx.font = '12px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(data.winnerCombo, 150, 280);

  // HP bar winner
  const hpBarW = 200;
  const wPct = data.hpWinner / data.maxHp;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.roundRect(50, 295, hpBarW, 10, 5);
  ctx.fill();
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.roundRect(50, 295, hpBarW * wPct, 10, 5);
  ctx.fill();
  ctx.font = '10px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(`${Math.round(data.hpWinner)}/${data.maxHp} PV`, 150, 320);

  // ── VS ──
  ctx.font = 'italic bold 50px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillText('VS', W / 2, 190);

  // ── Loser side (right) ──
  const lAvatar = await safeLoadImage(data.loserAvatarUrl);
  const lColor = BEY_TYPE_COLORS[data.loserType || ''] || '#6b7280';

  ctx.strokeStyle = `${lColor}60`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(W - 150, 170, 55, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(W - 150, 170, 53, 0, Math.PI * 2);
  ctx.clip();
  if (lAvatar) ctx.drawImage(lAvatar, W - 203, 117, 106, 106);
  else {
    ctx.fillStyle = '#1f2937';
    ctx.fill();
  }
  ctx.restore();

  // Grayscale overlay on loser
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.arc(W - 150, 170, 53, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 18px GoogleSans';
  ctx.fillStyle = '#6b7280';
  ctx.fillText(data.loserName, W - 150, 250);

  ctx.font = '12px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText(data.loserCombo, W - 150, 270);

  // HP bar loser (empty)
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.roundRect(W - 250, 285, hpBarW, 10, 5);
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  const lPct = data.hpLoser / data.maxHp;
  if (lPct > 0) {
    ctx.beginPath();
    ctx.roundRect(W - 250, 285, hpBarW * lPct, 10, 5);
    ctx.fill();
  }
  ctx.font = '10px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText(`${Math.round(data.hpLoser)}/${data.maxHp} PV`, W - 150, 310);

  // ── Battle log ──
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.beginPath();
  ctx.roundRect(30, 340, W - 60, 120, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(30, 340, W - 60, 120, 10);
  ctx.stroke();

  ctx.font = 'bold 11px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.textAlign = 'left';
  ctx.fillText(`COMBAT · ${data.rounds} TOURS`, 50, 358);

  ctx.font = '12px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  const logLines = data.log.slice(-4);
  for (let i = 0; i < logLines.length; i++) {
    let text = logLines[i]!;
    if (ctx.measureText(text).width > W - 100)
      text = `${text.substring(0, 80)}…`;
    ctx.fillText(text, 50, 378 + i * 18);
  }

  // ── Reward bar ──
  ctx.fillStyle = 'rgba(251,191,36,0.1)';
  ctx.beginPath();
  ctx.roundRect(30, H - 45, W - 60, 30, 8);
  ctx.fill();
  ctx.font = 'bold 13px GoogleSans';
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'center';
  ctx.fillText(
    `🪙 ${data.winnerName} +${data.coinReward} · ${data.loserName} +5`,
    W / 2,
    H - 25,
  );

  return canvas.toBuffer('image/png');
}

// ─── Gacha Duel Canvas (v2 — HD) ────────────────────────────────────────────

export interface GachaDuelData {
  cardA: {
    name: string;
    rarity: string;
    beyblade: string;
    imageUrl: string | null;
    series: string;
  };
  cardB: {
    name: string;
    rarity: string;
    beyblade: string;
    imageUrl: string | null;
    series: string;
  };
  playerA: string;
  playerB: string;
  winner: 'A' | 'B';
  finishMessage: string;
  scoreA: number;
  scoreB: number;
  coinReward: number;
}

export async function generateGachaDuelCard(
  data: GachaDuelData,
): Promise<Buffer> {
  const W = 1080,
    H = 520;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#08001a');
  bg.addColorStop(0.5, '#140808');
  bg.addColorStop(1, '#000814');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Center energy glow
  const vsGlow = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 250);
  vsGlow.addColorStop(0, 'rgba(220,38,38,0.12)');
  vsGlow.addColorStop(0.5, 'rgba(220,38,38,0.04)');
  vsGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vsGlow;
  ctx.fillRect(0, 0, W, H);

  // Diagonal energy lines
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 30) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  ctx.restore();

  drawNoise(ctx, W, H, 0.02);

  // Border
  const brdGrad = ctx.createLinearGradient(0, 0, W, H);
  brdGrad.addColorStop(0, 'rgba(220,38,38,0.2)');
  brdGrad.addColorStop(0.5, 'rgba(220,38,38,0.35)');
  brdGrad.addColorStop(1, 'rgba(220,38,38,0.2)');
  ctx.strokeStyle = brdGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(8, 8, W - 16, H - 16, 16);
  ctx.stroke();

  const drawSide = async (
    card: typeof data.cardA,
    player: string,
    x: number,
    isWinner: boolean,
    score: number,
  ) => {
    const t = RARITY_THEMES[card.rarity] || RARITY_THEMES.COMMON!;
    const cW = 400,
      cH = 430,
      cy = 36;

    // Card background
    const cg = ctx.createLinearGradient(x, cy, x + cW * 0.2, cy + cH);
    cg.addColorStop(0, t.bgGradient[0]);
    cg.addColorStop(0.5, t.bgGradient[1]);
    cg.addColorStop(1, t.bgGradient[2]);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.roundRect(x, cy, cW, cH, 14);
    ctx.fill();

    // Border with glow
    if (isWinner) {
      ctx.shadowColor = t.glowColor;
      ctx.shadowBlur = 25;
    }
    const cbGrad = ctx.createLinearGradient(x, cy, x + cW, cy + cH);
    cbGrad.addColorStop(0, t.borderGradient[0]);
    cbGrad.addColorStop(0.5, t.borderGradient[1]);
    cbGrad.addColorStop(1, t.borderGradient[2]);
    ctx.strokeStyle = isWinner ? cbGrad : `${t.borderColor}50`;
    ctx.lineWidth = isWinner ? 3 : 1.5;
    ctx.beginPath();
    ctx.roundRect(x, cy, cW, cH, 14);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Crown
    if (isWinner) {
      ctx.font = '28px GoogleSans';
      ctx.textAlign = 'center';
      ctx.fillText('👑', x + cW / 2, cy - 4);
    }

    // Rarity band
    ctx.fillStyle = `${t.borderColor}CC`;
    ctx.beginPath();
    ctx.roundRect(x + 5, cy + 5, cW - 10, 26, [11, 11, 0, 0]);
    ctx.fill();
    ctx.font = 'bold 12px GoogleSans';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 3;
    ctx.fillText(
      `${t.label} · ${'★'.repeat(t.stars)}${'☆'.repeat(5 - t.stars)}`,
      x + cW / 2,
      cy + 22,
    );
    ctx.shadowBlur = 0;

    // Image
    const imgY = cy + 36,
      imgH = 190;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.roundRect(x + 10, imgY, cW - 20, imgH, 10);
    ctx.fill();
    const img = await _loadImageNoWhiteBg(card.imageUrl);
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x + 10, imgY, cW - 20, imgH, 10);
      ctx.clip();
      const a = img.width / img.height;
      let dw = cW - 20,
        dh = imgH;
      if (a > dw / dh) dh = dw / a;
      else dw = dh * a;
      ctx.drawImage(
        img,
        x + 10 + (cW - 20 - dw) / 2,
        imgY + (imgH - dh) / 2,
        dw,
        dh,
      );
      // Vignette
      const vig = ctx.createLinearGradient(0, imgY, 0, imgY + imgH);
      vig.addColorStop(0, 'rgba(0,0,0,0.1)');
      vig.addColorStop(0.6, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = vig;
      ctx.fillRect(x + 10, imgY, cW - 20, imgH);
      ctx.restore();
    }
    if (!isWinner) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.roundRect(x + 10, imgY, cW - 20, imgH, 10);
      ctx.fill();
      ctx.font = 'bold 42px GoogleSans';
      ctx.fillStyle = 'rgba(239,68,68,0.35)';
      ctx.textAlign = 'center';
      ctx.fillText('✕', x + cW / 2, imgY + imgH / 2 + 16);
    }

    // Name + player
    ctx.font = 'bold 20px GoogleSans';
    ctx.fillStyle = isWinner ? '#ffffff' : 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = isWinner ? 4 : 0;
    let nm = card.name;
    if (ctx.measureText(nm).width > cW - 30) nm = `${nm.substring(0, 20)}…`;
    ctx.fillText(nm, x + cW / 2, imgY + imgH + 28);
    ctx.shadowBlur = 0;
    ctx.font = '13px GoogleSans';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(player, x + cW / 2, imgY + imgH + 48);

    // Beyblade box
    const beyY = imgY + imgH + 58;
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.strokeStyle = `${t.borderColor}20`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 14, beyY, cW - 28, 30, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + 14, beyY, cW - 28, 30, 8);
    ctx.stroke();
    ctx.font = 'bold 12px GoogleSans';
    ctx.fillStyle = t.accentColor;
    ctx.textAlign = 'left';
    let bey = card.beyblade;
    if (ctx.measureText(`🌀 ${bey}`).width > cW - 50)
      bey = `${bey.substring(0, 24)}…`;
    ctx.fillText(`🌀 ${bey}`, x + 24, beyY + 20);

    // Power bar
    const barY3 = beyY + 40;
    const barW3 = cW - 28;
    const pct = Math.min(score / 100, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(x + 14, barY3, barW3, 10, 5);
    ctx.fill();
    const pwrColor = isWinner ? '#22c55e' : '#ef4444';
    const pwrGrad = ctx.createLinearGradient(
      x + 14,
      0,
      x + 14 + barW3 * pct,
      0,
    );
    pwrGrad.addColorStop(0, pwrColor);
    pwrGrad.addColorStop(1, `${pwrColor}80`);
    ctx.fillStyle = pwrGrad;
    ctx.beginPath();
    ctx.roundRect(x + 14, barY3, barW3 * pct, 10, 5);
    ctx.fill();
    ctx.font = 'bold 11px GoogleSans';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(score)} PWR`, x + cW / 2, barY3 + 24);

    // Sparkles for winner
    if (isWinner && (card.rarity === 'LEGENDARY' || card.rarity === 'SECRET')) {
      for (let s = 0; s < 6; s++) {
        drawSparkle(
          ctx,
          x + 15 + Math.random() * (cW - 30),
          cy + 20 + Math.random() * (cH - 40),
          3 + Math.random() * 4,
          t.accentColor,
          0.25 + Math.random() * 0.3,
        );
      }
    }
  };

  await drawSide(
    data.cardA,
    data.playerA,
    28,
    data.winner === 'A',
    data.scoreA,
  );
  await drawSide(
    data.cardB,
    data.playerB,
    W - 428,
    data.winner === 'B',
    data.scoreB,
  );

  // ── Center VS ──
  // VS glow circle
  const vsCircleGrad = ctx.createRadialGradient(
    W / 2,
    H / 2 - 10,
    5,
    W / 2,
    H / 2 - 10,
    50,
  );
  vsCircleGrad.addColorStop(0, 'rgba(220,38,38,0.15)');
  vsCircleGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vsCircleGrad;
  ctx.fillRect(W / 2 - 50, H / 2 - 60, 100, 100);

  ctx.font = 'italic bold 56px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.textAlign = 'center';
  ctx.fillText('VS', W / 2, H / 2 - 10);

  // Finish banner
  ctx.fillStyle = 'rgba(220,38,38,0.85)';
  ctx.shadowColor = 'rgba(220,38,38,0.3)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.roundRect(W / 2 - 140, H / 2 + 5, 280, 36, 18);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.font = 'bold 15px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.finishMessage, W / 2, H / 2 + 28);

  ctx.font = 'bold 13px GoogleSans';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`🪙 +${data.coinReward} au gagnant`, W / 2, H / 2 + 56);

  return canvas.toBuffer('image/png');
}

// ═══════════════════════════════════════════════════════════════════════════════
// GACHA LEADERBOARD CARD
// ═══════════════════════════════════════════════════════════════════════════════

export interface GachaLeaderboardEntry {
  rank: number;
  name: string;
  avatarUrl: string | null;
  uniqueCards: number;
  totalCards: number;
  percentage: number;
  isCallerRow?: boolean;
}

export interface GachaRichEntry {
  rank: number;
  name: string;
  avatarUrl: string | null;
  currency: number;
  isCallerRow?: boolean;
}

export interface GachaLeaderboardData {
  collectors: GachaLeaderboardEntry[];
  richest: GachaRichEntry[];
  callerName: string;
  callerRank: number;
  totalAvailableCards: number;
}

export async function generateGachaLeaderboardCard(
  data: GachaLeaderboardData,
): Promise<Buffer> {
  const W = 900;
  const ROW_H = 72;
  const HEADER_H = 140;
  const SECTION_GAP = 50;
  const collectorRows = data.collectors.length;
  const richRows = data.richest.length;
  const H =
    HEADER_H + collectorRows * ROW_H + SECTION_GAP + 40 + richRows * ROW_H + 80;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, W * 0.2, H);
  bgGrad.addColorStop(0, '#0c0e14');
  bgGrad.addColorStop(0.5, '#10131c');
  bgGrad.addColorStop(1, '#08090f');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);
  drawNoise(ctx, W, H, 0.02);

  // Decorative side lines
  ctx.strokeStyle = 'rgba(251,191,36,0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, 120);
  ctx.lineTo(30, H - 50);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W - 30, 120);
  ctx.lineTo(W - 30, H - 50);
  ctx.stroke();

  // Header
  ctx.font = 'bold 42px GoogleSans';
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(251,191,36,0.3)';
  ctx.shadowBlur = 15;
  ctx.fillText('CLASSEMENT GACHA', W / 2, 55);
  ctx.shadowBlur = 0;

  ctx.font = 'bold 16px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText(
    `${data.totalAvailableCards} cartes disponibles · rpbey.fr`,
    W / 2,
    82,
  );

  // Divider
  const divGrad = ctx.createLinearGradient(60, 0, W - 60, 0);
  divGrad.addColorStop(0, 'transparent');
  divGrad.addColorStop(0.5, 'rgba(251,191,36,0.4)');
  divGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 100);
  ctx.lineTo(W - 60, 100);
  ctx.stroke();

  // Section: Top Collectors
  let y = HEADER_H;
  ctx.textAlign = 'left';
  ctx.font = 'bold 22px GoogleSans';
  ctx.fillStyle = '#a78bfa';
  // Draw card icon (small filled rect)
  ctx.fillRect(50, y - 22, 10, 14);
  ctx.fillText('  TOP COLLECTIONNEURS', 62, y - 10);

  const medals = ['#1', '#2', '#3'];
  const medalColors = ['#fbbf24', '#e2e8f0', '#cd7f32'];

  const collectorAvatars = await Promise.all(
    data.collectors.map((c) => safeLoadImage(c.avatarUrl)),
  );

  for (let i = 0; i < data.collectors.length; i++) {
    const entry = data.collectors[i]!;
    const avatar = collectorAvatars[i] ?? null;
    const ry = y + i * ROW_H;

    // Row bg
    if (entry.isCallerRow) {
      ctx.fillStyle = 'rgba(251,191,36,0.06)';
      ctx.beginPath();
      ctx.roundRect(40, ry - 2, W - 80, ROW_H - 6, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(251,191,36,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(40, ry - 2, W - 80, ROW_H - 6, 8);
      ctx.stroke();
    } else if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.015)';
      ctx.beginPath();
      ctx.roundRect(40, ry - 2, W - 80, ROW_H - 6, 8);
      ctx.fill();
    }

    // Rank
    const rankColor = medalColors[i] || '#64748b';
    // Rank circle with number
    ctx.fillStyle = rankColor;
    ctx.beginPath();
    ctx.arc(80, ry + 30, 20, 0, Math.PI * 2);
    ctx.fill();
    if (i < 3) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(80, ry + 30, 20, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.font = 'bold 18px GoogleSans';
    ctx.fillStyle = i < 3 ? '#000' : '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`${entry.rank}`, 80, ry + 37);

    // Avatar
    drawCircularAvatar(
      ctx,
      avatar,
      138,
      ry + 30,
      22,
      i < 3 ? rankColor : 'rgba(255,255,255,0.1)',
    );

    // Name
    ctx.textAlign = 'left';
    ctx.font = 'bold 20px GoogleSans';
    ctx.fillStyle = entry.isCallerRow ? '#fbbf24' : '#fff';
    let eName = entry.name;
    while (ctx.measureText(eName).width > 260 && eName.length > 8)
      eName = `${eName.slice(0, -2)}…`;
    ctx.fillText(eName, 175, ry + 28);

    // Progress bar
    const barX = 175;
    const barY2 = ry + 40;
    const barW = 300;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(barX, barY2, barW, 8, 4);
    ctx.fill();
    const fillW = (entry.percentage / 100) * barW;
    const bGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    bGrad.addColorStop(0, '#a78bfa');
    bGrad.addColorStop(1, '#7c3aed');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY2, Math.max(fillW, 1), 8, 4);
    ctx.fill();

    // Stats
    ctx.textAlign = 'right';
    ctx.font = 'bold 22px GoogleSans';
    ctx.fillStyle = '#a78bfa';
    ctx.fillText(`${entry.uniqueCards}/${entry.totalCards}`, W - 140, ry + 30);
    ctx.font = 'bold 18px GoogleSans';
    ctx.fillStyle =
      entry.percentage >= 80 ? '#fbbf24' : 'rgba(255,255,255,0.5)';
    ctx.fillText(`${entry.percentage}%`, W - 60, ry + 30);
  }

  // Section: Top Richest
  y = HEADER_H + collectorRows * ROW_H + SECTION_GAP;
  ctx.textAlign = 'left';
  ctx.font = 'bold 22px GoogleSans';
  ctx.fillStyle = '#fbbf24';
  // Gold coin icon
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(62, y - 15, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 10px GoogleSans';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.fillText('$', 62, y - 12);
  ctx.font = 'bold 22px GoogleSans';
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'left';
  ctx.fillText('TOP FORTUNES', 78, y - 10);

  const richAvatars = await Promise.all(
    data.richest.map((r) => safeLoadImage(r.avatarUrl)),
  );

  for (let i = 0; i < data.richest.length; i++) {
    const entry = data.richest[i]!;
    const avatar = richAvatars[i] ?? null;
    const ry = y + i * ROW_H;

    if (entry.isCallerRow) {
      ctx.fillStyle = 'rgba(251,191,36,0.06)';
      ctx.beginPath();
      ctx.roundRect(40, ry - 2, W - 80, ROW_H - 6, 8);
      ctx.fill();
    } else if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.015)';
      ctx.beginPath();
      ctx.roundRect(40, ry - 2, W - 80, ROW_H - 6, 8);
      ctx.fill();
    }

    if (i < 3) {
      ctx.font = 'bold 26px GoogleSans';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(medals[i]!, 80, ry + 38);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(80, ry + 30, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 16px GoogleSans';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.fillText(`${entry.rank}`, 80, ry + 36);
    }

    drawCircularAvatar(
      ctx,
      avatar,
      138,
      ry + 30,
      22,
      i < 3 ? medalColors[i]! : 'rgba(255,255,255,0.1)',
    );

    ctx.textAlign = 'left';
    ctx.font = 'bold 20px GoogleSans';
    ctx.fillStyle = entry.isCallerRow ? '#fbbf24' : '#fff';
    let rName = entry.name;
    while (ctx.measureText(rName).width > 350 && rName.length > 8)
      rName = `${rName.slice(0, -2)}…`;
    ctx.fillText(rName, 175, ry + 35);

    ctx.textAlign = 'right';
    ctx.font = 'bold 26px GoogleSans';
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = 'rgba(251,191,36,0.2)';
    ctx.shadowBlur = 8;
    ctx.fillText(
      `${entry.currency.toLocaleString('fr-FR')} coins`,
      W - 60,
      ry + 38,
    );
    ctx.shadowBlur = 0;
  }

  // Footer
  ctx.textAlign = 'center';
  if (data.callerRank > 0) {
    ctx.font = 'bold 16px GoogleSans';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(
      `${data.callerName} — #${data.callerRank} au classement`,
      W / 2,
      H - 35,
    );
  } else {
    ctx.font = '14px GoogleSans';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText('Commence ta collection avec /gacha gacha !', W / 2, H - 35);
  }

  return canvas.toBuffer('image/png');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ECONOMY PROFILE CARD
// ═══════════════════════════════════════════════════════════════════════════════

export interface EconomyProfileData {
  name: string;
  avatarUrl: string;
  currency: number;
  streak: number;
  uniqueCards: number;
  totalCards: number;
  totalCopies: number;
  wishlistCount: number;
  dupeCount: number;
  totalSpent: number;
  badge: string;
  nextBadge: string | null;
  rarityBreakdown: { rarity: string; count: number; emoji: string }[];
}

const RARITY_BAR_COLORS: Record<string, string> = {
  SECRET: '#ef4444',
  LEGENDARY: '#f59e0b',
  SUPER_RARE: '#8b5cf6',
  RARE: '#3b82f6',
  COMMON: '#6b7280',
};

export async function generateEconomyProfileCard(
  data: EconomyProfileData,
): Promise<Buffer> {
  const W = 700;
  const H = 520;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, W * 0.3, H);
  bgGrad.addColorStop(0, '#0c0e16');
  bgGrad.addColorStop(0.5, '#10131e');
  bgGrad.addColorStop(1, '#080a10');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);
  drawNoise(ctx, W, H, 0.02);

  // Outer border
  ctx.strokeStyle = 'rgba(251,191,36,0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(10, 10, W - 20, H - 20, 16);
  ctx.stroke();

  // Avatar + Name header
  const avatar = await safeLoadImage(data.avatarUrl);
  drawCircularAvatar(ctx, avatar, 60, 55, 30, '#fbbf24');

  ctx.textAlign = 'left';
  ctx.font = 'bold 28px GoogleSans';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.fillText(data.name, 105, 50);
  ctx.shadowBlur = 0;

  ctx.font = 'bold 14px GoogleSans';
  ctx.fillStyle = data.badge ? '#fbbf24' : 'rgba(255,255,255,0.4)';
  ctx.fillText(data.badge || 'Aucun badge', 105, 72);

  // Currency + Streak + Wishlist boxes
  const statsY = 105;
  const statBoxW = (W - 80) / 3;
  const statBoxes = [
    {
      label: 'PIECES',
      value: data.currency.toLocaleString('fr-FR'),
      sym: '$',
      color: '#fbbf24',
    },
    {
      label: 'STREAK',
      value: `${data.streak} jour${data.streak !== 1 ? 's' : ''}`,
      sym: 'x',
      color: '#ef4444',
    },
    {
      label: 'WISHLIST',
      value: `${data.wishlistCount}`,
      sym: '*',
      color: '#a78bfa',
    },
  ];

  for (let i = 0; i < statBoxes.length; i++) {
    const sb = statBoxes[i]!;
    const sx = 30 + i * (statBoxW + 10);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.roundRect(sx, statsY, statBoxW, 60, 10);
    ctx.fill();
    ctx.strokeStyle = `${sb.color}20`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(sx, statsY, statBoxW, 60, 10);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px GoogleSans';
    ctx.fillStyle = sb.color;
    ctx.shadowColor = `${sb.color}40`;
    ctx.shadowBlur = 6;
    // Draw colored circle indicator instead of emoji
    const iconX = sx + statBoxW / 2 - ctx.measureText(sb.value).width / 2 - 14;
    ctx.beginPath();
    ctx.arc(iconX, statsY + 25, 6, 0, Math.PI * 2);
    ctx.fillStyle = sb.color;
    ctx.fill();
    ctx.font = 'bold 8px GoogleSans';
    ctx.fillStyle = '#000';
    ctx.fillText(sb.sym, iconX, statsY + 28);
    ctx.font = 'bold 22px GoogleSans';
    ctx.fillStyle = sb.color;
    ctx.fillText(sb.value, sx + statBoxW / 2 + 4, statsY + 30);
    ctx.shadowBlur = 0;
    ctx.font = 'bold 10px GoogleSans';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(sb.label, sx + statBoxW / 2, statsY + 50);
  }

  // Collection progress
  const collY = 190;
  ctx.textAlign = 'left';
  ctx.font = 'bold 16px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('COLLECTION', 30, collY);
  const pct =
    data.totalCards > 0
      ? Math.round((data.uniqueCards / data.totalCards) * 100)
      : 0;
  ctx.textAlign = 'right';
  ctx.font = 'bold 16px GoogleSans';
  ctx.fillStyle = pct >= 80 ? '#fbbf24' : pct >= 50 ? '#22c55e' : '#64748b';
  ctx.fillText(
    `${data.uniqueCards} / ${data.totalCards} (${pct}%)`,
    W - 30,
    collY,
  );

  const barY = collY + 12;
  const barW = W - 60;
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.roundRect(30, barY, barW, 14, 7);
  ctx.fill();
  if (pct > 0) {
    const fillW = (pct / 100) * barW;
    const pGrad = ctx.createLinearGradient(30, 0, 30 + fillW, 0);
    pGrad.addColorStop(0, pct >= 80 ? '#fbbf24' : '#a78bfa');
    pGrad.addColorStop(1, pct >= 80 ? '#f59e0b' : '#7c3aed');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.roundRect(30, barY, fillW, 14, 7);
    ctx.fill();
  }

  // Rarity breakdown — stacked bar
  const rarY = collY + 45;
  ctx.font = 'bold 14px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'left';
  ctx.fillText('RÉPARTITION PAR RARETÉ', 30, rarY);

  const rarBarY = rarY + 14;
  const rarBarW = W - 60;
  const rarBarH = 22;
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.beginPath();
  ctx.roundRect(30, rarBarY, rarBarW, rarBarH, 6);
  ctx.fill();

  let rx = 30;
  const total = data.rarityBreakdown.reduce((s, r) => s + r.count, 0) || 1;
  for (const r of data.rarityBreakdown) {
    const rw = (r.count / total) * rarBarW;
    if (rw < 1) continue;
    ctx.fillStyle = RARITY_BAR_COLORS[r.rarity] || '#666';
    ctx.fillRect(rx, rarBarY, rw, rarBarH);
    rx += rw;
  }

  // Legend
  const legY = rarBarY + rarBarH + 14;
  let lx = 30;
  for (const r of data.rarityBreakdown) {
    if (r.count === 0) continue;
    const color = RARITY_BAR_COLORS[r.rarity] || '#666';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lx + 5, legY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 12px GoogleSans';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'left';
    const label = `${r.count}`;
    ctx.fillText(label, lx + 14, legY + 4);
    lx += ctx.measureText(label).width + 30;
  }

  // Stats grid
  const gridY = legY + 30;
  const gW = (W - 80) / 2;
  const gH = 50;
  const gridItems = [
    {
      label: 'Total copies',
      value: data.totalCopies.toLocaleString('fr-FR'),
      color: '#64748b',
    },
    { label: 'Doublons', value: `${data.dupeCount}`, color: '#f59e0b' },
    {
      label: 'Total dépensé',
      value: `${Math.abs(data.totalSpent).toLocaleString('fr-FR')} coins`,
      color: '#ef4444',
    },
    {
      label: 'Prochain badge',
      value: data.nextBadge || 'MAX ✓',
      color: '#22c55e',
    },
  ];

  for (let i = 0; i < gridItems.length; i++) {
    const item = gridItems[i]!;
    const col = i % 2;
    const row = Math.floor(i / 2);
    const gx = 30 + col * (gW + 20);
    const gy = gridY + row * (gH + 8);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.beginPath();
    ctx.roundRect(gx, gy, gW, gH, 8);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.font = '12px GoogleSans';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(item.label.toUpperCase(), gx + 12, gy + 18);
    ctx.font = 'bold 18px GoogleSans';
    ctx.fillStyle = item.color;
    let val = item.value;
    while (ctx.measureText(val).width > gW - 24 && val.length > 5)
      val = `${val.slice(0, -2)}…`;
    ctx.fillText(val, gx + 12, gy + 38);
  }

  // Footer
  ctx.textAlign = 'center';
  ctx.font = '12px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillText('Profil Économie · rpbey.fr', W / 2, H - 18);

  return canvas.toBuffer('image/png');
}
