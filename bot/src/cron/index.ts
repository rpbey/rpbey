import cron from 'node-cron';

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

export function setupCronJobs() {
  logger.info('[Cron] Initializing scheduled tasks...');

  // Mentions Scan: Every 6 hours + run once at startup after 30s
  cron.schedule(
    '0 */6 * * *',
    () => {
      mentionsScanTask();
    },
    { timezone: 'Europe/Paris' },
  );
  setTimeout(() => mentionsScanTask(), 30_000);

  // Ranking Roles Sync: Every 30 minutes
  cron.schedule(
    '*/30 * * * *',
    () => {
      syncRankingRolesTask();
      syncSatrRolesTask();
    },
    {
      timezone: 'Europe/Paris',
    },
  );

  // Daily Stats: 9:00 AM Paris
  cron.schedule(
    '0 9 * * *',
    () => {
      dailyStatsTask();
    },
    {
      timezone: 'Europe/Paris',
    },
  );

  // Live Tournament Sync: Every 5 minutes
  cron.schedule(
    '*/5 * * * *',
    () => {
      liveTournamentSyncTask();
    },
    {
      timezone: 'Europe/Paris',
    },
  );

  // Pre Tournament Sync: Every hour
  cron.schedule(
    '0 * * * *',
    () => {
      preTournamentSyncTask();
    },
    {
      timezone: 'Europe/Paris',
    },
  );

  // SATR Sync: Every hour at minute 15
  cron.schedule(
    '15 * * * *',
    () => {
      satrSyncTask();
    },
    {
      timezone: 'Europe/Paris',
    },
  );

  // Session Cleanup: 3:00 AM Paris
  cron.schedule(
    '0 3 * * *',
    () => {
      sessionCleanupTask();
    },
    {
      timezone: 'Europe/Paris',
    },
  );

  // Tournament Reminder: Every hour
  cron.schedule('0 * * * *', () => {
    tournamentReminderTask();
  }); // System time (usually UTC), matches old behavior if no timezone specified

  // BBX Weekly Meta Sync: Every Friday at 18:00 Paris
  cron.schedule(
    '0 18 * * 5',
    () => {
      bbxWeeklySyncTask();
    },
    {
      timezone: 'Europe/Paris',
    },
  );

  // Ranking Post: Every day at 10:00 AM Paris + run once at startup after 60s
  cron.schedule(
    '0 10 * * *',
    () => {
      rankingPostTask();
    },
    {
      timezone: 'Europe/Paris',
    },
  );
  setTimeout(() => rankingPostTask(), 60_000);

  logger.info('[Cron] Tasks scheduled.');
}
