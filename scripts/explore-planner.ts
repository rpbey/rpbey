
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs/promises';

puppeteer.use(StealthPlugin());

async function explorePlanner() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    console.log('Navigating to https://beybladeplanner.com/ ...');
    await page.goto('https://beybladeplanner.com/', { waitUntil: 'networkidle2' });

    // Wait for the app to load
    await new Promise(r => setTimeout(r, 2000));

    const title = await page.title();
    console.log('Page Title:', title);

    // Dump HTML
    const content = await page.content();
    await fs.writeFile('planner-debug.html', content);
    console.log('Saved HTML to planner-debug.html');

    // Try to find parts containers
    // Often these builders have tabs for Blade, Ratchet, Bit
    
    // Take a screenshot
    await page.screenshot({ path: 'planner-home.png' });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

explorePlanner();
