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

// ─── Gacha Card Generator ───────────────────────────────────────────────────

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
}

const RARITY_THEMES: Record<
  string,
  {
    borderColor: string;
    glowColor: string;
    bgGradient: [string, string];
    accentColor: string;
    label: string;
    stars: number;
  }
> = {
  COMMON: {
    borderColor: '#6b7280',
    glowColor: 'rgba(107,114,128,0.3)',
    bgGradient: ['#1f2937', '#111827'],
    accentColor: '#9ca3af',
    label: 'COMMUNE',
    stars: 1,
  },
  RARE: {
    borderColor: '#3b82f6',
    glowColor: 'rgba(59,130,246,0.4)',
    bgGradient: ['#1e3a5f', '#0c1f3d'],
    accentColor: '#60a5fa',
    label: 'RARE',
    stars: 2,
  },
  EPIC: {
    borderColor: '#8b5cf6',
    glowColor: 'rgba(139,92,246,0.4)',
    bgGradient: ['#2e1065', '#1a0533'],
    accentColor: '#a78bfa',
    label: 'ÉPIQUE',
    stars: 3,
  },
  LEGENDARY: {
    borderColor: '#fbbf24',
    glowColor: 'rgba(251,191,36,0.5)',
    bgGradient: ['#422006', '#1c0a00'],
    accentColor: '#fcd34d',
    label: 'LÉGENDAIRE',
    stars: 4,
  },
  SECRET: {
    borderColor: '#ef4444',
    glowColor: 'rgba(239,68,68,0.6)',
    bgGradient: ['#450a0a', '#1f0000'],
    accentColor: '#f87171',
    label: '✦ SECRÈTE ✦',
    stars: 5,
  },
};

