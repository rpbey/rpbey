import puppeteer from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs';
import { $ } from 'bun';

const BASE_URL = process.argv[2] || 'https://rpbey.fr';
const OUTPUT_DIR = path.resolve('/tmp/trailer-screenshots');
const VIDEO_OUTPUT = path.resolve('/tmp/rpb-trailer.mp4');

const PAGES = [
  { name: '01-home', path: '/' },
  { name: '02-rankings', path: '/rankings' },
  { name: '03-meta', path: '/meta' },
  { name: '04-tournaments', path: '/tournaments' },
  { name: '05-db', path: '/db' },
  { name: '06-builder', path: '/builder' },
  { name: '07-tv', path: '/tv' },
  { name: '08-reglement', path: '/reglement' },
  { name: '09-notre-equipe', path: '/notre-equipe' },
  { name: '10-a-propos', path: '/a-propos' },
  { name: '11-privacy', path: '/privacy' },
];

const WIDTH = 1920;
const HEIGHT = 1080;

async function takeScreenshots() {
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--window-size=${WIDTH},${HEIGHT}`],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });

  for (const target of PAGES) {
    const url = `${BASE_URL}${target.path}`;
    const filepath = path.join(OUTPUT_DIR, `${target.name}.png`);

    console.log(`📸 ${target.name} — ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      // Wait for animations to settle
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: filepath, type: 'png' });
    } catch (err) {
      console.error(`   ❌ Erreur: ${(err as Error).message}`);
    }
  }

  await browser.close();
  console.log(`\n✅ ${PAGES.length} screenshots capturées`);
}

async function createTrailer() {
  console.log('\n🎬 Création de la vidéo trailer...');

  // Build ffmpeg filter for smooth transitions between slides
  const slideDuration = 3; // seconds per slide
  const fadeDuration = 0.8; // fade transition duration
  const pngFiles = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.png')).sort();
  const numSlides = pngFiles.length;
  const totalDuration = numSlides * slideDuration;

  // Build input args
  const inputs = pngFiles.map((f) => `-loop 1 -t ${slideDuration} -i "${path.join(OUTPUT_DIR, f)}"`).join(' ');

  // Build xfade filter chain
  let filterParts: string[] = [];
  let lastOutput = '[0]';

  for (let i = 1; i < numSlides; i++) {
    const offset = i * slideDuration - fadeDuration * i;
    const output = i < numSlides - 1 ? `[v${i}]` : '[vout]';
    filterParts.push(
      `${lastOutput}[${i}]xfade=transition=fadeblack:duration=${fadeDuration}:offset=${offset.toFixed(2)}${output}`
    );
    lastOutput = output;
  }

  // If only one slide, just copy
  if (numSlides === 1) {
    filterParts = ['[0]copy[vout]'];
  }

  const filter = filterParts.join(';');

  const cmd = [
    'ffmpeg -y',
    inputs,
    `-filter_complex "${filter}"`,
    '-map "[vout]"',
    '-c:v libx264',
    '-pix_fmt yuv420p',
    '-preset fast',
    '-crf 18',
    '-r 30',
    `"${VIDEO_OUTPUT}"`,
  ].join(' ');

  console.log('Running ffmpeg...');
  await $.raw`${cmd}`;

  const stats = fs.statSync(VIDEO_OUTPUT);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
  console.log(`\n✅ Trailer créé: ${VIDEO_OUTPUT} (${sizeMB} MB)`);
}

async function main() {
  await takeScreenshots();
  await createTrailer();
}

main();
