import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.argv[2] || 'https://rpbey.fr';
const OUTPUT_DIR = path.resolve('screenshots');

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'rankings', path: '/rankings' },
  { name: 'tournaments', path: '/tournaments' },
  { name: 'rules', path: '/rules' },
  { name: 'tv', path: '/tv' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  for (const viewport of VIEWPORTS) {
    await page.setViewport({ width: viewport.width, height: viewport.height });

    for (const target of PAGES) {
      const url = `${BASE_URL}${target.path}`;
      const filename = `${target.name}-${viewport.name}.png`;
      const filepath = path.join(OUTPUT_DIR, filename);

      console.log(`📸 ${filename} — ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.screenshot({ path: filepath, fullPage: true });
      } catch (err) {
        console.error(`   ❌ Erreur: ${(err as Error).message}`);
      }
    }
  }

  await browser.close();
  console.log(`\n✅ Screenshots sauvegardées dans ${OUTPUT_DIR}`);
}

main();
