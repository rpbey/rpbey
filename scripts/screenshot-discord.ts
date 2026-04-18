import puppeteer from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs';

const BASE_URL = 'https://rpbey.fr';
const CHANNEL_ID = '1465386365272195232';
const DISCORD_TOKEN = process.env.DISCORD_TOKEN!;

const PAGES = [
  { name: 'meta', path: '/meta' },
  { name: 'classement', path: '/rankings' },
];

async function takeScreenshots() {
  const dir = path.resolve('/tmp/screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const files: string[] = [];

  for (const target of PAGES) {
    const url = `${BASE_URL}${target.path}`;
    const filepath = path.join(dir, `${target.name}.png`);

    console.log(`📸 Capture ${target.name} — ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: filepath });
    files.push(filepath);
  }

  await browser.close();
  return files;
}

async function sendToDiscord(files: string[]) {
  const formData = new FormData();

  for (let i = 0; i < files.length; i++) {
    const buffer = fs.readFileSync(files[i]);
    const blob = new Blob([buffer], { type: 'image/png' });
    formData.append(`files[${i}]`, blob, path.basename(files[i]));
  }

  formData.append(
    'payload_json',
    JSON.stringify({
      content: '📊 Screenshots des pages **Meta** et **Classement** de rpbey.fr',
    })
  );

  const res = await fetch(
    `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bot ${DISCORD_TOKEN}` },
      body: formData,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord API error ${res.status}: ${text}`);
  }

  console.log('✅ Screenshots envoyées sur Discord !');
}

async function main() {
  if (!DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN manquant dans .env');
    process.exit(1);
  }

  const files = await takeScreenshots();
  await sendToDiscord(files);
}

main();
