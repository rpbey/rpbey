
import 'dotenv/config';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';

puppeteer.use(StealthPlugin());

async function main() {
  const handle = process.argv[2];
  if (!handle) return;
  console.log(`🚀 Getting details for: ${handle}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: executablePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Set Cookies
    await page.setCookie(
      { name: 'auth_token', value: process.env.AUTH_TOKEN!, domain: '.x.com', path: '/', secure: true, httpOnly: true },
      { name: 'ct0', value: process.env.CT0!, domain: '.x.com', path: '/', secure: true, httpOnly: false }
    );

    await page.goto(`https://x.com/${handle}`, { waitUntil: 'networkidle2', timeout: 60000 });

    const details = await page.evaluate(() => {
      const name = document.querySelector('[data-testid="UserName"]')?.textContent || '';
      const bio = document.querySelector('[data-testid="UserDescription"]')?.textContent || '';
      const location = document.querySelector('[data-testid="UserProfileHeader_Items"] [data-testid="UserLocation"]')?.textContent || '';
      return { name, bio, location };
    });

    console.log(JSON.stringify(details, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

main();
