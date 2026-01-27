
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs/promises';

puppeteer.use(StealthPlugin());

async function debugBlade() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://beybladeplanner.com/blade.php', { waitUntil: 'networkidle2' });
    
    const content = await page.content();
    await fs.writeFile('blade-debug.html', content);
    console.log('Saved blade-debug.html');

  } finally {
    await browser.close();
  }
}

debugBlade();
