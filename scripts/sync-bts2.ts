
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
    console.log(`📡 État Challonge : ${result.metadata.state}`);

    // Map Challonge state to RPB status
    let status = 'REGISTRATION_OPEN';
    if (result.metadata.state === 'complete') status = 'COMPLETE';
    else if (result.metadata.state === 'underway') status = 'UNDERWAY';
    else if (result.metadata.state === 'awaiting_review') status = 'COMPLETE';

    // 2. Upsert Tournament
    const tournamentQuery = `
      INSERT INTO tournaments (
        id, name, description, date, location, format, "challongeUrl", status, standings, stations, "activityLog", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        date = EXCLUDED.date,
        status = EXCLUDED.status,
        standings = EXCLUDED.standings,
        stations = EXCLUDED.stations,
        "activityLog" = EXCLUDED."activityLog",
        "updatedAt" = NOW()
      RETURNING id;
    `;

    const tournamentId = 'cm-bts2-auto-imported';
    const tournamentDate = new Date('2026-02-08T13:00:00Z');
    const tournamentName = 'Bey-Tamashii Séries #2';

    await db.query(tournamentQuery, [
      tournamentId,
      tournamentName,
      "Tournoi qualificatif pour la collaboration LFBX ! Premier des quatre tournois qualificatifs.",
      tournamentDate,
      "Dernier Bar Avant la Fin du Monde, 19 Avenue Victoria, 75001 Paris",
      "3on3 Double Elimination",
      "https://challonge.com/fr/B_TS2",
      status,
      JSON.stringify(result.standings),
      JSON.stringify(result.stations),
      JSON.stringify(result.log),
    ]);

    console.log(`🏆 Tournoi mis à jour: ${tournamentName} (Status: ${status})`);

    // Map: Challonge Participant ID -> RPB User ID
    const challongeIdToUserId = new Map<number, string>();
    const activeParticipantUserIds = new Set<string>();

    // 3. Sync Participants (Simple name-based sync for now)
    console.log('👥 Synchronisation des participants...');
    for (const p of result.participants) {
        const userRes = await db.query('SELECT id FROM users WHERE name = $1 OR username = $1', [p.name]);
        let userId = userRes.rows[0]?.id;

        if (!userId) {
            const cleanName = p.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const stubUsername = `bts2_${cleanName}`.substring(0, 30);
            const stubEmail = `${cleanName}@import.bts2`;

            try {
                const createRes = await db.query(`
                    INSERT INTO users (id, name, username, email, role, image, "createdAt", "updatedAt")
                    VALUES (gen_random_uuid(), $1, $2, $3, 'user', '/logo.png', NOW(), NOW())
                    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                `, [p.name, stubUsername, stubEmail]);
                userId = createRes.rows[0]?.id;
            } catch (e) {
                console.warn(`⚠️ Erreur création stub user pour ${p.name}:`, e);
            }
        }
        
        if (userId) {
            challongeIdToUserId.set(p.id, userId);
            activeParticipantUserIds.add(userId);

            // Mark as checkedIn if tournament is started or complete
            const isCheckedIn = status === 'UNDERWAY' || status === 'COMPLETE' || status === 'ARCHIVED';

            await db.query(`
                INSERT INTO tournament_participants (id, "tournamentId", "userId", "challongeParticipantId", "checkedIn", seed, "finalPlacement", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                ON CONFLICT ("tournamentId", "userId") DO UPDATE SET
                    "checkedIn" = EXCLUDED."checkedIn",
                    seed = EXCLUDED.seed,
                    "challongeParticipantId" = EXCLUDED."challongeParticipantId",
                    "finalPlacement" = EXCLUDED."finalPlacement",
                    "updatedAt" = NOW()
            `, [
                `tp-${tournamentId}-${userId}`,
                tournamentId,
                userId,
                String(p.id),
                isCheckedIn,
                p.seed,
                p.finalRank || null
            ]);
        }
    }

    // --- CLEANUP STALE PARTICIPANTS ---
    console.log('🧹 Nettoyage des participants fantômes...');
    const currentParticipants = await db.query('SELECT "userId", id FROM tournament_participants WHERE "tournamentId" = $1', [tournamentId]);
    let deletedCount = 0;
    for (const row of currentParticipants.rows) {
        if (!activeParticipantUserIds.has(row.userId)) {
            await db.query('DELETE FROM tournament_participants WHERE id = $1', [row.id]);
            deletedCount++;
        }
    }
    if (deletedCount > 0) {
        console.log(`🗑️ ${deletedCount} participants fantômes supprimés.`);
    }

    console.log(`✅ ${challongeIdToUserId.size} participants actifs synchronisés.`);

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
