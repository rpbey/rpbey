import { logger } from '../lib/logger.js';
import { bbxWeeklySyncTask } from './tasks/BbxWeeklySync.js';
import { dailyStatsTask } from './tasks/DailyStats.js';
import { liveTournamentSyncTask } from './tasks/LiveTournamentSync.js';
import { mentionsScanTask } from './tasks/MentionsScan.js';
import { preTournamentSyncTask } from './tasks/PreTournamentSync.js';
import { rankingPostTask } from './tasks/RankingPost.js';
import { satrSyncTask } from './tasks/SatrSync.js';
import { sessionCleanupTask } from './tasks/SessionCleanup.js';
import { syncRankingRolesTask } from './tasks/SyncRankingRoles.js';
import { syncSatrRolesTask } from './tasks/SyncSatrRoles.js';
import { tournamentReminderTask } from './tasks/TournamentReminder.js';

/**
 * All schedules use Bun.cron() which interprets cron expressions in UTC.
 * Paris = UTC+1 (winter) / UTC+2 (summer), so:
 *   - 9:00 Paris (winter) = 8:00 UTC → "0 7 * * *" (summer = 7:00 UTC)
 *   - We use approximate UTC offsets; for exact TZ handling, adjust seasonally.
 *   - Using UTC+2 (CEST, majority of the year) as reference.
 */
export function setupCronJobs() {
  logger.info('[Cron] Initializing scheduled tasks (Bun.cron)...');

  // Mentions Scan: Every 6 hours + run once at startup after 30s
  Bun.cron('0 */6 * * *', () => mentionsScanTask());
  setTimeout(() => mentionsScanTask(), 30_000);

  // Ranking Roles Sync: Every 30 minutes
  Bun.cron('*/30 * * * *', async () => {
    await syncRankingRolesTask();
    await syncSatrRolesTask();
  });

  // Daily Stats: 9:00 Paris (CEST) = 7:00 UTC
  Bun.cron('0 7 * * *', () => dailyStatsTask());

  // Live Tournament Sync: Every 5 minutes
  Bun.cron('*/5 * * * *', () => liveTournamentSyncTask());

  // Pre Tournament Sync: Every hour
  Bun.cron('0 * * * *', () => preTournamentSyncTask());

  // SATR Sync: Every hour at minute 15
  Bun.cron('15 * * * *', () => satrSyncTask());

  // Session Cleanup: 3:00 Paris (CEST) = 1:00 UTC
  Bun.cron('0 1 * * *', () => sessionCleanupTask());

  // Tournament Reminder: Every hour
  Bun.cron('0 * * * *', () => tournamentReminderTask());

  // BBX Weekly Meta Sync: Every Friday at 18:00 Paris (CEST) = 16:00 UTC
  Bun.cron('0 16 * * 5', () => bbxWeeklySyncTask());

  // Ranking Post: 10:00 Paris (CEST) = 8:00 UTC + run once at startup after 60s
  Bun.cron('0 8 * * *', () => rankingPostTask());
  setTimeout(() => rankingPostTask(), 60_000);

  logger.info('[Cron] Tasks scheduled (Bun.cron, UTC).');
}
