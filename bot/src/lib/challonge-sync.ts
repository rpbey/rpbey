import { container } from '@sapphire/framework';
import { getChallongeClient } from './challonge.js';
import prisma from './prisma.js';
import { ChallongeScraper } from './scrapers/challonge-scraper.js';

/**
 * Service de synchronisation Challonge
 *
 * Stratégie économe en requêtes API (limite 500/mois):
 * - Import initial: 2 requêtes (tournoi + participants)
 * - Sync temps réel: Activé uniquement 24h avant le tournoi
 * - Cache DB: Utiliser la DB comme source principale
 */

export interface SyncResult {
  success: boolean;
  tournamentId?: string;
  participantsCount?: number;
  matchesCount?: number;
  error?: string;
  apiRequestsUsed: number;
}

/**
 * Scrape un tournoi et synchronise TOUT (participants, matchs, classements)
 * Utilise Puppeteer-Stealth pour contourner Cloudflare.
 */
export async function scrapeAndSyncTournament(
  urlId: string,
  cookiesString?: string,
): Promise<SyncResult> {
  const scraper = new ChallongeScraper();
  let apiRequestsUsed = 0; // Le scraping n'utilise pas de requêtes API quota

  try {
    container.logger.info(
      `[Sync] Démarrage du scraping deep-sync pour: ${urlId}`,
    );
    const result = await scraper.scrape(urlId, cookiesString);

    // 1. Upsert Tournament
    const meta = result.metadata;
    const raw = result.raw.tournament;
    const status = mapChallongeState(meta.state);
    const challongeId = String(meta.id);

    const dbTournament = await prisma.tournament.upsert({
      where: { challongeId },
      update: {
        name: meta.name,
        description: raw.description,
        date: raw.start_at ? new Date(raw.start_at) : new Date(),
        status,
        challongeUrl: meta.url,
        challongeState: meta.state,
      },
      create: {
        challongeId,
        name: meta.name,
        description: raw.description,
        date: raw.start_at ? new Date(raw.start_at) : new Date(),
        status,
        challongeUrl: meta.url,
        challongeState: meta.state,
        maxPlayers: raw.signup_cap || 64,
      },
    });

    // 2. Sync Participants & Mapping
    const challongeIdToUserId = new Map<number, string>();
    let importedParticipants = 0;

    for (const p of result.participants) {
      // Recherche par pseudo exact ou ChallongeUsername
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { equals: p.name, mode: 'insensitive' } },
            { username: { equals: p.name, mode: 'insensitive' } },
            {
              profile: {
                challongeUsername: { equals: p.name, mode: 'insensitive' },
              },
            },
          ],
        },
      });

      // Création stub si manquant
      if (!user) {
        const cleanName = p.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const stubEmail = `${cleanName}@import.bot`;
        user = await prisma.user.upsert({
          where: { email: stubEmail },
          update: { name: p.name },
          create: {
            name: p.name,
            username: `bot_${cleanName}`.substring(0, 30),
            email: stubEmail,
            role: 'user',
            image: '/logo.png',
          },
        });
      }

      if (user) {
        challongeIdToUserId.set(p.id, user.id);
        await prisma.tournamentParticipant.upsert({
          where: {
            tournamentId_userId: {
              tournamentId: dbTournament.id,
              userId: user.id,
            },
          },
          update: {
            challongeParticipantId: String(p.id),
            seed: p.seed,
            finalPlacement: p.finalRank || null,
            checkedIn: true, // Scraped participants are usually checked in or active
          },
          create: {
            tournamentId: dbTournament.id,
            userId: user.id,
            challongeParticipantId: String(p.id),
            seed: p.seed,
            finalPlacement: p.finalRank || null,
            checkedIn: true,
          },
        });
        importedParticipants++;
      }
    }

    // 3. Sync Matches
    let importedMatches = 0;
    for (const m of result.matches) {
      const p1UserId = m.player1Id
        ? challongeIdToUserId.get(m.player1Id)
        : null;
      const p2UserId = m.player2Id
        ? challongeIdToUserId.get(m.player2Id)
        : null;
      const winnerUserId = m.winnerId
        ? challongeIdToUserId.get(m.winnerId)
        : null;

      await prisma.tournamentMatch.upsert({
        where: {
          tournamentId_challongeMatchId: {
            tournamentId: dbTournament.id,
            challongeMatchId: String(m.id),
          },
        },
        update: {
          round: m.round,
          player1Id: p1UserId || null,
          player2Id: p2UserId || null,
          winnerId: winnerUserId || null,
          score: m.scores,
          state: m.state,
          updatedAt: new Date(),
        },
        create: {
          tournamentId: dbTournament.id,
          challongeMatchId: String(m.id),
          round: m.round,
          player1Id: p1UserId || null,
          player2Id: p2UserId || null,
          winnerId: winnerUserId || null,
          score: m.scores,
          state: m.state,
        },
      });
      importedMatches++;
    }

    container.logger.info(
      `[Sync] Deep-Sync réussi pour ${dbTournament.name}: ${importedParticipants} joueurs, ${importedMatches} matchs.`,
    );

    return {
      success: true,
      tournamentId: dbTournament.id,
      participantsCount: importedParticipants,
      matchesCount: importedMatches,
      apiRequestsUsed: 0,
    };
  } catch (error) {
    container.logger.error('[Sync] Erreur Deep-Sync Scraping:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      apiRequestsUsed: 0,
    };
  } finally {
    await scraper.close();
  }
}

