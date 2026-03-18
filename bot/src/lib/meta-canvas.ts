import type { SKRSContext2D } from '@napi-rs/canvas';
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import { resolveRootPath } from './paths.js';
import prisma from './prisma.js';

// --- Types ---
interface MetaSynergy {
  name: string;
  score: number;
}

interface MetaComponent {
  name: string;
  score: number;
  position_change: number | 'NEW';
  synergy: MetaSynergy[];
}

interface MetaCategory {
  category: string;
  components: MetaComponent[];
}

interface MetaPeriod {
  metadata: {
    startDate: string;
    endDate: string;
    eventsScanned: number;
    partsAnalyzed: number;
  };
  categories: MetaCategory[];
}

type CanvasImage = Awaited<ReturnType<typeof loadImage>>;

// --- Constants ---
const CATEGORY_COLORS: Record<string, string> = {
  Blade: '#dc2626',
  Ratchet: '#fbbf24',
  Bit: '#22c55e',
  'Lock Chip': '#60a5fa',
  'Assist Blade': '#a855f7',
};

const _CATEGORY_EMOJIS: Record<string, string> = {
  Blade: '⚔️',
  Ratchet: '⚙️',
  Bit: '🔩',
  'Lock Chip': '🔒',
  'Assist Blade': '🛡️',
};

// --- Font setup ---
const fontPath = resolveRootPath(
  'public/Google_Sans_Flex/static/GoogleSansFlex_72pt-Bold.ttf',
);
try {
  GlobalFonts.registerFromPath(fontPath, 'MetaSans');
} catch {
  // Font already registered from canvas-utils
}

// --- Image helpers ---
async function safeLoadImage(
  urlOrPath: string | null,
): Promise<CanvasImage | null> {
  if (!urlOrPath) return null;
  try {
    let target = urlOrPath;
    if (target.startsWith('/')) {
      target = resolveRootPath(`public${target}`);
    }
    return await loadImage(target);
  } catch {
    return null;
  }
}

// Map bbx-weekly names to DB part names for image lookup
async function getPartImageMap(names: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!names.length) return map;

  try {
    const parts = await prisma.part.findMany({
      where: { imageUrl: { not: null } },
      select: { name: true, imageUrl: true },
    });

    // Build normalized lookup
    const dbMap = new Map<string, string>();
    for (const p of parts) {
      if (p.imageUrl) {
        dbMap.set(p.name.toLowerCase(), p.imageUrl);
        // Also index without parenthetical suffix: "H (Heavy)" -> "heavy"
        const match = p.name.match(/\(([^)]+)\)/);
        if (match) dbMap.set(match[1].toLowerCase(), p.imageUrl);
      }
    }

    for (const name of names) {
      const norm = name.toLowerCase();
      const img =
        dbMap.get(norm) ||
        dbMap.get(norm.replace(/\s+/g, '')) ||
        dbMap.get(`pegasus ${norm}`) || // "Blast" -> "Pegasus Blast"
        null;
      if (img) map.set(name, img);
    }
  } catch {
    // DB unavailable, return empty map
  }

  return map;
}

// --- Drawing helpers ---
function drawRoundedRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBackground(ctx: SKRSContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0f0f1a');
  grad.addColorStop(0.5, '#1a1025');
  grad.addColorStop(1, '#0f0f1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle grid pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.02)';
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, h);
    ctx.stroke();
  }
  for (let i = 0; i < h; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(w, i);
    ctx.stroke();
  }
}

