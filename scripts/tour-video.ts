import puppeteer, { type Page } from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const BASE_URL = 'https://rpbey.fr';
const OUTPUT_DIR = path.resolve('/tmp/tour-frames');
const VIDEO_OUTPUT = path.resolve('/tmp/rpb-tour.mp4');
const WIDTH = 1920;
const HEIGHT = 1080;

let frameIndex = 0;

async function screenshot(page: Page, label: string) {
  const file = path.join(OUTPUT_DIR, `frame-${String(frameIndex).padStart(4, '0')}.png`);
  await page.screenshot({ path: file, type: 'png' });
  console.log(`  📸 #${frameIndex} — ${label}`);
  frameIndex++;
}

async function wait(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function scrollTo(page: Page, y: number) {
  await page.evaluate((scrollY) => window.scrollTo({ top: scrollY, behavior: 'smooth' }), y);
  await wait(800);
}

async function clickSafe(page: Page, selector: string, label: string) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.click(selector);
    await wait(1200);
    await screenshot(page, label);
    return true;
  } catch {
    console.log(`  ⚠️  Skip: ${label} (${selector} not found)`);
    return false;
  }
}

async function tourRankings(page: Page) {
  console.log('\n🏆 TOUR: Rankings');

  // Page load
  await page.goto(`${BASE_URL}/rankings`, { waitUntil: 'networkidle2' });
  await wait(2000);
  await screenshot(page, 'Rankings — vue initiale');

  // Scroll to podium
  await scrollTo(page, 0);
  await screenshot(page, 'Rankings — Top 3 podium');

  // Scroll down to table
  await scrollTo(page, 400);
  await screenshot(page, 'Rankings — début du tableau');

  // Click search and type
  try {
    const searchInput = await page.waitForSelector('input', { timeout: 5000 });
    if (searchInput) {
      await searchInput.click();
      await wait(500);
      await screenshot(page, 'Rankings — focus recherche');
      await searchInput.type('Lotteux', { delay: 80 });
      await wait(1500);
      await screenshot(page, 'Rankings — recherche "Lotteux"');
      // Clear search
      await searchInput.click({ clickCount: 3 });
      await searchInput.press('Backspace');
      await wait(1000);
    }
  } catch {
    console.log('  ⚠️  Skip: search');
  }

  // Back to full view
  await page.goto(`${BASE_URL}/rankings`, { waitUntil: 'networkidle2' });
  await wait(2000);

  // Select 2 bladers for comparison
  const checkboxes = await page.$$('.MuiCheckbox-root');
  if (checkboxes.length >= 2) {
    // Click first blader checkbox (skip header if present)
    await checkboxes[0]?.click();
    await wait(800);
    await screenshot(page, 'Rankings — sélection blader 1');

    await checkboxes[1]?.click();
    await wait(800);
    await screenshot(page, 'Rankings — sélection blader 2');

    // Click compare button
    const compareBtn = await page.$('button:not([disabled])');
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text?.includes('Comparer') || text?.includes('VS')) {
        await btn.click();
        await wait(1500);
        await screenshot(page, 'Rankings — dialog comparateur ouvert');

        // Scroll inside dialog
        const dialogContent = await page.$('.MuiDialogContent-root');
        if (dialogContent) {
          await page.evaluate((el) => el.scrollTo({ top: 300, behavior: 'smooth' }), dialogContent);
          await wait(800);
          await screenshot(page, 'Rankings — comparateur détails');

          await page.evaluate((el) => el.scrollTo({ top: 600, behavior: 'smooth' }), dialogContent);
          await wait(800);
          await screenshot(page, 'Rankings — comparateur radar + tableau');

          await page.evaluate((el) => el.scrollTo({ top: 1000, behavior: 'smooth' }), dialogContent);
          await wait(800);
          await screenshot(page, 'Rankings — comparateur résumé');
        }

        // Close dialog
        const closeButtons = await page.$$('.MuiIconButton-root');
        for (const cb of closeButtons) {
          const ariaLabel = await page.evaluate((el) => el.getAttribute('aria-label'), cb);
          if (ariaLabel?.includes('close') || ariaLabel?.includes('Close')) {
            await cb.click();
            break;
          }
        }
        // Try clicking the X in dialog title
        const dialogCloseBtn = await page.$('.MuiDialogTitle-root .MuiIconButton-root');
        if (dialogCloseBtn) {
          await dialogCloseBtn.click();
        }
        await wait(800);
        break;
      }
    }
  }

  // Scroll through the table
  await scrollTo(page, 600);
  await screenshot(page, 'Rankings — milieu tableau');
  await scrollTo(page, 1200);
  await screenshot(page, 'Rankings — bas tableau');

  // Click on a profile link
  const profileLinks = await page.$$('a[href^="/profile/"]');
  if (profileLinks.length > 3) {
    await profileLinks[3]?.click();
    await wait(2500);
    await screenshot(page, 'Rankings — profil blader');
    await scrollTo(page, 400);
    await screenshot(page, 'Rankings — profil blader scroll');
    await page.goBack();
    await wait(2000);
  }

  // Season selector
  const selects = await page.$$('select');
  if (selects.length > 0) {
    await selects[0]?.click();
    await wait(500);
    await screenshot(page, 'Rankings — dropdown saisons');
  }

  await screenshot(page, 'Rankings — fin');
}

