import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import {
  getTournamentsNeedingSync,
  scrapeAndSyncTournament,
} from '../lib/challonge-sync.js';
import prisma from '../lib/prisma.js'; // Import prisma to fetch URL

/**
 * Tâche de synchronisation pré-tournoi
 *
 * S'exécute toutes les heures et synchronise UNIQUEMENT les tournois
 * qui commencent dans les 24 prochaines heures.
 *
 * Utilise le scraping furtif pour contourner Cloudflare.
 */
export class PreTournamentSyncTask extends ScheduledTask {
  public constructor(
    context: ScheduledTask.LoaderContext,
    options: ScheduledTask.Options,
  ) {
    super(context, {
      ...options,
      // Exécuter toutes les heures
      pattern: '0 * * * *',
      timezone: 'Europe/Paris',
    });
  }

  public async run() {
    this.container.logger.info(
      '[Task] Vérification des tournois à synchroniser...',
    );

    try {
      // Récupérer les ID des tournois qui nécessitent un sync (dans les 24h)
      const tournamentIds = await getTournamentsNeedingSync();

      if (tournamentIds.length === 0) {
        this.container.logger.info('[Task] Aucun tournoi à synchroniser');
        return;
      }

      this.container.logger.info(
        `[Task] ${tournamentIds.length} tournoi(s) à synchroniser`,
      );

      for (const challongeId of tournamentIds) {
        // Fetch full tournament object to get URL
        const t = await prisma.tournament.findUnique({
          where: { challongeId },
          select: { challongeUrl: true, challongeId: true },
        });

        // Use URL if available (better for scraping), otherwise ID
        const target = t?.challongeUrl || t?.challongeId || challongeId;

        this.container.logger.info(`[Task] Scraping ${target}...`);

        const result = await scrapeAndSyncTournament(target);

        if (result.success) {
          this.container.logger.info(
            `[Task] Sync ${challongeId}: ${result.participantsCount} participants, ${result.matchesCount} matchs`,
          );
        } else {
          this.container.logger.warn(
            `[Task] Échec sync ${challongeId}: ${result.error}`,
          );
        }

        // Attendre quelques secondes entre chaque scraping
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      this.container.logger.info('[Task] Sync terminé.');
    } catch (error) {
      this.container.logger.error('[Task] Erreur sync pré-tournoi:', error);
    }
  }
}

declare module '@sapphire/plugin-scheduled-tasks' {
  interface ScheduledTasks {
    PreTournamentSync: never;
  }
}
