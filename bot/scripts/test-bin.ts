#!/usr/bin/env bun
/**
 * Smoke test for the compiled bot binary.
 *
 * Success criteria (in ~10 seconds, no real Discord connection needed):
 *   1. Binary process starts and does NOT crash during decorator-scanning
 *      (importx loads all @Discord/@Slash files — if emitDecoratorMetadata
 *      was lost by `bun build --compile`, they throw on paramtypes access).
 *   2. Binary emits at least one log line after the decorator scan completes.
 *   3. No fatal stack trace mentioning reflect-metadata / design:paramtypes.
 */
import { resolve } from 'node:path';

const BIN = resolve(import.meta.dirname, '..', 'dist-bin', 'rpb-bot');

if (!(await Bun.file(BIN).exists())) {
  console.error(`[test-bin] Binary not found at ${BIN}. Run 'bun run build:bin' first.`);
  process.exit(1);
}

console.log(`[test-bin] Spawning ${BIN} …`);

const proc = Bun.spawn([BIN], {
  env: {
    ...process.env,
    // Dummy but well-formed values — enough for importx to run the decorator
    // scan without a real Discord handshake.
    DISCORD_TOKEN: 'dummy.fake.token',
    BOT_API_PORT: '43901',
    BOT_API_KEY: 'smoke-test-key',
    NODE_ENV: 'production',
    // Isolated lock file so the smoke test doesn't collide with the live service.
    BOT_LOCK_FILE: '/tmp/rpb-bot-smoke.pid',
  },
  stderr: 'pipe',
  stdout: 'pipe',
});

const FATAL_ERR = /design:paramtypes|reflect-metadata|@discordx\/di.*metadata|UndefinedMetadataError|Cannot find package|Fatal Startup Error|ReferenceError|SyntaxError/i;

const stdoutLines: string[] = [];
const stderrLines: string[] = [];

async function drain(stream: ReadableStream<Uint8Array>, sink: string[]) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split('\n');
    buf = parts.pop() ?? '';
    for (const line of parts) sink.push(line);
  }
}

const drains = Promise.all([
  drain(proc.stdout, stdoutLines),
  drain(proc.stderr, stderrLines),
]);

const timeout = new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), 10_000));
const exited = proc.exited.then((code) => `exit:${code}` as const);

const verdict = await Promise.race([timeout, exited]);

proc.kill('SIGTERM');
await drains.catch(() => null);

const combined = [...stdoutLines, ...stderrLines].join('\n');

if (typeof verdict === 'string' && verdict.startsWith('exit:')) {
  const code = Number(verdict.slice(5));
  if (code !== 0) {
    console.error(`[test-bin] FAIL — binary exited with code ${code} before smoke window elapsed.`);
    console.error('--- stderr ---\n' + stderrLines.slice(-30).join('\n'));
    process.exit(1);
  }
}

if (FATAL_ERR.test(combined)) {
  console.error('[test-bin] FAIL — decorator metadata error detected:');
  for (const line of stderrLines) {
    if (FATAL_ERR.test(line)) console.error('  ' + line);
  }
  process.exit(2);
}

if (stdoutLines.length === 0 && stderrLines.length === 0) {
  console.error('[test-bin] FAIL — no output emitted in 10s (binary likely hung).');
  process.exit(3);
}

console.log(
  `[test-bin] PASS — survived 10s, ${stdoutLines.length} stdout / ${stderrLines.length} stderr lines, no decorator errors.`,
);
