#!/usr/bin/env bun
// Fast TS→JS via oxc-transform. Preserves decorators as TC39 Stage 3 syntax.
// NOT a drop-in for `build` while @discordx/di relies on `emitDecoratorMetadata` —
// use the swc build for production. Keep this for perf smoke tests and libs without DI.
import { Glob } from 'bun';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { transform } from 'oxc-transform';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'dist');

const glob = new Glob('**/*.{ts,tsx}');
const start = Bun.nanoseconds();

let fileCount = 0;
let errorCount = 0;

for await (const rel of glob.scan({ cwd: SRC })) {
  const srcPath = join(SRC, rel);
  const source = await Bun.file(srcPath).text();
  const result = await transform(srcPath, source, {
    target: 'esnext',
    typescript: { onlyRemoveTypeImports: false },
  });

  if (result.errors.length > 0) {
    errorCount += result.errors.length;
    for (const err of result.errors) {
      console.error(`[${relative(ROOT, srcPath)}] ${err.message}`);
    }
    continue;
  }

  const outPath = join(OUT, rel.replace(/\.tsx?$/, '.js'));
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, result.code);
  fileCount += 1;
}

const ms = Math.round((Bun.nanoseconds() - start) / 1e6);
console.log(`oxc-transform: ${fileCount} files in ${ms}ms (${errorCount} errors)`);
if (errorCount > 0) process.exit(1);