export async function generateGachaCard(data: GachaCardData): Promise<Buffer> {
  const W = 480;
  const H = 720;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const theme = RARITY_THEMES[data.rarity] || RARITY_THEMES.COMMON!;

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, theme.bgGradient[0]);
  bgGrad.addColorStop(1, theme.bgGradient[1]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.02)';
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let x = 0; x < W; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  // Outer glow border
  ctx.shadowColor = theme.glowColor;
  ctx.shadowBlur = 25;
  ctx.strokeStyle = theme.borderColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(10, 10, W - 20, H - 20, 16);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Inner border
  ctx.strokeStyle = `${theme.borderColor}40`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(16, 16, W - 32, H - 32, 12);
  ctx.stroke();

  // Top rarity band
  const bandGrad = ctx.createLinearGradient(20, 20, W - 20, 20);
  bandGrad.addColorStop(0, `${theme.borderColor}CC`);
  bandGrad.addColorStop(0.5, theme.borderColor);
  bandGrad.addColorStop(1, `${theme.borderColor}CC`);
  ctx.fillStyle = bandGrad;
  ctx.beginPath();
  ctx.roundRect(20, 20, W - 40, 36, [10, 10, 0, 0]);
  ctx.fill();

  ctx.font = 'bold 14px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(theme.label, W / 2, 44);

  ctx.font = '12px GoogleSans';
  ctx.fillStyle = theme.accentColor;
  ctx.fillText(
    '★'.repeat(theme.stars) + '☆'.repeat(5 - theme.stars),
    W / 2,
    55,
  );

  // Character image
  const imgY = 68;
  const imgH = 300;
  const imgW = W - 56;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.roundRect(28, imgY, imgW, imgH, 8);
  ctx.fill();

  const charImg = await safeLoadImage(data.imageUrl || null);
  if (charImg) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(28, imgY, imgW, imgH, 8);
    ctx.clip();
    const aspect = charImg.width / charImg.height;
    let dW = imgW,
      dH = imgH,
      dX = 28,
      dY = imgY;
    if (aspect > imgW / imgH) {
      dH = imgW / aspect;
      dY = imgY + (imgH - dH) / 2;
    } else {
      dW = imgH * aspect;
      dX = 28 + (imgW - dW) / 2;
    }
    ctx.drawImage(charImg, dX, dY, dW, dH);
    const vigGrad = ctx.createLinearGradient(0, imgY, 0, imgY + imgH);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(0.7, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(28, imgY, imgW, imgH);
    ctx.restore();
  } else {
    ctx.font = 'bold 80px GoogleSans';
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.textAlign = 'center';
    ctx.fillText('?', W / 2, imgY + imgH / 2 + 30);
  }

  ctx.strokeStyle = `${theme.borderColor}80`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(28, imgY, imgW, imgH, 8);
  ctx.stroke();

  // Name
  const nameY = imgY + imgH + 32;
  ctx.textAlign = 'center';
  ctx.font = 'bold 26px GoogleSans';
  ctx.fillStyle = '#ffffff';
  let dn = data.name;
  while (ctx.measureText(dn).width > W - 60 && dn.length > 10)
    dn = `${dn.substring(0, dn.length - 2)}…`;
  ctx.fillText(dn, W / 2, nameY);

  if (data.nameJp) {
    ctx.font = '14px GoogleSans';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(data.nameJp, W / 2, nameY + 22);
  }

  // Series badge
  const seriesY = nameY + (data.nameJp ? 42 : 26);
  const seriesText = data.series.replace(/_/g, ' ');
  ctx.font = '12px GoogleSans';
  const sW = ctx.measureText(seriesText).width + 20;
  ctx.fillStyle = `${theme.borderColor}30`;
  ctx.beginPath();
  ctx.roundRect(W / 2 - sW / 2, seriesY - 12, sW, 20, 10);
  ctx.fill();
  ctx.fillStyle = theme.accentColor;
  ctx.fillText(seriesText, W / 2, seriesY + 2);

  // Beyblade
  if (data.beyblade) {
    ctx.font = '14px GoogleSans';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`🌀 ${data.beyblade}`, W / 2, seriesY + 28);
  }

  // Description (word-wrapped)
  if (data.description) {
    const descY = seriesY + (data.beyblade ? 50 : 28);
    ctx.font = '11px GoogleSans';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    const words = data.description.split(' ');
    let line = '',
      ly = descY,
      lc = 0;
    for (const word of words) {
      if (lc >= 3) break;
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > W - 80) {
        ctx.fillText(line, W / 2, ly);
        line = word;
        ly += 15;
        lc++;
      } else line = test;
    }
    if (line && lc < 3) ctx.fillText(lc === 2 ? `${line}…` : line, W / 2, ly);
  }

  // Bottom bar
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.roundRect(20, H - 60, W - 40, 40, [0, 0, 10, 10]);
  ctx.fill();
  ctx.font = '13px GoogleSans';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(`💰 ${data.balance.toLocaleString('fr-FR')} 🪙`, 35, H - 35);
  ctx.textAlign = 'right';
  if (data.isWished) {
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('⭐ WISHED', W - 35, H - 35);
  } else if (data.isDuplicate) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('📋 DOUBLON', W - 35, H - 35);
  }

  // Corner decorations (Epic+)
  if (['EPIC', 'LEGENDARY', 'SECRET'].includes(data.rarity)) {
    ctx.strokeStyle = `${theme.borderColor}40`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, 65);
    ctx.lineTo(20, 20);
    ctx.lineTo(65, 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W - 65, 20);
    ctx.lineTo(W - 20, 20);
    ctx.lineTo(W - 20, 65);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(20, H - 65);
    ctx.lineTo(20, H - 20);
    ctx.lineTo(65, H - 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W - 65, H - 20);
    ctx.lineTo(W - 20, H - 20);
    ctx.lineTo(W - 20, H - 65);
    ctx.stroke();
  }

  // Sparkles (Legendary/Secret)
  if (data.rarity === 'LEGENDARY' || data.rarity === 'SECRET') {
    ctx.fillStyle = `${theme.accentColor}60`;
    for (const [sx, sy] of [
      [60, 80],
      [W - 70, 90],
      [80, H - 80],
      [W - 60, H - 90],
      [W / 2 - 50, 65],
      [W / 2 + 50, 65],
    ]) {
      const sz = 4 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(sx!, sy! - sz);
      ctx.lineTo(sx! + sz * 0.3, sy! - sz * 0.3);
      ctx.lineTo(sx! + sz, sy!);
      ctx.lineTo(sx! + sz * 0.3, sy! + sz * 0.3);
      ctx.lineTo(sx!, sy! + sz);
      ctx.lineTo(sx! - sz * 0.3, sy! + sz * 0.3);
      ctx.lineTo(sx! - sz, sy!);
      ctx.lineTo(sx! - sz * 0.3, sy! - sz * 0.3);
      ctx.closePath();
      ctx.fill();
    }
  }

  return canvas.toBuffer('image/png');
}

