
import 'dotenv/config';
import { ChallongeScraper } from '../src/lib/scrapers/challonge-scraper';
import pg from 'pg';

async function main() {
  const scraper = new ChallongeScraper();
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });

  const tournamentId = 'cm-bts2-auto-imported';
  const tournamentDate = new Date('2026-02-08T13:00:00Z');
  const tournamentName = 'Bey-Tamashii Séries #2';

  try {
    await db.connect();
    console.log('🔌 Connecté à la base de données.');

    // 1. Scrape B_TS2
    console.log('🕵️ Démarrage du scraping pour B_TS2...');
    const result = await scraper.scrape('fr/B_TS2');
    console.log(`✅ Données récupérées : ${result.metadata.name} (${result.participants.length} participants)`);
    console.log(`📡 État Challonge : ${result.metadata.state}`);

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

    // 2. Get existing data to compare before update
    const existingRes = await db.query('SELECT "activityLog", stations FROM tournaments WHERE id = $1', [tournamentId]);
    const oldLog = existingRes.rows[0]?.activityLog || [];
    const oldStations = existingRes.rows[0]?.stations || [];
    
    // Detect new log entries
    if (result.log.length > oldLog.length) {
      const newEntries = result.log.slice(0, result.log.length - oldLog.length);
      console.log(`🔔 ${newEntries.length} nouvelles entrées de log détectées.`);
      
      for (const entry of newEntries) {
        let msg = `📢 [Challonge] ${entry.message}`;

        // Enrich using textParams if available (Challonge usually provides this)
        if (entry.raw?.textParams) {
          const tp = entry.raw.textParams;
          const p1 = tp.player1_display_name?.replace('✅', '') || '???';
          const p2 = tp.player2_display_name?.replace('✅', '') || '???';
          const scores = tp.scores || '';
          const winner = tp.winner_display_name?.replace('✅', '') || '';

          if (entry.raw.key === 'match.create' || entry.type === 'match.create') {
            msg = `📢 [Nouveau Match] ${p1} vs ${p2}`;
          } else if (entry.raw.key === 'match.start' || entry.type === 'match.start') {
            msg = `📢 [Match Lancé] ${p1} vs ${p2}`;
          } else if (entry.raw.key === 'match.complete' || entry.type === 'match.complete') {
            msg = `📢 [Match Terminé] ${p1} vs ${p2} -> Victoire de **${winner}** (${scores})`;
          }
        } else if (entry.raw && (entry.type?.includes('match') || entry.message?.includes('match'))) {
           // Fallback to manual match lookup if textParams is missing
           const matchId = entry.raw.trackable?.match?.id || entry.raw.match_id || entry.raw.id;
           const match = result.matches.find(m => m.id === matchId);
           if (match) {
              const p1 = participantIdToName.get(match.player1Id || 0) || '???';
              const p2 = participantIdToName.get(match.player2Id || 0) || '???';
              const identifier = match.identifier || '';
              
              if (entry.message === 'match create' || entry.type === 'match.create') {
                msg = `📢 [Match Créé] Match ${identifier} : ${p1} vs ${p2}`;
              } else if (entry.message === 'match start' || entry.type === 'match.start') {
                msg = `📢 [Match Lancé] Match ${identifier} : ${p1} vs ${p2}`;
              } else if (entry.message === 'match complete' || entry.type === 'match.complete') {
                const winner = participantIdToName.get(match.winnerId || 0) || '???';
                msg = `📢 [Match Terminé] Match ${identifier} : ${p1} vs ${p2} -> Victoire de **${winner}** (${match.scores})`;
              }
           }
        }

        try {
          await fetch('http://localhost:3001/api/twitch/announce', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-api-key': process.env.BOT_API_KEY || ''
            },
            body: JSON.stringify({ message: msg })
          });
        } catch (e) {
          console.warn('⚠️ Échec de l\'envoi de la notification Twitch:', e.message);
        }
      }
    }

    // Detect station changes
    for (const newStation of result.stations) {
      const oldStation = oldStations.find((s: any) => s.stationId === newStation.stationId);
      if (newStation.currentMatch && (!oldStation || !oldStation.currentMatch || oldStation.currentMatch.matchId !== newStation.currentMatch.matchId)) {
        // New match assigned to station
        const m = newStation.currentMatch;
        const msg = `🏟️ [STADIUM] ${newStation.name} : ${m.player1 || '???'} vs ${m.player2 || '???'} (Match ${m.identifier})`;
        console.log(`🏟️ Notification Station : ${msg}`);
        try {
          await fetch('http://localhost:3001/api/twitch/announce', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-api-key': process.env.BOT_API_KEY || ''
            },
            body: JSON.stringify({ message: msg })
          });
        } catch (e) {
          // ignore
        }
      }
    }

    // --- CALCULATE REAL-TIME STANDINGS FROM MATCHES ---
    // The scraper's fetchStandings() might be inaccurate for real-time W/L.
    // We'll rebuild it using the fresh matches data we just scraped.
    const calculatedStats = new Map<number, { wins: number; losses: number }>();

    for (const m of result.matches) {
      if (m.state === 'complete' && m.winnerId) {
        // Winner
        const winnerStats = calculatedStats.get(m.winnerId) || { wins: 0, losses: 0 };
        winnerStats.wins++;
        calculatedStats.set(m.winnerId, winnerStats);

        // Loser
        const loserId = m.loserId;
        if (loserId) {
          const loserStats = calculatedStats.get(loserId) || { wins: 0, losses: 0 };
          loserStats.losses++;
          calculatedStats.set(loserId, loserStats);
        }
      }
    }

    // Merge calculated stats into result.standings
    result.standings = result.standings.map(s => {
      // Find ID for this standing name
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
    
    console.log('📊 Classement recalculé en temps réel avec succès.');

    // 3. Upsert Tournament
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

    // 4. Sync Participants (Simple name-based sync for now)
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

    // 5. Sync Matches
    console.log(`⚔️ Synchronisation des ${result.matches.length} matchs...`);
    let matchesImported = 0;

    for (const m of result.matches) {
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
