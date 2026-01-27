
import 'dotenv/config';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';

puppeteer.use(StealthPlugin());

async function main() {
  const tweets = process.argv.slice(2);
  console.log(`🚀 Starting Draft Script for ${tweets.length} tweets...`);
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: executablePath(),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--window-size=1920,1080'
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Cookies
    await page.setCookie(
      { name: 'auth_token', value: process.env.AUTH_TOKEN!, domain: '.x.com', path: '/', secure: true, httpOnly: true },
      { name: 'ct0', value: process.env.CT0!, domain: '.x.com', path: '/', secure: true, httpOnly: false }
    );

    console.log('🌍 Navigating to X.com compose...');
    await page.goto('https://x.com/compose/post', { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for Composer
    try {
        await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 20000 });
        console.log('✅ Composer ready.');
    } catch {
        console.error('❌ Composer failed to load.');
        await browser.close();
        process.exit(1);
    }

    // --- Tweet 1 ---
    console.log('✍️  Writing Tweet 1...');
    await page.click('[data-testid="tweetTextarea_0"]');
    await page.type('[data-testid="tweetTextarea_0"]', tweets[0], { delay: 50 }); // Slower typing
    await new Promise(r => setTimeout(r, 1500));

    // --- Subsequent Tweets ---
    for (let i = 1; i < tweets.length; i++) {
        console.log(`➕ Adding Tweet ${i + 1}...`);
        
        const addButton = await page.waitForSelector('[data-testid="addButton"]', { visible: true });
        await addButton?.click();
        
        await new Promise(r => setTimeout(r, 1500)); // Wait for animation
        
        console.log(`✍️  Writing Tweet ${i + 1}...`);
        await page.keyboard.type(tweets[i], { delay: 50 });
        
        await new Promise(r => setTimeout(r, 1500));
    }

    console.log('💾 Initiating Save Sequence...');
    
    // 1. Click Close (X)
    const closeButton = await page.waitForSelector('[aria-label="Close"], [data-testid="app-bar-close"]');
    await closeButton?.click();
    console.log('   -> Closed composer modal');
    
    // 2. Wait for Dialog
    const saveButton = await page.waitForSelector('[data-testid="confirmationSheetConfirm"]', { visible: true, timeout: 5000 });
    console.log('   -> Found Save confirmation button');
    
    // 3. Click Save
    await saveButton?.click();
    console.log('✅ Clicked SAVE.');

    // 4. CRITICAL WAIT - Wait for the network request to finish and UI to update
    console.log('⏳ Waiting 10s for server sync...');
    await new Promise(r => setTimeout(r, 10000));

    // 5. Verify we are back on home or composer closed
    console.log('🔍 Checking final state...');
    // If we are still seeing the dialog, it failed.
    const dialogStillVisible = await page.$('[data-testid="confirmationSheetConfirm"]') !== null;
    if (dialogStillVisible) {
        console.error('❌ Warning: Save dialog still visible!');
    } else {
        console.log('✅ Save dialog disappeared. Draft should be saved.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

main();
