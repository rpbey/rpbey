'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

const SHEET_ID =
  '2PACX-1vR3SoKvCW1BTnWs4ikQdlMxYDSOlUlEeeb_Qi0RpQoKSZG1dfEVluU3uj5LzLvwhKdRZh9IA4V8qa89';
const CSV_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=0&output=csv`;

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

export async function syncSatrRanking() {
  try {
    const response = await fetch(CSV_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error('Fetch failed');

    const csvText = await response.text();
    const rows = csvText.split('\n').map((row) => parseCSVRow(row));

    if (rows.length < 2) return { success: false, error: 'Empty sheet' };

    const rankings = rows
      .slice(1)
      .filter((row) => row.length >= 7 && row[1] && row[0])
      .map((row) => ({
        rank: parseInt((row[0] || '0').replace(/[^0-9]/g, ''), 10) || 0,
        playerName: (row[1] || '').trim(),
        score: parseInt((row[2] || '0').replace(/[^0-9]/g, ''), 10) || 0,
        wins: parseInt((row[3] || '0').replace(/[^0-9]/g, ''), 10) || 0,
        participation: parseInt((row[4] || '0').replace(/[^0-9]/g, ''), 10) || 0,
        winRate: (row[5] || '').trim(),
        pointsAverage: (row[6] || '').trim(),
      }))
      .filter((r) => r.rank > 0);

    // Transaction to ensure atomicity
    await prisma.$transaction([
      prisma.satrRanking.deleteMany(),
      prisma.satrRanking.createMany({ data: rankings }),
    ]);

    revalidatePath('/tournaments/satr');
    return { success: true, count: rankings.length };
  } catch (error) {
    console.error('Sync Error:', error);
    return { success: false, error: String(error) };
  }
}

export async function linkSatrBladers() {
  try {
    const bladers = await prisma.satrBlader.findMany();
    const users = await prisma.user.findMany({
      select: { id: true, name: true, discordTag: true },
    });

    let linkedCount = 0;
    for (const blader of bladers) {
      const match = users.find(
        (u) =>
          (u.name && u.name.toLowerCase() === blader.name.toLowerCase()) ||
          (u.discordTag &&
            u.discordTag.toLowerCase() === blader.name.toLowerCase()),
      );

      if (match && blader.linkedUserId !== match.id) {
        await prisma.satrBlader.update({
          where: { id: blader.id },
          data: { linkedUserId: match.id },
        });
        linkedCount++;
      }
    }

    revalidatePath('/tournaments/satr');
    return { success: true, linkedCount };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
