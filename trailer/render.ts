import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

const FRAMES_DIR = '/tmp/trailer-frames-key';
const PUBLIC_DIR = path.resolve('/tmp/trailer-public');
const OUTPUT = '/tmp/rpb-trailer-remotion.mp4';

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  🎬 RPB TRAILER — Remotion');
  console.log('═══════════════════════════════════════\n');

  // Copy frames to public dir for staticFile()
  if (fs.existsSync(PUBLIC_DIR)) fs.rmSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  for (const file of fs.readdirSync(FRAMES_DIR)) {
    fs.copyFileSync(path.join(FRAMES_DIR, file), path.join(PUBLIC_DIR, file));
  }

  console.log('📦 Bundling...');
  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, 'src/index.ts'),
    publicDir: PUBLIC_DIR,
    onProgress: (p) => {
      if (Math.round(p * 100) % 25 === 0) process.stdout.write(`  ${Math.round(p * 100)}%`);
    },
  });
  console.log('\n   ✅ Bundle ready');

  console.log('\n🎞️  Selecting composition...');
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'RPBTrailer',
  });
  console.log(`   ${composition.durationInFrames} frames · ${composition.fps}fps · ${Math.round(composition.durationInFrames / composition.fps)}s`);

  console.log('\n🎬 Rendering...');
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: OUTPUT,
    crf: 18,
    imageFormat: 'jpeg',
    jpegQuality: 90,
    onProgress: ({ progress }) => {
      const pct = Math.round(progress * 100);
      if (pct % 10 === 0) process.stdout.write(`  ${pct}%`);
    },
    chromiumOptions: {
      disableWebSecurity: true,
    },
  });

  const stats = fs.statSync(OUTPUT);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
  console.log(`\n\n🎬 DONE: ${OUTPUT}`);
  console.log(`   📐 1920x1080 · ${Math.round(composition.durationInFrames / composition.fps)}s · ${sizeMB} MB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
