/* global console, process */
import { chromium } from 'playwright';

(async () => {
  try {
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://example.com');
    console.log('Title:', await page.title());
    await browser.close();
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
