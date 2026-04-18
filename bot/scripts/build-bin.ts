#!/usr/bin/env bun
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ENTRY = resolve(ROOT, 'src/index.ts');
const OUTFILE = resolve(ROOT, 'dist-bin/rpb-bot');

const start = Bun.nanoseconds();

const result = await Bun.build({
  entrypoints: [ENTRY],
  format: 'esm',
  compile: {
    target: 'bun-linux-x64-modern',
    outfile: OUTFILE,
    // SECURITY: do NOT embed any .env file into the binary.
    // Secrets must be injected at runtime via systemd EnvironmentFile= or
    // Bun.secrets (OS keychain). See MIGRATION.md.
    autoloadDotenv: false,
    autoloadBunfig: false,
  },
  minify: false,             // keep stack traces readable; the bytecode already gives cold-start win
  sourcemap: 'linked',
  bytecode: true,
  // isomorphic-unfetch ships a try/catch that `import("unfetch")` — Bun runs
  // server-side with native fetch, so mark the browser polyfill external.
  external: ['unfetch'],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});

const ms = Math.round((Bun.nanoseconds() - start) / 1e6);

if (!result.success) {
  console.error('[build:bin] Build failed:');
  for (const msg of result.logs) console.error(msg);
  process.exit(1);
}

const size = (await Bun.file(OUTFILE).stat()).size;
console.log(
  `[build:bin] ${OUTFILE} — ${(size / 1024 / 1024).toFixed(1)} MB in ${ms}ms`,
);
