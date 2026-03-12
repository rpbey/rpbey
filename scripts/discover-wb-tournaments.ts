import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

(puppeteerExtra as any).use(StealthPlugin());

const DEFAULT_COOKIE_PATH = resolve(process.cwd(), 'challonge_cookie.json');

async function run() {
  console.log('🔍 Découverte des tournois Wild Breakers sur Challonge...\n');

  const browser = await (puppeteerExtra as any).launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // Load cookies if available
  try {
    const cookies = JSON.parse(readFileSync(DEFAULT_COOKIE_PATH, 'utf-8'));
    if (Array.isArray(cookies) && cookies.length > 0) {
      await page.setCookie(...cookies);
      console.log('🍪 Cookies Challonge chargés.');
    }
  } catch {
    console.log('⚠️  Pas de fichier challonge_cookie.json trouvé.');
  }

  try {
    const url = 'https://challonge.com/fr/users/wild_breakers/tournaments';
    console.log(`📡 Navigation vers ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for content to load
    await page.waitForSelector('body', { timeout: 10000 });

    // Try to get the page content
    const content = await page.content();

    // Extract tournament links
    const tournaments = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/fr/"]'));
      return links
        .map(a => ({
          text: (a as HTMLAnchorElement).textContent?.trim() || '',
          href: (a as HTMLAnchorElement).href,
        }))
        .filter(l => l.text.length > 0 && !l.href.includes('/users/'));
    });

    if (tournaments.length > 0) {
      console.log(`\n🏆 Tournois trouvés (${tournaments.length}) :\n`);
      for (const t of tournaments) {
        const slug = t.href.split('/').pop() || '';
        console.log(`  - ${t.text}`);
        console.log(`    Slug: ${slug}`);
        console.log(`    URL: ${t.href}\n`);
      }
    } else {
      console.log('\n⚠️  Aucun lien de tournoi trouvé dans la page.');
      console.log('   Tentative d\'extraction du HTML brut...\n');

      // Try to find any tournament data in the page
      const allLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
          .map(a => ({ text: a.textContent?.trim(), href: a.href }))
          .filter(l => l.text && l.text.length > 2);
      });

      console.log('Liens trouvés dans la page :');
      for (const l of allLinks.slice(0, 50)) {
        console.log(`  ${l.text} -> ${l.href}`);
      }

      // Also try to get any JS data
      const pageText = await page.evaluate(() => document.body?.innerText?.slice(0, 3000));
      console.log('\n--- Texte de la page (3000 premiers chars) ---');
      console.log(pageText);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);

    // Save screenshot for debugging
    await page.screenshot({ path: '/tmp/challonge-wb.png', fullPage: true });
    console.log('📸 Screenshot sauvegardé dans /tmp/challonge-wb.png');
  }

  await browser.close();
}

run().catch(console.error);
