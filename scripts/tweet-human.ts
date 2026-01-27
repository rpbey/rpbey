
import 'dotenv/config';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';

puppeteer.use(StealthPlugin());

async function main() {
  const tweets = process.argv.slice(2);
  if (tweets.length === 0) {
    console.error('Usage: npx tsx scripts/tweet-human.ts "Tweet 1" ["Tweet 2" ...]');
    process.exit(1);
  }

  console.log(`🚀 Launching browser to post a thread of ${tweets.length} tweets...`);
  
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

    // Set cookies
    console.log('🍪 Injecting cookies...');
    await page.setCookie(
      { name: 'auth_token', value: process.env.AUTH_TOKEN!, domain: '.x.com', path: '/', secure: true, httpOnly: true },
      { name: 'ct0', value: process.env.CT0!, domain: '.x.com', path: '/', secure: true, httpOnly: false }
    );

    console.log('🌍 Navigating to X.com home...');
    await page.goto('https://x.com/home', { waitUntil: 'networkidle2', timeout: 60000 });

    // Check login
    const isLoggedIn = await page.waitForSelector('[data-testid="SideNav_AccountSwitcher_Button"]', { timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    if (!isLoggedIn) {
      console.error('❌ Login failed.');
      await page.screenshot({ path: 'debug-login-fail.png' });
      await browser.close();
      process.exit(1);
    }
    console.log('✅ Logged in.');

    // Go to compose
    console.log('📝 Opening composer...');
    await page.goto('https://x.com/compose/post', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000)); // Wait for animation

    for (let i = 0; i < tweets.length; i++) {
        console.log(`✍️  Typing tweet ${i + 1}/${tweets.length}...`);
        
        // If it's not the first tweet, we need to click the "Add" button first
        if (i > 0) {
            console.log('➕ Adding thread item...');
            const addButton = await page.waitForSelector('[data-testid="addButton"]');
            await addButton?.click();
            await new Promise(r => setTimeout(r, 1000));
        }

        // Select the correct textarea (index matches i)
        // Note: Sometimes X re-indexes or uses active element.
        // It's safer to just type in the "active" one or find the specific one.
        // The textareas usually have data-testid="tweetTextarea_0", "tweetTextarea_1", etc.
        const selector = `[data-testid="tweetTextarea_${i}"]`;
        await page.waitForSelector(selector);
        await page.click(selector);
        
        // Type slowly
        await page.type(selector, tweets[i], { delay: 50 });
        
        // Small pause between tweets
        await new Promise(r => setTimeout(r, 1000));
    }

    // Click Post All
    console.log('🚀 Clicking Post All...');
    const postButtonSelector = '[data-testid="tweetButton"]'; // Usually says "Post all" but selector is same
    await page.waitForSelector(postButtonSelector);
    await page.click(postButtonSelector);

    // Wait for result
    console.log('⏳ Waiting for result...');
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'debug-thread-result.png' });

    console.log('✅ Thread posted (probably). Check debug-thread-result.png');

  } catch (error) {
    console.error('❌ Error:', error);
    await browser.newPage().then(p => p.screenshot({ path: 'debug-error-thread.png' }).catch(() => {}));
  } finally {
    await browser.close();
  }
}

main();