export async function generateGachaMissCard(
  message: string,
  balance: number,
): Promise<Buffer> {
  const W = 480,
    H = 280;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1a1a2e');
  bg.addColorStop(1, '#16213e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(107,114,128,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(8, 8, W - 16, H - 16, 12);
  ctx.stroke();

  ctx.font = 'bold 32px GoogleSans';
  ctx.fillStyle = '#6b7280';
  ctx.textAlign = 'center';
  ctx.fillText('💨 RATÉ !', W / 2, 80);

  ctx.font = '13px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  const words = message.split(' ');
  let line = '',
    y = 120;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > W - 60) {
      ctx.fillText(line, W / 2, y);
      line = word;
      y += 18;
    } else line = test;
  }
  if (line) ctx.fillText(line, W / 2, y);

  ctx.font = '14px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText(
    `💰 ${balance.toLocaleString('fr-FR')} 🪙 restants`,
    W / 2,
    H - 25,
  );

  return canvas.toBuffer('image/png');
}

// ─── Multi-Pull Canvas ──────────────────────────────────────────────────────

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
  const CARD_W = 160;
  const CARD_H = 220;
  const GAP = 12;
  const PAD = 24;
  const HEADER = 70;
  const FOOTER = 50;
  const W = PAD * 2 + COLS * CARD_W + (COLS - 1) * GAP;
  const H = HEADER + ROWS * CARD_H + (ROWS - 1) * GAP + FOOTER + PAD;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background — dark with radial glow
  ctx.fillStyle = '#080810';
  ctx.fillRect(0, 0, W, H);

  // Radial glow center
  const radGrad = ctx.createRadialGradient(
    W / 2,
    H / 2,
    50,
    W / 2,
    H / 2,
    W * 0.6,
  );
  radGrad.addColorStop(0, 'rgba(139,92,246,0.08)');
  radGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, W, H);

  // Scan lines effect
  ctx.fillStyle = 'rgba(255,255,255,0.008)';
  for (let y = 0; y < H; y += 3) {
    ctx.fillRect(0, y, W, 1);
  }

  // Border
  ctx.strokeStyle = 'rgba(139,92,246,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(6, 6, W - 12, H - 12, 16);
  ctx.stroke();

  // Header
  ctx.font = 'bold 28px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('🎰  MULTI-PULL  ×10', W / 2, 46);

  // Decorative line under header
  const lineGrad = ctx.createLinearGradient(PAD, 58, W - PAD, 58);
  lineGrad.addColorStop(0, 'rgba(139,92,246,0)');
  lineGrad.addColorStop(0.3, 'rgba(139,92,246,0.5)');
  lineGrad.addColorStop(0.5, 'rgba(251,191,36,0.6)');
  lineGrad.addColorStop(0.7, 'rgba(139,92,246,0.5)');
  lineGrad.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD + 40, 58);
  ctx.lineTo(W - PAD - 40, 58);
  ctx.stroke();

  // Draw 10 mini-cards
  for (let i = 0; i < data.slots.length; i++) {
    const slot = data.slots[i]!;
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + col * (CARD_W + GAP);
    const y = HEADER + row * (CARD_H + GAP);

    if (!slot.rarity) {
      // ── MISS card ──
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.beginPath();
      ctx.roundRect(x, y, CARD_W, CARD_H, 10);
      ctx.fill();

      ctx.strokeStyle = 'rgba(107,114,128,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, CARD_W, CARD_H, 10);
      ctx.stroke();

      // X mark
      ctx.font = 'bold 40px GoogleSans';
      ctx.fillStyle = 'rgba(107,114,128,0.15)';
      ctx.textAlign = 'center';
      ctx.fillText('✕', x + CARD_W / 2, y + CARD_H / 2 - 10);

      ctx.font = 'bold 14px GoogleSans';
      ctx.fillStyle = 'rgba(107,114,128,0.4)';
      ctx.fillText('RATÉ', x + CARD_W / 2, y + CARD_H / 2 + 25);

      // Diagonal strikethrough
      ctx.strokeStyle = 'rgba(107,114,128,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 10);
      ctx.lineTo(x + CARD_W - 10, y + CARD_H - 10);
      ctx.stroke();
    } else {
      // ── Card drop ──
      const theme = RARITY_THEMES[slot.rarity] || RARITY_THEMES.COMMON!;

      // Card background gradient
      const cardGrad = ctx.createLinearGradient(x, y, x, y + CARD_H);
      cardGrad.addColorStop(0, theme.bgGradient[0]);
      cardGrad.addColorStop(1, theme.bgGradient[1]);
      ctx.fillStyle = cardGrad;
      ctx.beginPath();
      ctx.roundRect(x, y, CARD_W, CARD_H, 10);
      ctx.fill();

      // Glow border
      ctx.shadowColor = theme.glowColor;
      ctx.shadowBlur =
        slot.rarity === 'SECRET' || slot.rarity === 'LEGENDARY' ? 15 : 8;
      ctx.strokeStyle = theme.borderColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(x, y, CARD_W, CARD_H, 10);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Rarity band
      ctx.fillStyle = `${theme.borderColor}CC`;
      ctx.beginPath();
      ctx.roundRect(x + 4, y + 4, CARD_W - 8, 22, [8, 8, 0, 0]);
      ctx.fill();
      ctx.font = 'bold 10px GoogleSans';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(theme.label, x + CARD_W / 2, y + 18);

      // Stars
      ctx.font = '9px GoogleSans';
      ctx.fillStyle = theme.accentColor;
      ctx.fillText(
        '★'.repeat(theme.stars) + '☆'.repeat(5 - theme.stars),
        x + CARD_W / 2,
        y + 32,
      );

      // Character image
      const imgY = y + 36;
      const imgH = 110;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.roundRect(x + 6, imgY, CARD_W - 12, imgH, 6);
      ctx.fill();

      if (slot.imageUrl) {
        const img = await safeLoadImage(slot.imageUrl);
        if (img) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x + 6, imgY, CARD_W - 12, imgH, 6);
          ctx.clip();
          const aspect = img.width / img.height;
          let dw = CARD_W - 12,
            dh = imgH;
          if (aspect > dw / dh) {
            dh = dw / aspect;
          } else {
            dw = dh * aspect;
          }
          ctx.drawImage(
            img,
            x + 6 + (CARD_W - 12 - dw) / 2,
            imgY + (imgH - dh) / 2,
            dw,
            dh,
          );

          // Vignette
          const vig = ctx.createLinearGradient(0, imgY, 0, imgY + imgH);
          vig.addColorStop(0, 'rgba(0,0,0,0)');
          vig.addColorStop(0.8, 'rgba(0,0,0,0)');
          vig.addColorStop(1, 'rgba(0,0,0,0.6)');
          ctx.fillStyle = vig;
          ctx.fillRect(x + 6, imgY, CARD_W - 12, imgH);
          ctx.restore();
        }
      }

      // Name
      ctx.font = 'bold 13px GoogleSans';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      let name = slot.name || '???';
      if (ctx.measureText(name).width > CARD_W - 16)
        name = `${name.substring(0, 12)}…`;
      ctx.fillText(name, x + CARD_W / 2, y + CARD_H - 36);

      // Duplicate / Wished badge
      if (slot.isWished) {
        ctx.font = '10px GoogleSans';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('⭐ WISHED', x + CARD_W / 2, y + CARD_H - 18);
      } else if (slot.isDuplicate) {
        ctx.font = '10px GoogleSans';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText('DOUBLON', x + CARD_W / 2, y + CARD_H - 18);
      }

      // Bottom accent
      ctx.fillStyle = theme.borderColor;
      ctx.beginPath();
      ctx.roundRect(x + 4, y + CARD_H - 6, CARD_W - 8, 3, [0, 0, 4, 4]);
      ctx.fill();

      // Sparkles for legendary/secret
      if (slot.rarity === 'LEGENDARY' || slot.rarity === 'SECRET') {
        ctx.fillStyle = `${theme.accentColor}50`;
        for (let s = 0; s < 4; s++) {
          const sx = x + 15 + Math.random() * (CARD_W - 30);
          const sy = y + 30 + Math.random() * (CARD_H - 60);
          const sz = 2 + Math.random() * 2;
          ctx.beginPath();
          ctx.moveTo(sx, sy - sz);
          ctx.lineTo(sx + sz * 0.3, sy - sz * 0.3);
          ctx.lineTo(sx + sz, sy);
          ctx.lineTo(sx + sz * 0.3, sy + sz * 0.3);
          ctx.lineTo(sx, sy + sz);
          ctx.lineTo(sx - sz * 0.3, sy + sz * 0.3);
          ctx.lineTo(sx - sz, sy);
          ctx.lineTo(sx - sz * 0.3, sy - sz * 0.3);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }

  // ── Footer bar ──
  const footY = H - FOOTER - 6;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.roundRect(PAD, footY, W - PAD * 2, FOOTER - 4, [0, 0, 10, 10]);
  ctx.fill();

  ctx.font = 'bold 14px GoogleSans';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#22c55e';
  ctx.fillText(`✅ ${data.hitsCount} cartes`, PAD + 16, footY + 22);

  ctx.fillStyle = '#6b7280';
  ctx.fillText(`💨 ${data.missCount} ratés`, PAD + 130, footY + 22);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '13px GoogleSans';
  ctx.fillText(
    `💰 ${data.balance.toLocaleString('fr-FR')} 🪙`,
    W - PAD - 16,
    footY + 22,
  );

  // Savings badge
  ctx.textAlign = 'center';
  ctx.font = '10px GoogleSans';
  ctx.fillStyle = 'rgba(251,191,36,0.5)';
  ctx.fillText('Économie : 50🪙 vs tirages individuels', W / 2, footY + 40);

  return canvas.toBuffer('image/png');
}

