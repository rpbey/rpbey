import pg from 'pg';

/**
 * Script pour récupérer les données d'une Google Sheet SATR et les stocker en base de données via PG direct.
 */

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const SHEET_ID = '2PACX-1vR3SoKvCW1BTnWs4ikQdlMxYDSOlUlEeeb_Qi0RpQoKSZG1dfEVluU3uj5LzLvwhKdRZh9IA4V8qa89';
const CSV_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=0&output=csv`;

async function fetchAndSyncSatr() {
  console.log('🚀 Récupération des données SATR via SQL direct...');

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération : ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = csvText.split('\n').map(row => parseCSVRow(row));

    if (rows.length < 2) {
      console.warn('⚠️ La feuille semble vide.');
      return;
    }

    const dataRows = rows.slice(1);
    const rankings = dataRows
      .filter(row => row.length >= 7 && row[1] && row[0] !== '')
      .map(row => {
        return {
          rank: parseInt(row[0].replace(/[^0-9]/g, '')) || 0,
          playerName: row[1].trim(),
          score: parseInt(row[2].replace(/[^0-9]/g, '')) || 0,
          wins: parseInt(row[3].replace(/[^0-9]/g, '')) || 0,
          participation: parseInt(row[4].replace(/[^0-9]/g, '')) || 0,
          winRate: row[5].trim(),
          pointsAverage: row[6].trim(),
        };
      })
      .filter(r => r.rank > 0);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      console.log(`🧹 Nettoyage de la table satr_rankings...`);
      await client.query('DELETE FROM satr_rankings');

      console.log(`💾 Insertion de ${rankings.length} entrées...`);
      for (const r of rankings) {
        await client.query(
          'INSERT INTO satr_rankings (id, rank, "playerName", score, wins, participation, "winRate", "pointsAverage", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())',
          [
            `satr_${r.rank}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            r.rank,
            r.playerName,
            r.score,
            r.wins,
            r.participation,
            r.winRate,
            r.pointsAverage,
          ]
        );
      }
      await client.query('COMMIT');
      console.log(`✅ Synchronisation SATR terminée !`);
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

function parseCSVRow(row: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

fetchAndSyncSatr();
