import path from 'node:path';
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';

// Helper to get root path (assuming bot/src/lib/canvas-utils.ts)
const getAssetPath = (relative: string) => {
  if (process.cwd().endsWith('bot')) {
    return path.resolve(process.cwd(), '..', relative);
  }
  return path.resolve(process.cwd(), relative);
};

// Register fonts
const fontPath = getAssetPath(
  'public/Google_Sans_Flex/static/GoogleSansFlex_72pt-Bold.ttf',
);
GlobalFonts.registerFromPath(fontPath, 'GoogleSans');

export async function generateWelcomeImage(
  displayName: string,
  avatarUrl: string,
  memberCount: number,
) {
  // Create canvas (standard Discord embed size-ish: 800x400)
  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background path
  const bgPath = getAssetPath('public/banner.png');

  try {
    const background = await loadImage(bgPath);
    ctx.drawImage(background, 0, 0, width, height);
  } catch {
    // Fallback if image fails to load
    ctx.fillStyle = '#dc2626'; // RPB Red
    ctx.fillRect(0, 0, width, height);
  }

  // Add a semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, width, height);

  // Draw Avatar Circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(150, 200, 100, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();

  try {
    const avatar = await loadImage(avatarUrl);
    ctx.drawImage(avatar, 50, 100, 200, 200);
  } catch {
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();

  // Add Avatar Border
  ctx.strokeStyle = '#fbbf24'; // RPB Gold
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(150, 200, 100, 0, Math.PI * 2, true);
  ctx.stroke();

  // Text: Welcome to RPB
  ctx.font = 'bold 48px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('BIENVENUE À LA', 300, 150);

  ctx.font = 'bold 64px GoogleSans';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('RPB !', 300, 210);

  // Username
  ctx.font = '32px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(displayName.toUpperCase(), 300, 270);

  // Member count
  ctx.font = '24px GoogleSans';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(`MEMBRE #${memberCount}`, 300, 310);

  // Return the buffer
  return canvas.toBuffer('image/png');
}

export interface ProfileCardData {
  bladerName: string;
  avatarUrl: string;
  experience: string;
  favoriteType: string;
  wins: number;
  losses: number;
  tournamentWins: number;
  rankingPoints: number;
  joinedAt: string;
}

export async function generateProfileCard(data: ProfileCardData) {
  const width = 1000;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  const bgPath = getAssetPath('public/background-seasson-2.webp');
  try {
    const background = await loadImage(bgPath);
    ctx.drawImage(background, 0, 0, width, height);
  } catch {
    ctx.fillStyle = '#1e1b4b'; // Deep Navy fallback
    ctx.fillRect(0, 0, width, height);
  }

  // Dark overlay with slight gradient
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Main Card Area (Rounded Rect)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.beginPath();
  ctx.roundRect(20, 20, width - 40, height - 40, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(180, 180, 130, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  try {
    const avatar = await loadImage(data.avatarUrl);
    ctx.drawImage(avatar, 50, 50, 260, 260);
  } catch {
    ctx.fillStyle = '#444';
    ctx.fill();
  }
  ctx.restore();

  // Avatar Border (Gold)
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(180, 180, 130, 0, Math.PI * 2, true);
  ctx.stroke();

  // Blader Name
  ctx.font = 'bold 64px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.bladerName.toUpperCase(), 350, 120);

  // Experience Level Badge
  const expColors: Record<string, string> = {
    BEGINNER: '#94a3b8',
    INTERMEDIATE: '#4ade80',
    ADVANCED: '#60a5fa',
    EXPERT: '#f472b6',
    LEGEND: '#fbbf24',
  };
  const expLabels: Record<string, string> = {
    BEGINNER: 'DÉBUTANT',
    INTERMEDIATE: 'INTERMÉDIAIRE',
    ADVANCED: 'AVANCÉ',
    EXPERT: 'EXPERT',
    LEGEND: 'LÉGENDE',
  };

  const expColor = expColors[data.experience] || '#ffffff';
  ctx.fillStyle = expColor;
  ctx.beginPath();
  ctx.roundRect(350, 140, 220, 40, 10);
  ctx.fill();

  ctx.font = 'bold 24px GoogleSans';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.fillText(expLabels[data.experience] || data.experience, 350 + 110, 168);
  ctx.textAlign = 'start';

  // Stats Grid
  const drawStat = (
    label: string,
    value: string | number,
    x: number,
    y: number,
    color = '#fbbf24',
  ) => {
    ctx.font = '20px GoogleSans';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(label, x, y);
    ctx.font = 'bold 42px GoogleSans';
    ctx.fillStyle = color;
    ctx.fillText(value.toString(), x, y + 50);
  };

  drawStat('POINTS', data.rankingPoints, 350, 250);
  drawStat(
    'WIN RATE',
    `${Math.round((data.wins / (data.wins + data.losses || 1)) * 100)}%`,
    550,
    250,
    '#ffffff',
  );
  drawStat('TOURNÉS', data.tournamentWins, 800, 250);

  drawStat('VICTOIRES', data.wins, 350, 350, '#4ade80');
  drawStat('DÉFAITES', data.losses, 550, 350, '#f87171');
  drawStat('TYPE', data.favoriteType || 'N/A', 800, 350, '#60a5fa');

  // Joined Date
  ctx.font = 'italic 20px GoogleSans';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText(`Blader depuis le ${data.joinedAt}`, 350, 450);

  // Logo RPB
  try {
    const logo = await loadImage(getAssetPath('public/logo.png'));
    ctx.drawImage(logo, 850, 30, 100, 100);
  } catch {
    // skip
  }

  return canvas.toBuffer('image/png');
}

export interface ComboCardData {
  name: string;
  blade: string;
  ratchet: string;
  bit: string;
  type: string;
  attack: number;
  defense: number;
  stamina: number;
  weight: string;
  color: number;
}

export async function generateComboCard(data: ComboCardData) {
  const width = 800;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background - using a color related to the type
  const hexColor = `#${data.color.toString(16).padStart(6, '0')}`;

  // Background Image
  const bgPath = getAssetPath('public/background-seasson-2.webp');
  try {
    const background = await loadImage(bgPath);
    ctx.drawImage(background, 0, 0, width, height);
  } catch {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
  }

  // Tinted Overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, width, height);

  // Type accent border
  ctx.strokeStyle = hexColor;
  ctx.lineWidth = 15;
  ctx.strokeRect(0, 0, width, height);

  // Header
  ctx.font = 'bold 50px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(data.name.toUpperCase(), width / 2, 80);

  // Type Badge
  ctx.fillStyle = hexColor;
  ctx.beginPath();
  ctx.roundRect(width / 2 - 100, 100, 200, 40, 20);
  ctx.fill();

  ctx.font = 'bold 24px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.type.toUpperCase(), width / 2, 128);

  // Parts section
  const drawPart = (label: string, value: string, y: number) => {
    ctx.textAlign = 'right';
    ctx.font = '24px GoogleSans';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(label, width / 2 - 20, y);

    ctx.textAlign = 'left';
    ctx.font = 'bold 32px GoogleSans';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(value, width / 2 + 20, y);
  };

  drawPart('BLADE', data.blade, 200);
  drawPart('RATCHET', data.ratchet, 260);
  drawPart('BIT', data.bit, 320);

  // Stats Bar Helper
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

    const barWidth = 400;
    const barHeight = 20;
    const filledWidth = (value / 100) * barWidth;

    // Background bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(250, y - 15, barWidth, barHeight, 10);
    ctx.fill();

    // Filled bar
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(250, y - 15, filledWidth, barHeight, 10);
    ctx.fill();

    // Value
    ctx.font = 'bold 20px GoogleSans';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(value.toString(), 670, y);
  };

  drawProgressBar('ATTAQUE', data.attack, 400, '#ef4444');
  drawProgressBar('DÉFENSE', data.defense, 440, '#3b82f6');
  drawProgressBar('ENDURANCE', data.stamina, 480, '#22c55e');

  // Weight
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${data.weight}g`, width / 2, 370);

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

  // Background
  const bgPath = getAssetPath('public/banner.png');
  try {
    const background = await loadImage(bgPath);
    ctx.drawImage(background, 0, 0, width, height);
  } catch {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, width, height);
  }

  // Overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, width, height);

  // VS text
  ctx.font = 'italic bold 80px GoogleSans';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.textAlign = 'center';
  ctx.fillText('VS', width / 2, height / 2 + 30);

  // Winner Side (Left)
  ctx.save();
  ctx.beginPath();
  ctx.arc(250, 200, 120, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  try {
    const avatar = await loadImage(data.winnerAvatarUrl);
    ctx.drawImage(avatar, 130, 80, 240, 240);
  } catch {
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
  }
  ctx.restore();

  // Winner Ring (Gold)
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(250, 200, 120, 0, Math.PI * 2, true);
  ctx.stroke();

  // Winner Crown/Badge
  ctx.font = '40px GoogleSans';
  ctx.fillText('🏆', 250, 70);

  // Winner Name
  ctx.font = 'bold 32px GoogleSans';
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'center';
  ctx.fillText(data.winnerName.toUpperCase(), 250, 360);

  // Loser Side (Right)
  ctx.save();
  ctx.beginPath();
  ctx.arc(750, 200, 100, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  try {
    const avatar = await loadImage(data.loserAvatarUrl);
    ctx.drawImage(avatar, 650, 100, 200, 200);
  } catch {
    ctx.fillStyle = '#444';
    ctx.fill();
  }
  ctx.restore();

  // Loser Ring (Grey)
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(750, 200, 100, 0, Math.PI * 2, true);
  ctx.stroke();

  // Loser Name
  ctx.font = 'bold 24px GoogleSans';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.fillText(data.loserName.toUpperCase(), 750, 360);

  // Finish Message (Center)
  ctx.font = 'bold 40px GoogleSans';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(
    data.finishMessage.replace(/\*\*/g, '').toUpperCase(),
    width / 2,
    height - 40,
  );

  return canvas.toBuffer('image/png');
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  winRate: string;
  avatarUrl: string;
}

export async function generateLeaderboardCard(entries: LeaderboardEntry[]) {
  const width = 1000;
  const height = 1200; // Taller for the list
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  const bgPath = getAssetPath('public/background-seasson-2.webp');
  try {
    const background = await loadImage(bgPath);
    ctx.drawImage(background, 0, 0, width, height);
  } catch {
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, width, height);
  }

  // Overlay
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Header
  ctx.font = 'bold 60px GoogleSans';
  ctx.fillStyle = '#fbbf24'; // Gold
  ctx.textAlign = 'center';
  ctx.fillText('CLASSEMENT OFFICIEL RPB', width / 2, 80);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 200, 100);
  ctx.lineTo(width / 2 + 200, 100);
  ctx.stroke();

  // Draw List
  const startY = 160;
  const rowHeight = 100;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const y = startY + i * rowHeight;

    // Row Background (Alternating)
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(50, y - 60, width - 100, rowHeight - 10);
    }

    // Rank Badge
    let rankColor = '#94a3b8'; // Slate 400 default
    if (entry.rank === 1) rankColor = '#fbbf24'; // Gold
    if (entry.rank === 2) rankColor = '#e2e8f0'; // Silver
    if (entry.rank === 3) rankColor = '#cd7f32'; // Bronze

    ctx.fillStyle = rankColor;
    ctx.beginPath();
    ctx.arc(100, y - 15, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 32px GoogleSans';
    ctx.fillStyle = entry.rank === 1 ? '#000' : '#000'; // Contrast text
    ctx.textAlign = 'center';
    ctx.fillText(`#${entry.rank}`, 100, y - 5);

    // Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(200, y - 15, 40, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    try {
      const avatar = await loadImage(entry.avatarUrl);
      ctx.drawImage(avatar, 160, y - 55, 80, 80);
    } catch {
      ctx.fillStyle = '#444';
      ctx.fill();
    }
    ctx.restore();

    // Border for Top 3 Avatars
    if (entry.rank <= 3) {
      ctx.strokeStyle = rankColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(200, y - 15, 40, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Name
    ctx.textAlign = 'left';
    ctx.font = 'bold 36px GoogleSans';
    ctx.fillStyle = '#ffffff';
    if (entry.rank === 1) ctx.fillStyle = '#fbbf24';
    ctx.fillText(entry.name.toUpperCase(), 280, y);

    // Stats (Right aligned)
    // Points
    ctx.textAlign = 'right';
    ctx.font = 'bold 40px GoogleSans';
    ctx.fillStyle = rankColor;
    ctx.fillText(`${entry.points}`, 750, y);

    ctx.font = '20px GoogleSans';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('PTS', 750, y + 25);

    // Winrate
    ctx.font = 'bold 28px GoogleSans';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${entry.winRate}%`, 900, y);

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

  return canvas.toBuffer('image/png');
}
