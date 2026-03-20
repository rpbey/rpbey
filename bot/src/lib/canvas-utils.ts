import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';

import { resolveRootPath } from './paths.js';

const getAssetPath = (relative: string) => resolveRootPath(relative);

// Register fonts
const fontPath = getAssetPath(
  'public/Google_Sans_Flex/static/GoogleSansFlex_72pt-Bold.ttf',
);
GlobalFonts.registerFromPath(fontPath, 'GoogleSans');

type CanvasImage = Awaited<ReturnType<typeof loadImage>>;

async function safeLoadImage(url: string | null): Promise<CanvasImage | null> {
  if (!url) return null;
  try {
    let imageToLoad = url;
    if (url.startsWith('/')) {
      imageToLoad = getAssetPath(`public${url}`);
    }
    return await loadImage(imageToLoad);
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
  // The black rectangle in template: approx (280, 820) to (3220, 3340)
  const frameX = Math.round(280 * sx);
  const frameY = Math.round(820 * sy);
  const frameW = Math.round((3220 - 280) * sx);
  const frameH = Math.round((3340 - 820) * sy);

  // Fill the black rectangle with parchment color
  ctx.fillStyle = '#e2d1a5';
  ctx.fillRect(frameX, frameY, frameW, frameH);

  // Draw avatar centered and smaller inside the frame (with padding)
  const avatar = await safeLoadImage(avatarUrl);
  if (avatar) {
    const padding = Math.round(frameW * 0.12);
    const avatarSize = Math.min(frameW, frameH) - padding * 2;
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
