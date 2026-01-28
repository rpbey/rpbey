
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

    // 3. Sync Participants (Simple name-based sync for now)
    console.log('👥 Synchronisation des participants...');
    for (const p of result.participants) {
        // Tenter de trouver un utilisateur existant par nom ou tag
        const userRes = await db.query('SELECT id FROM users WHERE name = $1 OR username = $1', [p.name]);
        const userId = userRes.rows[0]?.id;

        if (userId) {
            await db.query(`
                INSERT INTO tournament_participants (id, "tournamentId", "userId", "challongeParticipantId", seed, "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                ON CONFLICT ("tournamentId", "userId") DO UPDATE SET
                    seed = EXCLUDED.seed,
                    "challongeParticipantId" = EXCLUDED."challongeParticipantId",
                    "updatedAt" = NOW()
            `, [
                `tp-${tournamentId}-${userId}`,
                tournamentId,
                userId,
                String(p.id),
                p.seed
            ]);
        }
    }

    console.log('✨ Synchronisation terminée avec succès.');

  } catch (err) {
    console.error('❌ Erreur :', err);
  } finally {
    await scraper.close();
    await db.end();
  }
}

main();
