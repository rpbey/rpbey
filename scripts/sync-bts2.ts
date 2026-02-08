import 'dotenv/config';
import { ChallongeScraper } from '../src/lib/scrapers/challonge-scraper';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const LOCK_FILE = '/tmp/sync-bts2.lock';

async function main() {
  // 1. Lock check
  if (fs.existsSync(LOCK_FILE)) {
    const stats = fs.statSync(LOCK_FILE);
    const age = Date.now() - stats.mtimeMs;
    // If lock is older than 5 minutes, assume it's stale
    if (age < 5 * 60 * 1000) {
      console.log('⏳ Sync already in progress (lock exists). Bailing out.');
      process.exit(0);
    }
    console.log('🧹 Removing stale lock file.');
    fs.unlinkSync(LOCK_FILE);
  }

  // Create lock
  fs.writeFileSync(LOCK_FILE, process.pid.toString());

  const scraper = new ChallongeScraper();
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });

  const tournamentId = 'cm-bts2-auto-imported';
  const tournamentName = 'Bey-Tamashii Séries #2';

  // Force exit after 55 seconds to avoid overlapping with next minute's cron
  const watchdog = setTimeout(() => {
    console.error('🚨 Watchdog triggered: Sync took too long. Force exiting.');
    cleanup();
    process.exit(1);
  }, 55000);

  function cleanup() {
    clearTimeout(watchdog);
    if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
  }

  try {
    await db.connect();
    console.log(`[${new Date().toLocaleTimeString()}] Démarrage Sync...`);

    // Scrape with timeout (handled by scraper internally usually, but we'll wrap it)
    const result = await scraper.scrape('fr/B_TS2');
    
    const participantIdToName = new Map<number, string>();
    for (const p of result.participants) {
      participantIdToName.set(p.id, p.name);
    }

    let status = 'REGISTRATION_OPEN';
    if (result.metadata.state === 'complete') status = 'COMPLETE';
    else if (result.metadata.state === 'underway') status = 'UNDERWAY';
    else if (result.metadata.state === 'awaiting_review') status = 'COMPLETE';

    // 2. Load existing log
    const existingRes = await db.query('SELECT "activityLog" FROM tournaments WHERE id = $1', [tournamentId]);
    const currentLog = (existingRes.rows[0]?.activityLog || []) as any[];
    
    // Deduplicate
    const currentKeys = new Set(currentLog.map(e => `${e.timestamp}-${e.message}`));
    const newItems = result.log.filter(e => !currentKeys.has(`${e.timestamp}-${e.message}`));

    if (newItems.length > 0) {
      console.log(`🔔 ${newItems.length} nouveaux logs.`);
      
      // Enrich messages locally for DB (but chatbot is disabled as requested)
      for (const entry of newItems) {
        if (entry.raw?.textParams) {
          const tp = entry.raw.textParams;
          const p1 = tp.player1_display_name?.replace('✅', '').trim() || '???';
          const p2 = tp.player2_display_name?.replace('✅', '').trim() || '???';
          const scores = tp.scores || '';
          const winner = tp.winner_display_name?.replace('✅', '').trim() || '';

          if (entry.raw.key === 'match.create' || entry.type === 'match.create') {
            entry.message = `⚔️ [NOUVEAU MATCH] ${p1} vs ${p2}`;
          } else if (entry.raw.key === 'match.start' || entry.type === 'match.start') {
            entry.message = `🌀 [MATCH LANCÉ] ${p1} vs ${p2}`;
          } else if (entry.raw.key === 'match.complete' || entry.type === 'match.complete') {
            entry.message = `🏆 [VICTOIRE] ${p1} vs ${p2} (${winner} ${scores})`;
          }
        }
      }

      const mergedLog = [...newItems, ...currentLog].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 500);

      await db.query('UPDATE tournaments SET "activityLog" = $1 WHERE id = $2', [JSON.stringify(mergedLog), tournamentId]);
    }

    // Standings recalculation
    const calculatedStats = new Map<number, { wins: number; losses: number }>();
    for (const m of result.matches) {
      if (m.state === 'complete' && m.winnerId) {
        const win = calculatedStats.get(m.winnerId) || { wins: 0, losses: 0 };
        win.wins++;
        calculatedStats.set(m.winnerId, win);
        if (m.loserId) {
          const loss = calculatedStats.get(m.loserId) || { wins: 0, losses: 0 };
          loss.losses++;
          calculatedStats.set(m.loserId, loss);
        }
      }
    }

    result.standings = result.standings.map(s => {
      const pId = [...participantIdToName.entries()].find(([_, name]) => name === s.name)?.[0];
      if (pId && calculatedStats.has(pId)) {
        const stats = calculatedStats.get(pId)!;
        return { ...s, wins: stats.wins, losses: stats.losses, stats: { ...s.stats, wins: stats.wins, losses: stats.losses } };
      }
      return s;
    });

    // 3. Update DB
    await db.query(`
      UPDATE tournaments SET
        name = $1, status = $2, standings = $3, stations = $4, "updatedAt" = NOW()
      WHERE id = $5;
    `, [tournamentName, status, JSON.stringify(result.standings), JSON.stringify(result.stations), tournamentId]);

    // Match sync
    const challongeIdToUserId = new Map<number, string>();
    for (const p of result.participants) {
        const userRes = await db.query('SELECT id FROM users WHERE name = $1 OR username = $1', [p.name]);
        if (userRes.rows[0]?.id) challongeIdToUserId.set(p.id, userRes.rows[0].id);
    }

    for (const m of result.matches) {
        await db.query(`
            INSERT INTO tournament_matches (id, "tournamentId", "challongeMatchId", round, "player1Id", "player2Id", "winnerId", score, state, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            ON CONFLICT ("tournamentId", "challongeMatchId") DO UPDATE SET "winnerId" = EXCLUDED."winnerId", score = EXCLUDED.score, state = EXCLUDED.state, "updatedAt" = NOW()
        `, [`tm-${tournamentId}-${m.id}`, tournamentId, String(m.id), m.round, 
            m.player1Id ? challongeIdToUserId.get(m.player1Id) : null,
            m.player2Id ? challongeIdToUserId.get(m.player2Id) : null,
            m.winnerId ? challongeIdToUserId.get(m.winnerId) : null, 
            m.scores, m.state
        ]);
    }

    console.log(`✅ [${new Date().toLocaleTimeString()}] Sync OK.`);

  } catch (err) {
    console.error('❌ Sync Error:', err.message);
  } finally {
    await scraper.close();
    await db.end();
    cleanup();
  }
}

main();