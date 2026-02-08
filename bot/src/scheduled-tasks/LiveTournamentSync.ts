import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import {
  getUnderwayTournaments,
  scrapeAndSyncTournament,
} from '../lib/challonge-sync.js';

/**
 * Tâche de synchronisation live des tournois en cours
 *
 * S'exécute toutes les 5 minutes et synchronise UNIQUEMENT les tournois
 * dont le status est UNDERWAY (en cours).
 *
 * Récupère standings, stations et log d'activité en temps réel.
 */
export class LiveTournamentSyncTask extends ScheduledTask {
  public constructor(
    context: ScheduledTask.LoaderContext,
    options: ScheduledTask.Options,
  ) {
    super(context, {
      ...options,
      pattern: '*/5 * * * *',
      timezone: 'Europe/Paris',
    });
  }

  public async run() {
    this.container.logger.info(
      '[LiveSync] Vérification des tournois en cours...',
    );

    try {
      const tournaments = await getUnderwayTournaments();

      if (tournaments.length === 0) {
        this.container.logger.info('[LiveSync] Aucun tournoi en cours');
        return;
      }

      this.container.logger.info(
        `[LiveSync] ${tournaments.length} tournoi(s) en cours à synchroniser`,
      );

      for (const t of tournaments) {
        const target = t.challongeUrl || t.challongeId;
        if (!target) continue;

        this.container.logger.info(`[LiveSync] Scraping ${target}...`);

        const result = await scrapeAndSyncTournament(target);

        if (result.success) {
          this.container.logger.info(
            `[LiveSync] Sync ${t.challongeId}: ${result.participantsCount} participants, ${result.matchesCount} matchs, ${result.standingsCount} standings, ${result.stationsCount} stations, ${result.logEntriesCount} log`,
          );
        } else {
          this.container.logger.warn(
            `[LiveSync] Échec sync ${t.challongeId}: ${result.error}`,
          );
        }

        // Attendre entre chaque scraping pour ne pas surcharger
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      this.container.logger.info('[LiveSync] Sync live terminé.');
    } catch (error) {
      this.container.logger.error(
        '[LiveSync] Erreur sync live:',
        error,
      );
    }
  }
}

declare module '@sapphire/plugin-scheduled-tasks' {
  interface ScheduledTasks {
    LiveTournamentSync: never;
  }
}
