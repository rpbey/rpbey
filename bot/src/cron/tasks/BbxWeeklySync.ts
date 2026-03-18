import { execSync } from 'node:child_process';

import { logger } from '../../lib/logger.js';
import { resolveRootPath } from '../../lib/paths.js';

export async function bbxWeeklySyncTask() {
  logger.info('[Cron] Synchronisation BBX Weekly...');

  try {
    const output = execSync('pnpm tsx scripts/scrape-bbx-weekly.ts', {
      cwd: resolveRootPath(),
      timeout: 300_000, // 5 min
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    logger.info(
      `[Cron] BBX Weekly sync terminée: ${output.trim().split('\n').pop()}`,
    );
  } catch (error) {
    logger.error('[Cron] Erreur synchronisation BBX Weekly:', error);
  }
}