function drawScoreBar(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  score: number,
  maxScore: number,
  color: string,
) {
  // Background
  drawRoundedRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fill();
  // Fill
  const fillW = Math.max(h, (score / maxScore) * w);
  drawRoundedRect(ctx, x, y, fillW, h, h / 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawPartImage(
  ctx: SKRSContext2D,
  img: CanvasImage | null,
  x: number,
  y: number,
  size: number,
  borderColor: string,
) {
  // Circular clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();

  // Background circle
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fill();

  if (img) {
    ctx.clip();
    ctx.drawImage(img, x, y, size, size);
  }
  ctx.restore();

  // Border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.stroke();
}

function drawTrend(
  ctx: SKRSContext2D,
  change: number | 'NEW',
  x: number,
  y: number,
) {
  ctx.font = 'bold 14px MetaSans';
  if (change === 'NEW') {
    ctx.fillStyle = '#22c55e';
    ctx.fillText('NEW', x, y);
  } else if (change > 0) {
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`▲${change}`, x, y);
  } else if (change < 0) {
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`▼${Math.abs(change)}`, x, y);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('—', x, y);
  }
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
  const e = new Date(end).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${s} — ${e}`;
}

// =============================================================
// generateMetaTopCanvas — Overview of all categories
// =============================================================
export async function generateMetaTopCanvas(
  period: MetaPeriod,
  _scrapedAt: string,
  pKey: string,
): Promise<Buffer> {
  const width = 1200;
  const height = 880;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  drawBackground(ctx, width, height);

  // Collect all part names for image lookup
  const allNames: string[] = [];
  for (const cat of period.categories) {
    for (const comp of cat.components.slice(0, 5)) {
      allNames.push(comp.name);
    }
  }
  const imageMap = await getPartImageMap(allNames);
  const images = new Map<string, CanvasImage | null>();
  for (const [name, url] of imageMap) {
    images.set(name, await safeLoadImage(url));
  }

  // Load logo
  const logo = await safeLoadImage('/logo.png');

  // --- Header ---
  if (logo) ctx.drawImage(logo, 40, 25, 60, 60);
  ctx.font = 'bold 38px MetaSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('MÉTA BEYBLADE X', 115, 65);

  const { metadata } = period;
  const dateRange = formatDateRange(metadata.startDate, metadata.endDate);
  const periodLabel = pKey === '2weeks' ? '2 semaines' : '4 semaines';

  ctx.font = '18px MetaSans';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(
    `${dateRange} (${periodLabel}) · ${metadata.eventsScanned} tournois · ${metadata.partsAnalyzed} pièces`,
    115,
    90,
  );

  // Colored accent line under header
  const grad = ctx.createLinearGradient(40, 110, width - 40, 110);
  grad.addColorStop(0, '#dc2626');
  grad.addColorStop(0.25, '#fbbf24');
  grad.addColorStop(0.5, '#22c55e');
  grad.addColorStop(0.75, '#60a5fa');
  grad.addColorStop(1, '#a855f7');
  ctx.fillStyle = grad;
  ctx.fillRect(40, 108, width - 80, 3);

  // --- Categories ---
  const catCount = period.categories.length;
  const colWidth = (width - 80) / catCount;
  const startY = 130;

  for (let ci = 0; ci < catCount; ci++) {
    const cat = period.categories[ci];
    const color = CATEGORY_COLORS[cat.category] || '#888';
    const x = 40 + ci * colWidth;

    // Category header
    ctx.fillStyle = color;
    ctx.fillRect(x, startY, colWidth - 10, 3);

    ctx.font = 'bold 16px MetaSans';
    ctx.fillStyle = color;
    ctx.fillText(cat.category.toUpperCase(), x, startY + 24);

    // Parts list
    const maxScore = cat.components[0]?.score || 100;
    const partsToShow = cat.components.slice(0, 5);

    for (let pi = 0; pi < partsToShow.length; pi++) {
      const comp = partsToShow[pi];
      const py = startY + 45 + pi * 140;

      // Rank medal
      const medalColors = ['#fbbf24', '#c0c0c0', '#cd7f32'];
      ctx.font = 'bold 22px MetaSans';
      ctx.fillStyle = pi < 3 ? medalColors[pi] : 'rgba(255,255,255,0.3)';
      ctx.fillText(`#${pi + 1}`, x, py + 16);

      // Part image
      const img = images.get(comp.name) || null;
      const imgSize = 52;
      drawPartImage(ctx, img, x + 40, py - 8, imgSize, color);

      // Part name
      ctx.font = 'bold 16px MetaSans';
      ctx.fillStyle = '#ffffff';
      const nameMaxW = colWidth - 110;
      const nameText =
        ctx.measureText(comp.name).width > nameMaxW
          ? `${comp.name.slice(0, 12)}…`
          : comp.name;
      ctx.fillText(nameText, x + 100, py + 10);

      // Score
      ctx.font = 'bold 20px MetaSans';
      ctx.fillStyle = color;
      ctx.fillText(`${comp.score}`, x + 100, py + 35);

      ctx.font = '13px MetaSans';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(
        '/100',
        x + 100 + ctx.measureText(`${comp.score}`).width + 3,
        py + 35,
      );

      // Trend
      drawTrend(ctx, comp.position_change, x + 170, py + 35);

      // Score bar
      drawScoreBar(
        ctx,
        x,
        py + 45,
        colWidth - 15,
        6,
        comp.score,
        maxScore,
        color,
      );

      // Top synergies (small text)
      if (comp.synergy?.length) {
        ctx.font = '12px MetaSans';
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        const synText = comp.synergy
          .slice(0, 3)
          .map((s) => s.name)
          .join(' · ');
        ctx.fillText(synText, x, py + 65);
      }
    }
  }

  // Footer
  ctx.font = '14px MetaSans';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.textAlign = 'center';
  ctx.fillText('rpbey.fr/meta · Source: bbxweekly.com', width / 2, height - 20);
  ctx.textAlign = 'left';

  return canvas.toBuffer('image/png');
}

