import path from 'node:path';

/**
 * Resolve a path relative to the project root.
 * Handles both cases:
 * - Running from /app (Docker) → cwd is /app, data is at /app/data
 * - Running from /app/bot (host dev) → cwd is /app/bot, data is at /app/data
 */
export function resolveRootPath(...segments: string[]): string {
  const cwd = process.cwd();
  const root =
    cwd.endsWith('/bot') || cwd.endsWith('\\bot')
      ? path.resolve(cwd, '..')
      : cwd;
  return path.resolve(root, ...segments);
}

export function resolveDataPath(...segments: string[]): string {
  return resolveRootPath('data', ...segments);
}