// ─── Collection Canvas ──────────────────────────────────────────────────────

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
  EPIC: '#8b5cf6',
  RARE: '#3b82f6',
  COMMON: '#6b7280',
};

export async function generateCollectionCard(
  data: CollectionCardData,
): Promise<Buffer> {
  const COLS = 5;
  const CELL = 90;
  const PAD = 20;
  const HEADER = 160;
  const rows = Math.ceil(data.cards.length / COLS);
  const gridH = rows * (CELL + 10);
  const W = PAD * 2 + COLS * (CELL + 10);
  const H = HEADER + gridH + 60;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0f172a');
  bg.addColorStop(1, '#020617');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Grid pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.015)';
  for (let y = 0; y < H; y += 15) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Border
  ctx.strokeStyle = 'rgba(251,191,36,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(6, 6, W - 12, H - 12, 14);
  ctx.stroke();

  // ── Header ──
  // Avatar
  const avatar = await safeLoadImage(data.avatarUrl);
  const avX = PAD + 30,
    avY = 35,
    avR = 28;
  ctx.save();
  ctx.beginPath();
  ctx.arc(avX, avY, avR, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) ctx.drawImage(avatar, avX - avR, avY - avR, avR * 2, avR * 2);
  else {
    ctx.fillStyle = '#374151';
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(avX, avY, avR, 0, Math.PI * 2);
  ctx.stroke();

  // Username
  ctx.font = 'bold 22px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(data.username, avX + avR + 12, avY + 7);

  // Stats row
  const pct =
    data.totalCards > 0
      ? Math.round((data.cards.length / data.totalCards) * 100)
      : 0;
  ctx.font = '13px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  const statsY = 80;
  ctx.fillText(`🪙 ${data.currency.toLocaleString('fr-FR')}`, PAD, statsY);
  ctx.fillText(`🔥 ${data.streak}j`, PAD + 120, statsY);
  ctx.fillText(
    `🃏 ${data.cards.length}/${data.totalCards} (${pct}%)`,
    PAD + 200,
    statsY,
  );

  // Progress bar
  const barY = statsY + 15;
  const barW = W - PAD * 2;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.roundRect(PAD, barY, barW, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.roundRect(PAD, barY, (barW * pct) / 100, 8, 4);
  ctx.fill();

  // Badges
  if (data.badges.length > 0) {
    ctx.font = '12px GoogleSans';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(data.badges.join('  '), PAD, barY + 25);
  }

  // Section title
  ctx.font = 'bold 14px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('COLLECTION', PAD, HEADER - 10);

  // ── Card grid ──
  for (let i = 0; i < data.cards.length; i++) {
    const card = data.cards[i]!;
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + col * (CELL + 10);
    const y = HEADER + row * (CELL + 10);

    const borderColor = RARITY_BORDER[card.rarity] || '#6b7280';

    // Card background
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.roundRect(x, y, CELL, CELL, 8);
    ctx.fill();

    // Card image
    const img = await safeLoadImage(card.imageUrl);
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, CELL - 4, CELL - 20, 6);
      ctx.clip();
      const imgAspect = img.width / img.height;
      let dw = CELL - 4,
        dh = CELL - 20;
      if (imgAspect > 1) {
        dh = dw / imgAspect;
      } else {
        dw = dh * imgAspect;
      }
      ctx.drawImage(img, x + 2 + (CELL - 4 - dw) / 2, y + 2, dw, dh);
      ctx.restore();
    }

    // Rarity border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, CELL, CELL, 8);
    ctx.stroke();

    // Name
    ctx.font = '9px GoogleSans';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    let name = card.name.split(' ')[0] || card.name;
    if (ctx.measureText(name).width > CELL - 6)
      name = `${name.substring(0, 7)}…`;
    ctx.fillText(name, x + CELL / 2, y + CELL - 5);

    // Count badge if >1
    if (card.count > 1) {
      ctx.fillStyle = borderColor;
      ctx.beginPath();
      ctx.arc(x + CELL - 8, y + 8, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 9px GoogleSans';
      ctx.fillStyle = '#fff';
      ctx.fillText(`x${card.count}`, x + CELL - 8, y + 11);
    }
    ctx.textAlign = 'left';
  }

  // ── Footer ──
  ctx.font = '11px GoogleSans';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.textAlign = 'center';
  ctx.fillText('RPB Gacha · /gacha collection', W / 2, H - 15);

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