async function tourMeta(page: Page) {
  console.log('\n🔬 TOUR: Meta');

  await page.goto(`${BASE_URL}/meta`, { waitUntil: 'networkidle2' });
  await wait(2000);
  await screenshot(page, 'Meta — vue initiale (4 semaines)');

  // Switch to 2 weeks
  await clickSafe(page, '.MuiToggleButton-root:first-child', 'Meta — switch 2 semaines');

  // Scroll through categories
  await scrollTo(page, 300);
  await screenshot(page, 'Meta — catégorie Blade');

  await scrollTo(page, 700);
  await screenshot(page, 'Meta — catégorie Blade suite');

  // Click on expand button on a card
  const expandIcons = await page.$$('[data-testid="ExpandMoreIcon"]');
  if (expandIcons.length > 0) {
    const expandBtn = await expandIcons[0]?.evaluateHandle((el) => el.closest('button') || el.parentElement);
    if (expandBtn) {
      await expandBtn.asElement()?.click();
      await wait(1200);
      await screenshot(page, 'Meta — carte expandée (stats + synergies)');
    }
  }

  // Try clicking another card
  if (expandIcons.length > 1) {
    const expandBtn2 = await expandIcons[1]?.evaluateHandle((el) => el.closest('button') || el.parentElement);
    if (expandBtn2) {
      await expandBtn2.asElement()?.click();
      await wait(1200);
      await screenshot(page, 'Meta — 2e carte expandée');
    }
  }

  // Scroll to ratchets
  await scrollTo(page, 1400);
  await screenshot(page, 'Meta — catégorie Ratchet');

  // Expand a ratchet card
  const ratchetExpands = await page.$$('[data-testid="ExpandMoreIcon"]');
  if (ratchetExpands.length > 4) {
    const btn = await ratchetExpands[4]?.evaluateHandle((el) => el.closest('button') || el.parentElement);
    if (btn) {
      await btn.asElement()?.click();
      await wait(1200);
      await screenshot(page, 'Meta — ratchet expandé');
    }
  }

  // Scroll to bits
  await scrollTo(page, 2200);
  await screenshot(page, 'Meta — catégorie Bit');

  await scrollTo(page, 3000);
  await screenshot(page, 'Meta — catégorie Lock Chip / Assist');

  // Switch back to 4 weeks
  const toggleBtns = await page.$$('.MuiToggleButton-root');
  if (toggleBtns.length > 1) {
    await toggleBtns[1]?.click();
    await wait(1200);
    await scrollTo(page, 0);
    await screenshot(page, 'Meta — retour 4 semaines');
  }

  // Final scroll down
  await scrollTo(page, 1000);
  await screenshot(page, 'Meta — vue 4 semaines scroll');

  await scrollTo(page, 0);
  await screenshot(page, 'Meta — fin');
}

function createVideo() {
  console.log('\n🎬 Création de la vidéo...');

  const fps = 1.5; // 1.5 fps = ~0.67s per frame
  const pngCount = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.png')).length;
  console.log(`  ${pngCount} frames capturées`);

  const cmd = [
    'ffmpeg -y',
    `-framerate ${fps}`,
    `-i "${OUTPUT_DIR}/frame-%04d.png"`,
    '-vf "zoompan=z=\'min(zoom+0.0008,1.04)\':d=25:x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':s=1920x1080,fps=30"',
    '-c:v libx264',
    '-pix_fmt yuv420p',
    '-preset fast',
    '-crf 18',
    `"${VIDEO_OUTPUT}"`,
  ].join(' ');

  execSync(cmd, { stdio: 'inherit' });

  const stats = fs.statSync(VIDEO_OUTPUT);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
  const duration = Math.round(pngCount / fps);
  console.log(`\n✅ Tour vidéo créée: ${VIDEO_OUTPUT} (${sizeMB} MB, ~${duration}s)`);
}

async function main() {
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--window-size=${WIDTH},${HEIGHT}`],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });

  await tourRankings(page);
  await tourMeta(page);

  await browser.close();
  createVideo();
}

main();