/**
 * Pousse un participant local vers Challonge (1 requête API)
 */
export async function pushParticipantToChallonge(
  challongeId: string,
  discordId: string,
  playerName: string,
): Promise<{ success: boolean; participantId?: string; error?: string }> {
  const challonge = getChallongeClient();

  try {
    const result = await challonge.createParticipant(challongeId, {
      name: playerName,
      misc: discordId, // Stocke l'ID Discord pour le mapping
    });

    return {
      success: true,
      participantId: result.data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Vérifie si un tournoi doit être synchronisé en temps réel
 * (24h avant le début)
 */
export async function shouldSyncRealtime(
  tournamentId: string,
): Promise<boolean> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });

  if (!tournament) return false;

  const now = new Date();
  const tournamentDate = new Date(tournament.date);
  const hoursUntilTournament =
    (tournamentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Sync temps réel si le tournoi est dans moins de 24h et pas terminé
  return (
    hoursUntilTournament <= 24 &&
    hoursUntilTournament > -6 &&
    tournament.status !== 'COMPLETE'
  );
}

/**
 * Récupère les tournois qui nécessitent un sync temps réel
 */
export async function getTournamentsNeedingSync(): Promise<string[]> {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

  const tournaments = await prisma.tournament.findMany({
    where: {
      challongeId: { not: null },
      status: { not: 'COMPLETE' },
      date: {
        gte: sixHoursAgo,
        lte: in24Hours,
      },
    },
    select: { challongeId: true },
  });

  return tournaments
    .map((t) => t.challongeId)
    .filter((id): id is string => id !== null);
}

/**
 * Mappe l'état Challonge vers notre enum TournamentStatus
 */
function mapChallongeState(
  state: string,
):
  | 'UPCOMING'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'CHECKIN'
  | 'UNDERWAY'
  | 'COMPLETE'
  | 'CANCELLED' {
  switch (state) {
    case 'pending':
      return 'REGISTRATION_OPEN';
    case 'checking_in':
      return 'CHECKIN';
    case 'underway':
    case 'in_progress':
      return 'UNDERWAY';
    case 'complete':
    case 'ended':
      return 'COMPLETE';
    default:
      return 'UPCOMING';
  }
}

/**
 * Estimation du nombre de requêtes API restantes ce mois
 * (À implémenter avec un compteur en DB si nécessaire)
 */
export function getApiRequestsRemaining(): number {
  // TODO: Implémenter un compteur en DB
  // Pour l'instant, on suppose 500 - estimations
  return 500;
}
