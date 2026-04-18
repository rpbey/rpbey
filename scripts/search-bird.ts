
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';

puppeteer.use(StealthPlugin());

async function main() {
  const query = process.argv[2] || 'near:Lyon "bas"';
  console.log(`🚀 Searching for: ${query}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: executablePath(),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080'
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Set Cookies
    await page.setCookie(
      { name: 'auth_token', value: process.env.AUTH_TOKEN!, domain: '.x.com', path: '/', secure: true, httpOnly: true },
      { name: 'ct0', value: process.env.CT0!, domain: '.x.com', path: '/', secure: true, httpOnly: false }
    );

    console.log('🌍 Navigating to X.com search (Users)...');
    const searchUrl = `https://x.com/search?q=${encodeURIComponent(query)}&f=user`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('⏳ Searching and filtering users...');
    const regex = /v[a-zA-Z0-9]{3}_a[a-zA-Z0-9]{4}_s[a-zA-Z0-9]{2}/i;
    const foundHandles = new Set<string>();

    for (let i = 0; i < 30; i++) {
      const handles = await page.evaluate(() => {
        const results: string[] = [];
        document.querySelectorAll('[data-testid="UserCell"]').forEach(el => {
          const handle = el.querySelector('a[role="link"][href^="/"]')?.getAttribute('href')?.replace('/', '');
          if (handle) results.push(handle);
        });
        return results;
      });

      handles.forEach(h => {
        if (h.length === 14) {
          console.log(`🔍 Inspecting 14-char handle: ${h}`);
        }
        if (regex.test(h)) {
          foundHandles.add(h);
        }
      });

      await page.evaluate(() => window.scrollBy(0, 4000));
      await new Promise(r => setTimeout(r, 800));
    }

    console.log('✅ Found matches:');
    console.log(Array.from(foundHandles));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

main();
