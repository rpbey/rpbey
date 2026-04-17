/**
 * In-memory cache for static JSON files under `data/`.
 *
 * Files in `data/` are immutable between deploys, so a process-level cache
 * persists until the next systemd restart. `React.cache` deduplicates calls
 * within a single render pass.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cache } from 'react';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const store = new Map<string, unknown>();

async function loadJsonUncached<T = JsonValue>(relPath: string): Promise<T> {
  const key = relPath;
  const hit = store.get(key);
  if (hit !== undefined) return hit as T;

  const filePath = join(process.cwd(), relPath);
  const raw = await readFile(filePath, 'utf-8');
  const parsed = JSON.parse(raw) as T;
  store.set(key, parsed);
  return parsed;
}

export const loadJson = cache(loadJsonUncached) as <T = JsonValue>(
  relPath: string,
) => Promise<T>;

/** Same as `loadJson` but returns `null` on read/parse errors. */
export async function loadJsonSafe<T = JsonValue>(
  relPath: string,
): Promise<T | null> {
  try {
    return await loadJson<T>(relPath);
  } catch {
    return null;
  }
}

/** Test/dev helper to clear the cache (e.g. after a data regen). */
export function clearDataCache(relPath?: string) {
  if (relPath) store.delete(relPath);
  else store.clear();
}
