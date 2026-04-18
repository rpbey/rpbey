
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';

puppeteer.use(StealthPlugin());

async function main() {
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

    console.log('🌍 Navigating to Lotteux followers...');
    await page.goto('https://x.com/kenroys_lotte/followers', { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('⏳ Waiting for followers to load...');
    await new Promise(r => setTimeout(r, 5000));

    // Extract user info
    const users = await page.evaluate(() => {
      const results: any[] = [];
      const userElements = document.querySelectorAll('[data-testid="UserCell"]');
      userElements.forEach(el => {
        const text = el.textContent || '';
        const handle = el.querySelector('a')?.getAttribute('href');
        results.push({ text, handle });
      });
      return results;
    });

    console.log('✅ Found followers:');
    console.log(JSON.stringify(users, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

main();
