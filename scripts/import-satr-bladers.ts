import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import 'dotenv/config';

const { Pool } = pg;
// Utilisation de l'URL directe pour les scripts hors-conteneur si nécessaire
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:rpb_password@localhost:5432/rpb_dashboard";
const pool = new Pool({ connectionString });

async function run() {
  console.log('🚀 Synchronisation et Liaison des profils SATR...');

  try {
    const jsonPath = join(process.cwd(), 'data', 'satr_blader_profiles.json');
    const content = await readFile(jsonPath, 'utf-8');
    const profiles = JSON.parse(content);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Récupérer les utilisateurs RPB pour le mapping
      const { rows: dbUsers } = await client.query('SELECT id, name, "discordTag" FROM users');
      console.log(`👥 ${dbUsers.length} utilisateurs RPB trouvés pour le mapping.`);

      console.log(`🧹 Nettoyage de la table satr_bladers...`);
      await client.query('DELETE FROM satr_bladers');

      console.log(`💾 Insertion et Liaison de ${profiles.length} bladers...`);
      let linkedCount = 0;

      for (const p of profiles) {
        // Tentative de liaison
        const match = dbUsers.find(u => 
            (u.name && u.name.toLowerCase() === p.name.toLowerCase()) || 
            (u.discordTag && u.discordTag.toLowerCase() === p.name.toLowerCase())
        );

        const linkedUserId = match ? match.id : null;
        if (linkedUserId) linkedCount++;

        await client.query(
          'INSERT INTO satr_bladers (id, name, "totalWins", "totalLosses", "tournamentWins", "tournamentsCount", history, "linkedUserId", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())',
          [
            `blader_${Math.random().toString(36).substr(2, 9)}`,
            p.name,
            p.totalWins,
            p.totalLosses,
            p.tournamentWins || 0,
            p.tournamentsPlayed,
            JSON.stringify(p.history),
            linkedUserId
          ]
        );
      }
      
      await client.query('COMMIT');
      console.log(`✅ Terminé ! ${profiles.length} profils importés, ${linkedCount} liaisons automatiques effectuées.`);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Erreur :', error);
  } finally {
    await pool.end();
  }
}

run();