// =============================================================
// generateMetaCategoryCanvas — Detail of a single category
// =============================================================
export async function generateMetaCategoryCanvas(
  cat: MetaCategory,
  period: MetaPeriod,
  _scrapedAt: string,
  pKey: string,
): Promise<Buffer> {
  const partsToShow = cat.components.slice(0, 8);
  const width = 1000;
  const height = 140 + partsToShow.length * 110;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const color = CATEGORY_COLORS[cat.category] || '#888';

  drawBackground(ctx, width, height);

  // Collect names for images
  const allNames = partsToShow.flatMap((c) => [
    c.name,
    ...c.synergy.slice(0, 5).map((s) => s.name),
  ]);
  const imageMap = await getPartImageMap(allNames);
  const images = new Map<string, CanvasImage | null>();
  for (const [name, url] of imageMap) {
    images.set(name, await safeLoadImage(url));
  }

  // Header
  ctx.fillStyle = color;
  ctx.fillRect(40, 30, 5, 35);
  ctx.font = 'bold 32px MetaSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(cat.category.toUpperCase(), 55, 60);

  // Count badge
  ctx.font = 'bold 14px MetaSans';
  const countText = `${cat.components.length} pièces`;
  const countW = ctx.measureText(countText).width + 16;
  drawRoundedRect(
    ctx,
    55 + ctx.measureText(cat.category.toUpperCase()).width + 15,
    40,
    countW,
    24,
    12,
  );
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.2;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.fillText(
    countText,
    55 + ctx.measureText(cat.category.toUpperCase()).width + 23,
    57,
  );

  // Period info
  const dateRange = formatDateRange(
    period.metadata.startDate,
    period.metadata.endDate,
  );
  const periodLabel = pKey === '2weeks' ? '2 semaines' : '4 semaines';
  ctx.font = '16px MetaSans';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'right';
  ctx.fillText(
    `${dateRange} (${periodLabel}) · ${period.metadata.eventsScanned} tournois`,
    width - 40,
    58,
  );
  ctx.textAlign = 'left';

  // Colored line
  ctx.fillStyle = color;
  ctx.fillRect(40, 80, width - 80, 2);

  // Parts
  const maxScore = partsToShow[0]?.score || 100;
  const startY = 100;

  for (let i = 0; i < partsToShow.length; i++) {
    const comp = partsToShow[i];
    const py = startY + i * 110;

    // Alternating row background
    if (i % 2 === 0) {
      drawRoundedRect(ctx, 35, py - 5, width - 70, 100, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fill();
    }

    // Rank
    const medalColors = ['#fbbf24', '#c0c0c0', '#cd7f32'];
    ctx.font = 'bold 24px MetaSans';
    ctx.fillStyle = i < 3 ? medalColors[i] : 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'center';
    ctx.fillText(`${i + 1}`, 65, py + 30);
    ctx.textAlign = 'left';

    // Part image
    const img = images.get(comp.name) || null;
    drawPartImage(ctx, img, 85, py + 2, 55, color);

    // Name + score
    ctx.font = 'bold 20px MetaSans';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(comp.name, 155, py + 25);

    ctx.font = 'bold 28px MetaSans';
    ctx.fillStyle = color;
    ctx.fillText(`${comp.score}`, 155, py + 58);
    ctx.font = '16px MetaSans';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(
      '/100',
      155 + ctx.measureText(`${comp.score}`).width + 4,
      py + 58,
    );

    // Trend
    drawTrend(ctx, comp.position_change, 240, py + 58);

    // Score bar
    drawScoreBar(ctx, 155, py + 68, 150, 5, comp.score, maxScore, color);

    // Synergies on the right
    if (comp.synergy?.length) {
      const synX = 420;
      ctx.font = '12px MetaSans';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillText('SYNERGIES', synX, py + 10);

      const maxSynScore = comp.synergy[0]?.score || 100;
      for (let si = 0; si < Math.min(comp.synergy.length, 4); si++) {
        const syn = comp.synergy[si];
        const sy = py + 18 + si * 20;

        // Synergy image (small)
        const synImg = images.get(syn.name) || null;
        if (synImg) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(synX + 8, sy + 5, 8, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(synImg, synX, sy - 3, 16, 16);
          ctx.restore();
        }

        ctx.font = '13px MetaSans';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(syn.name, synX + 22, sy + 10);

        // Synergy bar
        drawScoreBar(
          ctx,
          synX + 140,
          sy + 4,
          100,
          4,
          syn.score,
          maxSynScore,
          color,
        );

        ctx.font = '12px MetaSans';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(`${syn.score}`, synX + 248, sy + 10);
      }
    }
  }

  // Footer
  ctx.font = '13px MetaSans';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.textAlign = 'center';
  ctx.fillText('rpbey.fr/meta', width / 2, height - 12);

  return canvas.toBuffer('image/png');
}

// =============================================================
// generateMetaComboCanvas — Best combo of the moment
// =============================================================
export async function generateMetaComboCanvas(
  period: MetaPeriod,
  _scrapedAt: string,
  pKey: string,
): Promise<Buffer> {
  const width = 1000;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  drawBackground(ctx, width, height);

  // Get #1 of each category
  const order = ['Lock Chip', 'Blade', 'Assist Blade', 'Ratchet', 'Bit'];
  const tops: { label: string; comp: MetaComponent | null; color: string }[] =
    order.map((name) => {
      const cat = period.categories.find((c) => c.category === name);
      return {
        label: name,
        comp: cat?.components[0] || null,
        color: CATEGORY_COLORS[name] || '#888',
      };
    });

  // Load images
  const partNames = tops.map((t) => t.comp?.name).filter(Boolean) as string[];
  const imageMap = await getPartImageMap(partNames);
  const images = new Map<string, CanvasImage | null>();
  for (const [name, url] of imageMap) {
    images.set(name, await safeLoadImage(url));
  }
  const logo = await safeLoadImage('/logo.png');

  // Header
  if (logo) ctx.drawImage(logo, 40, 20, 50, 50);
  ctx.font = 'bold 36px MetaSans';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('COMBO DU MOMENT', 100, 55);

  const dateRange = formatDateRange(
    period.metadata.startDate,
    period.metadata.endDate,
  );
  const periodLabel = pKey === '2weeks' ? '2 semaines' : '4 semaines';
  ctx.font = '16px MetaSans';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText(
    `${dateRange} (${periodLabel}) · ${period.metadata.eventsScanned} tournois`,
    100,
    78,
  );

  // Gold line
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(40, 95, width - 80, 2);

  // Parts in a row
  const partSize = 110;
  const spacing = (width - 80) / tops.length;
  const partsY = 130;

  for (let i = 0; i < tops.length; i++) {
    const { label, comp, color } = tops[i];
    if (!comp) continue;

    const cx = 40 + i * spacing + spacing / 2;

    // Part image
    const img = images.get(comp.name) || null;
    drawPartImage(ctx, img, cx - partSize / 2, partsY, partSize, color);

    // Category label
    ctx.font = 'bold 11px MetaSans';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label.toUpperCase(), cx, partsY + partSize + 20);

    // Part name
    ctx.font = 'bold 18px MetaSans';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(comp.name, cx, partsY + partSize + 42);

    // Score
    ctx.font = 'bold 24px MetaSans';
    ctx.fillStyle = color;
    ctx.fillText(`${comp.score}`, cx, partsY + partSize + 70);

    // Score bar
    drawScoreBar(
      ctx,
      cx - 50,
      partsY + partSize + 80,
      100,
      5,
      comp.score,
      100,
      color,
    );

    // Top synergy
    if (comp.synergy?.length) {
      ctx.font = '12px MetaSans';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      const synText = comp.synergy
        .slice(0, 2)
        .map((s) => `${s.name} (${s.score})`)
        .join(' · ');
      ctx.fillText(synText, cx, partsY + partSize + 100);
    }
  }
  ctx.textAlign = 'left';

  // Combo string at bottom
  const comboStr = tops.map((t) => t.comp?.name || '?').join(' · ');
  ctx.font = 'bold 20px MetaSans';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.textAlign = 'center';
  ctx.fillText(comboStr, width / 2, height - 40);

  ctx.font = '13px MetaSans';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText('rpbey.fr/meta · Source: bbxweekly.com', width / 2, height - 15);

  return canvas.toBuffer('image/png');
}

