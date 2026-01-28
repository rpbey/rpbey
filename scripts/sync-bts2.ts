
import 'dotenv/config';
import { ChallongeScraper } from '../src/lib/scrapers/challonge-scraper';
import pg from 'pg';

async function main() {
  const scraper = new ChallongeScraper();
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });

  try {
    await db.connect();
    console.log('🔌 Connecté à la base de données.');

    // 1. Scrape B_TS2
    console.log('🕵️ Démarrage du scraping pour B_TS2...');
    const result = await scraper.scrape('fr/B_TS2');
    console.log(`✅ Données récupérées : ${result.metadata.name} (${result.participants.length} participants)`);

    // 2. Upsert Tournament
    const tournamentQuery = `
      INSERT INTO tournaments (
        id, name, description, date, location, format, "challongeUrl", status, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        date = EXCLUDED.date,
        status = EXCLUDED.status,
        "updatedAt" = NOW()
      RETURNING id;
    `;

    // Generate a clean CUID-like ID or use the name-based one if preferred.
    // For BTS2 let's use a consistent ID.
    const tournamentId = 'cm-bts2-auto-imported'; 
    const tournamentDate = new Date('2026-02-08T13:00:00Z');

    await db.query(tournamentQuery, [
      tournamentId,
      result.metadata.name,
      "Tournoi qualificatif pour la collaboration LFBX ! Premier des quatre tournois qualificatifs.",
      tournamentDate,
      "Dernier Bar Avant la Fin du Monde, 19 Avenue Victoria, 75001 Paris",
      "3on3 Double Elimination",
      "https://challonge.com/fr/B_TS2",
      "REGISTRATION_OPEN"
    ]);

    console.log('🏆 Tournoi créé/mis à jour dans la DB.');

    // Map: Challonge Participant ID -> RPB User ID
    const challongeIdToUserId = new Map<number, string>();

    // 3. Sync Participants (Simple name-based sync for now)
    console.log('👥 Synchronisation des participants...');
    for (const p of result.participants) {
        // Tenter de trouver un utilisateur existant par nom ou tag
        // On cherche aussi par "profile.challongeUsername" si possible, mais ici c'est du SQL brut/pg
        // Simplification : Nom exact ou username
        const userRes = await db.query('SELECT id FROM users WHERE name = $1 OR username = $1', [p.name]);
        let userId = userRes.rows[0]?.id;

        // SI l'utilisateur n'existe pas, on pourrait le créer en "invité" ?
        // Pour l'instant on ne sync que ceux qui existent
        
        if (userId) {
            challongeIdToUserId.set(p.id, userId);

            await db.query(`
                INSERT INTO tournament_participants (id, "tournamentId", "userId", "challongeParticipantId", seed, "finalPlacement", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                ON CONFLICT ("tournamentId", "userId") DO UPDATE SET
                    seed = EXCLUDED.seed,
                    "challongeParticipantId" = EXCLUDED."challongeParticipantId",
                    "finalPlacement" = EXCLUDED."finalPlacement",
                    "updatedAt" = NOW()
            `, [
                `tp-${tournamentId}-${userId}`,
                tournamentId,
                userId,
                String(p.id),
                p.seed,
                p.finalRank || null
            ]);
        }
    }

    console.log(`✅ ${challongeIdToUserId.size} participants liés à des comptes RPB.`);

    // 4. Sync Matches
    console.log(`⚔️ Synchronisation des ${result.matches.length} matchs...`);
    let matchesImported = 0;

    for (const m of result.matches) {
        // On ne sync que si au moins un des joueurs est connu (ou on stocke tout ?)
        // Mieux vaut stocker tout pour l'arbre complet, même si les users sont null
        
        const p1UserId = m.player1Id ? challongeIdToUserId.get(m.player1Id) : null;
        const p2UserId = m.player2Id ? challongeIdToUserId.get(m.player2Id) : null;
        const winnerUserId = m.winnerId ? challongeIdToUserId.get(m.winnerId) : null;

        await db.query(`
            INSERT INTO tournament_matches (
                id, "tournamentId", "challongeMatchId", round, "player1Id", "player2Id", "winnerId", score, state, "createdAt", "updatedAt"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
            )
            ON CONFLICT ("tournamentId", "challongeMatchId") DO UPDATE SET
                "player1Id" = EXCLUDED."player1Id",
                "player2Id" = EXCLUDED."player2Id",
                "winnerId" = EXCLUDED."winnerId",
                score = EXCLUDED.score,
                state = EXCLUDED.state,
                "updatedAt" = NOW()
        `, [
            `tm-${tournamentId}-${m.id}`,
            tournamentId,
            String(m.id),
            m.round,
            p1UserId || null,
            p2UserId || null,
            winnerUserId || null,
            m.scores,
            m.state
        ]);
        matchesImported++;
    }

    console.log(`✅ ${matchesImported} matchs synchronisés.`);
    console.log('✨ Synchronisation terminée avec succès.');

  } catch (err) {
    console.error('❌ Erreur :', err);
  } finally {
    await scraper.close();
    await db.end();
  }
}

main();
