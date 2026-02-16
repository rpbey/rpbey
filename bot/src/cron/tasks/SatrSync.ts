import { logger } from '../../lib/logger.js';
import prisma from '../../lib/prisma.js';

const SHEET_ID =
  '2PACX-1vR3SoKvCW1BTnWs4ikQdlMxYDSOlUlEeeb_Qi0RpQoKSZG1dfEVluU3uj5LzLvwhKdRZh9IA4V8qa89';
const CSV_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=0&output=csv`;

export async function satrSyncTask() {
  logger.info('[Cron] Synchronisation SATR...');

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error(`Google Sheets fetch failed: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = csvText.split('\n').map((row) => parseCSVRow(row));

    if (rows.length < 2) {
      logger.warn('[Cron] SATR Sheet is empty');
      return;
    }

    const dataRows = rows.slice(1);
    const rankings = dataRows
      .filter((row) => row.length >= 7 && row[1] && row[0] !== '')
      .map((row) => {
        return {
          rank: parseInt(row[0].replace(/[^0-9]/g, ''), 10) || 0,
          playerName: row[1].trim(),
          score: parseInt(row[2].replace(/[^0-9]/g, ''), 10) || 0,
          wins: parseInt(row[3].replace(/[^0-9]/g, ''), 10) || 0,
          participation: parseInt(row[4].replace(/[^0-9]/g, ''), 10) || 0,
          winRate: row[5].trim(),
          pointsAverage: row[6].trim(),
        };
      })
      .filter((r) => r.rank > 0);

    await prisma.satrRanking.deleteMany();

    await prisma.satrRanking.createMany({
      data: rankings,
    });

    logger.info(`[Cron] SATR synchronisé (${rankings.length} joueurs)`);
  } catch (error) {
    logger.error('[Cron] Erreur synchronisation SATR:', error);
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