// =============================================================
// generateMetaPieceCanvas — Single part detail
// =============================================================
export async function generateMetaPieceCanvas(
  comp: MetaComponent,
  categoryName: string,
  period: MetaPeriod,
  _scrapedAt: string,
  _pKey: string,
): Promise<Buffer> {
  const synCount = Math.min(comp.synergy?.length || 0, 8);
  const width = 800;
  const height = 280 + synCount * 40;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const color = CATEGORY_COLORS[categoryName] || '#888';

  drawBackground(ctx, width, height);

  // Load images
  const allNames = [comp.name, ...comp.synergy.slice(0, 8).map((s) => s.name)];
  const imageMap = await getPartImageMap(allNames);
  const images = new Map<string, CanvasImage | null>();
  for (const [name, url] of imageMap) {
    images.set(name, await safeLoadImage(url));
  }

  // Main part image (big)
  const img = images.get(comp.name) || null;
  const imgSize = 140;
  drawPartImage(ctx, img, 40, 30, imgSize, color);

  // Part name
  ctx.font = 'bold 36px MetaSans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(comp.name, 200, 75);

  // Category badge
  ctx.font = 'bold 14px MetaSans';
  const badgeText = categoryName.toUpperCase();
  const badgeW = ctx.measureText(badgeText).width + 16;
  drawRoundedRect(ctx, 200, 88, badgeW, 24, 12);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.25;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.fillText(badgeText, 208, 105);

  // Score
  ctx.font = 'bold 48px MetaSans';
  ctx.fillStyle = color;
  ctx.fillText(`${comp.score}`, 200, 165);
  ctx.font = '22px MetaSans';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('/100', 200 + ctx.measureText(`${comp.score}`).width + 5, 165);

  // Trend
  drawTrend(ctx, comp.position_change, 330, 165);

  // Score bar (wide)
  drawScoreBar(ctx, 200, 178, 350, 8, comp.score, 100, color);

  // Period info
  const dateRange = formatDateRange(
    period.metadata.startDate,
    period.metadata.endDate,
  );
  ctx.font = '14px MetaSans';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'right';
  ctx.fillText(dateRange, width - 40, 50);
  ctx.fillText(`${period.metadata.eventsScanned} tournois`, width - 40, 70);
  ctx.textAlign = 'left';

  // Synergies
  if (comp.synergy?.length) {
    const synStartY = 220;
    ctx.fillStyle = color;
    ctx.fillRect(40, synStartY, 3, 25);
    ctx.font = 'bold 18px MetaSans';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SYNERGIES (${comp.synergy.length})`, 52, synStartY + 20);

    const maxSynScore = comp.synergy[0]?.score || 100;

    for (let i = 0; i < synCount; i++) {
      const syn = comp.synergy[i];
      const sy = synStartY + 40 + i * 40;

      // Alternating row
      if (i % 2 === 0) {
        drawRoundedRect(ctx, 35, sy - 5, width - 70, 35, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.015)';
        ctx.fill();
      }

      // Rank
      ctx.font = 'bold 14px MetaSans';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText(`${i + 1}`, 50, sy + 18);

      // Synergy image
      const synImg = images.get(syn.name) || null;
      if (synImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(90, sy + 12, 12, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(synImg, 78, sy, 24, 24);
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(90, sy + 12, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Name
      ctx.font = '16px MetaSans';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(syn.name, 115, sy + 18);

      // Bar
      drawScoreBar(ctx, 320, sy + 10, 300, 6, syn.score, maxSynScore, color);

      // Score
      ctx.font = 'bold 16px MetaSans';
      ctx.fillStyle = color;
      ctx.textAlign = 'right';
      ctx.fillText(`${syn.score}`, width - 50, sy + 18);
      ctx.textAlign = 'left';
    }
  }

  // Footer
  ctx.font = '12px MetaSans';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.textAlign = 'center';
  ctx.fillText('rpbey.fr/meta', width / 2, height - 10);

  return canvas.toBuffer('image/png');
}
