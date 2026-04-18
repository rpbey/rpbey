import puppeteer, { type Page } from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs';
import { $ } from 'bun';

const BASE_URL = 'https://rpbey.fr';
const CLIPS_DIR = path.resolve('/tmp/trailer-clips');
const FINAL_OUTPUT = path.resolve('/tmp/rpb-trailer-pro.mp4');
const LOGO_PATH = path.resolve('public/logo.png');
const FONT_PATH = '/usr/share/fonts/opentype/urw-base35/NimbusSans-Bold.otf';
const WIDTH = 1920;
const HEIGHT = 1080;

interface Scene {
  name: string;
  title: string;
  actions: (page: Page) => Promise<void>;
}

async function wait(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function smoothScroll(page: Page, targetY: number, duration = 1000) {
  await page.evaluate(`
    new Promise((resolve) => {
      const start = window.scrollY;
      const distance = ${targetY} - start;
      const dur = ${duration};
      const startTime = performance.now();
      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / dur, 1);
        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        window.scrollTo(0, start + distance * ease);
        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    })
  `);
  await wait(300);
}

async function humanType(page: Page, selector: string, text: string) {
  await page.click(selector);
  await wait(300);
  for (const char of text) {
    await page.keyboard.type(char, { delay: 60 + Math.random() * 80 });
  }
  await wait(500);
}

const scenes: Scene[] = [
  {
    name: 'intro',
    title: '',
    actions: async (page) => {
      // Black intro - just wait briefly (will add title overlay in post)
      await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle2' });
      await wait(500);
      // Quick scroll to show hero
      await smoothScroll(page, 300, 1500);
      await wait(500);
      await smoothScroll(page, 0, 800);
      await wait(1000);
    },
  },
  {
    name: 'rankings-overview',
    title: 'CLASSEMENT',
    actions: async (page) => {
      await page.goto(`${BASE_URL}/rankings`, { waitUntil: 'networkidle2' });
      await wait(2000);
      // Admire the podium
      await wait(1500);
      // Smooth scroll to table
      await smoothScroll(page, 350, 1500);
      await wait(1500);
      // Scroll through table
      await smoothScroll(page, 700, 1200);
      await wait(1000);
      await smoothScroll(page, 1100, 1200);
      await wait(800);
    },
  },
  {
    name: 'rankings-search',
    title: 'RECHERCHE',
    actions: async (page) => {
      await page.goto(`${BASE_URL}/rankings`, { waitUntil: 'networkidle2' });
      await wait(1500);
      // Type search
      try {
        await humanType(page, 'input', 'Yuri');
        await wait(2000);
        // Clear
        await page.click('input', { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await wait(800);
      } catch { /* skip */ }
    },
  },
  {
    name: 'rankings-compare',
    title: 'COMPARATEUR',
    actions: async (page) => {
      await page.goto(`${BASE_URL}/rankings`, { waitUntil: 'networkidle2' });
      await wait(2000);
      await smoothScroll(page, 350, 800);
      await wait(500);

      // Select 2 bladers
      const checkboxes = await page.$$('.MuiCheckbox-root');
      if (checkboxes.length >= 2) {
        await checkboxes[0]?.click();
        await wait(1000);
        await checkboxes[1]?.click();
        await wait(1200);

        // Click compare
        const allButtons = await page.$$('button');
        for (const btn of allButtons) {
          const text = await page.evaluate((el) => el.textContent, btn);
          if (text?.includes('Comparer') || text?.includes('VS')) {
            await btn.click();
            await wait(2000);

            // Scroll dialog
            const dialog = await page.$('.MuiDialogContent-root');
            if (dialog) {
              await page.evaluate((el) => el.scrollTo({ top: 200, behavior: 'smooth' }), dialog);
              await wait(1500);
              await page.evaluate((el) => el.scrollTo({ top: 500, behavior: 'smooth' }), dialog);
              await wait(1500);
              await page.evaluate((el) => el.scrollTo({ top: 800, behavior: 'smooth' }), dialog);
              await wait(1500);
            }

            // Close
            const closeBtn = await page.$('.MuiDialogTitle-root .MuiIconButton-root');
            if (closeBtn) await closeBtn.click();
            await wait(800);
            break;
          }
        }
      }
    },
  },
  {
    name: 'meta-overview',
    title: 'META',
    actions: async (page) => {
      await page.goto(`${BASE_URL}/meta`, { waitUntil: 'networkidle2' });
      await wait(2500);
      // Scroll through
      await smoothScroll(page, 400, 1500);
      await wait(1200);
      await smoothScroll(page, 800, 1200);
      await wait(1000);
    },
  },
  {
    name: 'meta-interact',
    title: 'ANALYSE',
    actions: async (page) => {
      await page.goto(`${BASE_URL}/meta`, { waitUntil: 'networkidle2' });
      await wait(1500);

      // Switch period
      try {
        const toggles = await page.$$('.MuiToggleButton-root');
        if (toggles.length > 0) {
          await toggles[0]?.click(); // 2 weeks
          await wait(1500);
        }
      } catch { /* skip */ }

      // Expand a card
      await smoothScroll(page, 300, 800);
      await wait(500);
      const expandIcons = await page.$$('[data-testid="ExpandMoreIcon"]');
      if (expandIcons.length > 0) {
        const btn = await expandIcons[0]?.evaluateHandle((el) => el.closest('button') || el.parentElement);
        if (btn?.asElement()) {
          await btn.asElement()?.click();
          await wait(2000);
        }
      }

      // Expand another
      if (expandIcons.length > 1) {
        const btn2 = await expandIcons[1]?.evaluateHandle((el) => el.closest('button') || el.parentElement);
        if (btn2?.asElement()) {
          await btn2.asElement()?.click();
          await wait(1500);
        }
      }

      // Scroll to ratchets
      await smoothScroll(page, 1200, 1500);
      await wait(1200);

      // Switch back to 4 weeks
      try {
        const toggles2 = await page.$$('.MuiToggleButton-root');
        if (toggles2.length > 1) {
          await toggles2[1]?.click();
          await wait(1500);
        }
      } catch { /* skip */ }
    },
  },
  {
    name: 'meta-deep',
    title: 'CATÉGORIES',
    actions: async (page) => {
      await page.goto(`${BASE_URL}/meta`, { waitUntil: 'networkidle2' });
      await wait(1500);
      // Scroll through all categories
      await smoothScroll(page, 600, 1200);
      await wait(800);
      await smoothScroll(page, 1400, 1500);
      await wait(800);
      await smoothScroll(page, 2200, 1500);
      await wait(800);
      await smoothScroll(page, 3000, 1500);
      await wait(1000);
      // Back to top
      await smoothScroll(page, 0, 1500);
      await wait(1000);
    },
  },
  {
    name: 'tournaments',
    title: 'TOURNOIS',
    actions: async (page) => {
      await page.goto(`${BASE_URL}/tournaments`, { waitUntil: 'networkidle2' });
      await wait(2500);
      await smoothScroll(page, 400, 1500);
      await wait(1200);
      await smoothScroll(page, 800, 1200);
      await wait(1000);
    },
  },
  {
    name: 'database',
    title: 'BASE DE DONNÉES',
    actions: async (page) => {
      await page.goto(`${BASE_URL}/db`, { waitUntil: 'networkidle2' });
      await wait(2500);
      await smoothScroll(page, 400, 1500);
      await wait(1200);
      await smoothScroll(page, 800, 1000);
      await wait(800);
    },
  },
  {
    name: 'outro',
    title: '',
    actions: async (page) => {
      await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle2' });
      await wait(1000);
      await smoothScroll(page, 500, 2000);
      await wait(500);
      await smoothScroll(page, 0, 1500);
      await wait(1500);
    },
  },
];

async function recordScenes() {
  if (fs.existsSync(CLIPS_DIR)) fs.rmSync(CLIPS_DIR, { recursive: true });
  fs.mkdirSync(CLIPS_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--window-size=${WIDTH},${HEIGHT}`],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });

  for (const scene of scenes) {
    const clipPath = path.join(CLIPS_DIR, `${scene.name}.webm`);
    console.log(`🎬 Recording: ${scene.name} ${scene.title ? `(${scene.title})` : ''}`);

    const recorder = await page.screencast({
      path: clipPath,
      speed: 1,
      quality: 20,
    });

    await scene.actions(page);

    await recorder.stop();
    console.log(`   ✅ ${clipPath}`);
  }

  await browser.close();
}

async function postProcess() {
  console.log('\n🎨 Post-production...');

  const clips = scenes.map((s) => path.join(CLIPS_DIR, `${s.name}.webm`));

  // Step 1: Add title overlays to each clip
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]!;
    const input = clips[i]!;
    const output = path.join(CLIPS_DIR, `${scene.name}-titled.mp4`);

    if (!await Bun.file(input).exists()) {
      console.log(`   ⚠️ Skip missing: ${input}`);
      continue;
    }

    let filter = `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:black,fps=30`;

    if (scene.title) {
      // Title card: fade in text at start
      filter += `,drawtext=fontfile='${FONT_PATH}':text='${scene.title}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2:alpha='if(lt(t,0.3),0,if(lt(t,1),min((t-0.3)/0.7,1),if(lt(t,2.5),1,max(1-(t-2.5)/0.5,0))))'`;
      // Subtitle
      filter += `,drawtext=fontfile='${FONT_PATH}':text='rpbey.fr':fontcolor=white@0.5:fontsize=28:x=(w-text_w)/2:y=(h/2)+60:alpha='if(lt(t,0.5),0,if(lt(t,1.2),min((t-0.5)/0.7,1),if(lt(t,2.5),1,max(1-(t-2.5)/0.5,0))))'`;
    }

    const cmd = `ffmpeg -y -i "${input}" -vf "${filter}" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -an "${output}" 2>&1 | tail -3`;
    console.log(`   🏷️  ${scene.name}${scene.title ? ` [${scene.title}]` : ''}`);
    await $.raw`${cmd}`;
  }

  // Step 2: Create intro (3s black with logo + title)
  const introPath = path.join(CLIPS_DIR, 'title-card.mp4');
  const introFilter = [
    `color=c=black:s=${WIDTH}x${HEIGHT}:d=4,fps=30`,
    `drawtext=fontfile='${FONT_PATH}':text='RÉPUBLIQUE POPULAIRE':fontcolor=white:fontsize=80:x=(w-text_w)/2:y=(h/2)-80:alpha='if(lt(t,0.5),t/0.5,if(lt(t,3),1,max(1-(t-3),0)))'`,
    `drawtext=fontfile='${FONT_PATH}':text='DU BEYBLADE':fontcolor=white:fontsize=80:x=(w-text_w)/2:y=(h/2)+10:alpha='if(lt(t,0.7),max((t-0.2)/0.5,0),if(lt(t,3),1,max(1-(t-3),0)))'`,
    `drawtext=fontfile='${FONT_PATH}':text='— rpbey.fr —':fontcolor=white@0.6:fontsize=32:x=(w-text_w)/2:y=(h/2)+120:alpha='if(lt(t,1),max((t-0.5)/0.5,0),if(lt(t,3),1,max(1-(t-3),0)))'`,
  ].join(',');
  await $.raw`ffmpeg -y -f lavfi -i "${introFilter}" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -t 4 "${introPath}" 2>&1 | tail -3`;
  console.log('   ✅ Title card');

  // Step 3: Create outro (3s)
  const outroPath = path.join(CLIPS_DIR, 'outro-card.mp4');
  const outroFilter = [
    `color=c=black:s=${WIDTH}x${HEIGHT}:d=4,fps=30`,
    `drawtext=fontfile='${FONT_PATH}':text='REJOINS-NOUS':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h/2)-60:alpha='if(lt(t,0.5),t/0.5,if(lt(t,3),1,max(1-(t-3),0)))'`,
    `drawtext=fontfile='${FONT_PATH}':text='rpbey.fr':fontcolor=red@0.9:fontsize=48:x=(w-text_w)/2:y=(h/2)+40:alpha='if(lt(t,0.8),max((t-0.3)/0.5,0),if(lt(t,3),1,max(1-(t-3),0)))'`,
    `drawtext=fontfile='${FONT_PATH}':text='Discord · TikTok · Twitch':fontcolor=white@0.5:fontsize=24:x=(w-text_w)/2:y=(h/2)+120:alpha='if(lt(t,1.2),max((t-0.7)/0.5,0),if(lt(t,3),1,max(1-(t-3),0)))'`,
  ].join(',');
  await $.raw`ffmpeg -y -f lavfi -i "${outroFilter}" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -t 4 "${outroPath}" 2>&1 | tail -3`;
  console.log('   ✅ Outro card');

  // Step 4: Build concat file
  const concatFile = path.join(CLIPS_DIR, 'concat.txt');
  const parts = [introPath];

  for (const scene of scenes) {
    const titled = path.join(CLIPS_DIR, `${scene.name}-titled.mp4`);
    if (await Bun.file(titled).exists()) parts.push(titled);
  }
  parts.push(outroPath);

  await Bun.write(concatFile, parts.map((p) => `file '${p}'`).join('\n'));

  // Step 5: Concat all clips
  const concatOutput = path.join(CLIPS_DIR, 'concat-raw.mp4');
  await $.raw`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "${concatOutput}" 2>&1 | tail -3`;
  console.log('   ✅ Concatenated');

  // Step 6: Add watermark logo + final polish
  const logoExists = await Bun.file(LOGO_PATH).exists();
  let finalFilter: string;

  if (logoExists) {
    finalFilter = `ffmpeg -y -i "${concatOutput}" -i "${LOGO_PATH}" -filter_complex "[1:v]scale=60:60,format=rgba,colorchannelmixer=aa=0.4[logo];[0:v][logo]overlay=W-w-30:H-h-30[out]" -map "[out]" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -an "${FINAL_OUTPUT}"`;
  } else {
    finalFilter = `ffmpeg -y -i "${concatOutput}" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -an "${FINAL_OUTPUT}"`;
  }

  await $.raw`${finalFilter} 2>&1 | tail -3`;

  const stats = fs.statSync(FINAL_OUTPUT);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(1);

  // Get duration
  try {
    const probe = (await $`ffprobe -v error -show_entries format=duration -of csv=p=0 ${FINAL_OUTPUT}`.text()).trim();
    const duration = Math.round(Number.parseFloat(probe));
    console.log(`\n🎬 TRAILER PRO: ${FINAL_OUTPUT}`);
    console.log(`   📐 ${WIDTH}x${HEIGHT} · ${duration}s · ${sizeMB} MB`);
  } catch {
    console.log(`\n🎬 TRAILER PRO: ${FINAL_OUTPUT} (${sizeMB} MB)`);
  }
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  🎬 RPB TRAILER PRO — Production');
  console.log('═══════════════════════════════════════\n');

  await recordScenes();
  await postProcess();
}

main();
