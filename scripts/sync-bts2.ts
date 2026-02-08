import 'dotenv/config';
import { ChallongeScraper } from '../src/lib/scrapers/challonge-scraper';
import pg from 'pg';

async function runSync() {
  const scraper = new ChallongeScraper();
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });

  const tournamentId = 'cm-bts2-auto-imported';
  const tournamentDate = new Date('2026-02-08T13:00:00Z');
  const tournamentName = 'Bey-Tamashii Séries #2';

  try {
    await db.connect();
    
    // 1. Scrape B_TS2
    const result = await scraper.scrape('fr/B_TS2');
    
    // Map: Challonge Participant ID -> Participant Name
    const participantIdToName = new Map<number, string>();
    for (const p of result.participants) {
      participantIdToName.set(p.id, p.name);
    }

    // Map Challonge state to RPB status
    let status = 'REGISTRATION_OPEN';
    if (result.metadata.state === 'complete') status = 'COMPLETE';
    else if (result.metadata.state === 'underway') status = 'UNDERWAY';
    else if (result.metadata.state === 'awaiting_review') status = 'COMPLETE';

    // 2. Get existing data
    const existingRes = await db.query('SELECT "activityLog", stations FROM tournaments WHERE id = $1', [tournamentId]);
    const oldLog = (existingRes.rows[0]?.activityLog || []) as any[];
    const oldStations = (existingRes.rows[0]?.stations || []) as any[];
    
    // Deduplicate and detect new log entries
    const oldLogKeys = new Set(oldLog.map(entry => `${entry.timestamp}-${entry.message}`));
    const newEntries = result.log.filter(entry => !oldLogKeys.has(`${entry.timestamp}-${entry.message}`));
    
    if (newEntries.length > 0) {
      console.log(`🔔 ${newEntries.length} nouvelles entrées de log.`);
      
      for (const entry of newEntries) {
        let msg = entry.message;

        if (entry.raw?.textParams) {
          const tp = entry.raw.textParams;
          const p1 = tp.player1_display_name?.replace('✅', '').trim() || '???';
          const p2 = tp.player2_display_name?.replace('✅', '').trim() || '???';
          const scores = tp.scores || '';
          const winner = tp.winner_display_name?.replace('✅', '').trim() || '';

          if (entry.raw.key === 'match.create' || entry.type === 'match.create') {
            msg = `⚔️ [NOUVEAU MATCH] ${p1} vs ${p2}`;
          } else if (entry.raw.key === 'match.start' || entry.type === 'match.start') {
            msg = `🌀 [MATCH LANCÉ] ${p1} vs ${p2}`;
          } else if (entry.raw.key === 'match.complete' || entry.type === 'match.complete') {
            msg = `🏆 [VICTOIRE] ${p1} vs ${p2} (Victoire ${winner} ${scores})`;
          }
        }
        
        // Enrich the entry itself for DB
        entry.message = msg;

        // Send to Twitch
        try {
          await fetch('http://localhost:3001/api/twitch/announce', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-api-key': process.env.BOT_API_KEY || ''
            },
            body: JSON.stringify({ message: msg.startsWith('📢') ? msg : `📢 ${msg}` })
          });
          await new Promise(r => setTimeout(r, 800));
        } catch (e) {
          // ignore
        }
      }

      // Merge logs and keep last 500
      const mergedLog = [...newEntries, ...oldLog].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 500);

      // Save merged log
      await db.query('UPDATE tournaments SET "activityLog" = $1 WHERE id = $2', [JSON.stringify(mergedLog), tournamentId]);
    }

    // Detect station changes
    for (const newStation of result.stations) {
      const oldStation = oldStations.find((s: any) => s.stationId === newStation.stationId);
      if (newStation.currentMatch && (!oldStation || !oldStation.currentMatch || oldStation.currentMatch.matchId !== newStation.currentMatch.matchId)) {
        const m = newStation.currentMatch;
        const msg = `🏟️ [STADIUM] ${newStation.name} : ${m.player1 || '???'} vs ${m.player2 || '???'} (Match ${m.identifier})`;
        try {
          await fetch('http://localhost:3001/api/twitch/announce', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-api-key': process.env.BOT_API_KEY || ''
            },
            body: JSON.stringify({ message: msg })
          });
          await new Promise(r => setTimeout(r, 800));
        } catch (e) {
          // ignore
        }
      }
    }

    // --- CALCULATE REAL-TIME STANDINGS ---
    const calculatedStats = new Map<number, { wins: number; losses: number }>();
    for (const m of result.matches) {
      if (m.state === 'complete' && m.winnerId) {
        const winnerStats = calculatedStats.get(m.winnerId) || { wins: 0, losses: 0 };
        winnerStats.wins++;
        calculatedStats.set(m.winnerId, winnerStats);
        const loserId = m.loserId;
        if (loserId) {
          const loserStats = calculatedStats.get(loserId) || { wins: 0, losses: 0 };
          loserStats.losses++;
          calculatedStats.set(loserId, loserStats);
        }
      }
    }

    result.standings = result.standings.map(s => {
      const pId = [...participantIdToName.entries()].find(([_, name]) => name === s.name)?.[0];
      if (pId && calculatedStats.has(pId)) {
        const stats = calculatedStats.get(pId)!;
        return {
          ...s,
          wins: stats.wins,
          losses: stats.losses,
          stats: { ...s.stats, wins: stats.wins, losses: stats.losses }
        };
      }
      return s;
    });

    // 3. Upsert Tournament core data
    const tournamentQuery = `
      UPDATE tournaments SET
        name = $1,
        status = $2,
        standings = $3,
        stations = $4,
        "updatedAt" = NOW()
      WHERE id = $5;
    `;

    await db.query(tournamentQuery, [
      tournamentName, status, JSON.stringify(result.standings), JSON.stringify(result.stations), tournamentId
    ]);

    // 4. Sync Matches
    const challongeIdToUserId = new Map<number, string>();
    for (const p of result.participants) {
        const userRes = await db.query('SELECT id FROM users WHERE name = $1 OR username = $1', [p.name]);
        const userId = userRes.rows[0]?.id;
        if (userId) challongeIdToUserId.set(p.id, userId);
    }

    for (const m of result.matches) {
        const winnerUserId = m.winnerId ? challongeIdToUserId.get(m.winnerId) : null;
        await db.query(`
            INSERT INTO tournament_matches (id, "tournamentId", "challongeMatchId", round, "player1Id", "player2Id", "winnerId", score, state, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            ON CONFLICT ("tournamentId", "challongeMatchId") DO UPDATE SET "winnerId" = EXCLUDED."winnerId", score = EXCLUDED.score, state = EXCLUDED.state, "updatedAt" = NOW()
        `, [`tm-${tournamentId}-${m.id}`, tournamentId, String(m.id), m.round, 
            m.player1Id ? challongeIdToUserId.get(m.player1Id) : null,
            m.player2Id ? challongeIdToUserId.get(m.player2Id) : null,
            winnerUserId, m.scores, m.state
        ]);
    }

    console.log(`⏱️  [${new Date().toLocaleTimeString()}] Sync B_TS2 OK`);

  } catch (err) {
    console.error('❌ Erreur loop:', err.message);
  } finally {
    await scraper.close();
    await db.end();
  }
}

async function main() {
  console.log('🚀 Démarrage du Super-Sync (15s interval)...');
  for (let i = 0; i < 4; i++) {
    await runSync();
    if (i < 3) await new Promise(resolve => setTimeout(resolve, 15000));
  }
}

main();
