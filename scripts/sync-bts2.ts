import 'dotenv/config';
import { ChallongeScraper } from '../src/lib/scrapers/challonge-scraper';
import { prisma } from '../src/lib/prisma';
import fs from 'node:fs';
import natural from 'natural';

const LOCK_FILE = '/tmp/sync-bts2.lock';

// Normalization helper
function normalize(s: string | null | undefined): string {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

async function main() {
  // 1. Lock check
  if (fs.existsSync(LOCK_FILE)) {
    const stats = fs.statSync(LOCK_FILE);
    const age = Date.now() - stats.mtimeMs;
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
  const tournamentId = 'cm-bts2-auto-imported';
  const tournamentName = 'Bey-Tamashii Séries #2';

  // Watchdog
  const watchdog = setTimeout(() => {
    console.error('🚨 Watchdog triggered: Sync took too long. Force exiting.');
    cleanup();
    process.exit(1);
  }, 120000); // Increased to 2 mins for heavy logic

  function cleanup() {
    clearTimeout(watchdog);
    if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
  }

  try {
    console.log(`[${new Date().toLocaleTimeString()}] 🚀 Démarrage Sync Améliorée...`);

    // 1. Scrape Challonge
    const result = await scraper.scrape('fr/B_TS2');
    console.log(`✅ Scraped ${result.participants.length} participants & ${result.matches.length} matches.`);

    // 2. Load ALL Users for Matching
    const allUsers = await prisma.user.findMany({
      include: { profile: true }
    });
    console.log(`📚 Loaded ${allUsers.length} existing users from DB.`);

    // 3. Process Participants
    const challongeIdToUserId = new Map<number, string>();
    const participantsData = [];

    for (const p of result.participants) {
      const pName = p.name;
      const normalizedPName = normalize(pName);
      
      let matchedUser = null;
      let matchType = 'none';
      let matchScore = 0;

      // A. Exact / Normalized Match
      matchedUser = allUsers.find(u => {
        return (
          normalize(u.name) === normalizedPName ||
          normalize(u.username) === normalizedPName ||
          normalize(u.discordTag) === normalizedPName ||
          normalize(u.profile?.bladerName) === normalizedPName ||
          (u.username === `bts2_${normalizedPName}`) // Match existing stub
        );
      });

      if (matchedUser) {
        matchType = 'exact/normalized';
        matchScore = 1;
      }

      // B. Fuzzy Match (Jaro-Winkler)
      if (!matchedUser) {
        let bestScore = 0;
        let bestCandidate = null;

        for (const u of allUsers) {
          // Check against multiple fields
          const candidates = [u.name, u.username, u.discordTag, u.profile?.bladerName].filter(Boolean) as string[];
          
          for (const candidate of candidates) {
            const score = natural.JaroWinklerDistance(normalizedPName, normalize(candidate), undefined);
            if (score > bestScore) {
              bestScore = score;
              bestCandidate = u;
            }
          }
        }

        if (bestScore >= 0.88) { // High threshold for safety
          matchedUser = bestCandidate;
          matchType = 'fuzzy';
          matchScore = bestScore;
        }
      }

      // C. Create/Use Stub
      if (!matchedUser) {
        // Double check we don't duplicate a stub we just created in this loop (unlikely given challonge IDs are unique, but good practice)
        const stubUsername = `bts2_${normalizedPName}`;
        
        // Try to find existing stub in DB again (maybe missed by initial load if created recently? Unlikely in this script flow but safe)
        // Actually, we loaded allUsers at start. If it wasn't there, it's not there.
        
        console.log(`🆕 Creating stub for: ${pName}`);
        matchedUser = await prisma.user.create({
          data: {
            name: pName,
            username: stubUsername,
            email: `${stubUsername}@placeholder.rpb`,
            image: '/images/default-avatar.png',
            profile: {
              create: {
                bladerName: pName,
                rankingPoints: 0
              }
            }
          }
        });
        matchType = 'created_stub';
      }

      if (matchType !== 'exact/normalized' && matchType !== 'created_stub') {
        console.log(`🔗 Matched "${pName}" -> "${matchedUser.name}" (${matchType} - ${matchScore.toFixed(2)})`);
      }

      challongeIdToUserId.set(p.id, matchedUser.id);

      // Find standing stats
      const standing = result.standings.find(s => s.name === pName);
      
      participantsData.push({
        id: `tp-${tournamentId}-${matchedUser.id}`,
        tournamentId,
        userId: matchedUser.id,
        challongeParticipantId: String(p.id),
        finalPlacement: standing?.rank || 999,
        wins: standing?.wins || 0,
        losses: standing?.losses || 0,
        checkedIn: true
      });
    }

    // 4. Update Tournament Data & Logs
    console.log('💾 Updating Tournament & Participants...');
    
    // Status Logic
    let status = 'REGISTRATION_OPEN';
    if (result.metadata.state === 'complete' || result.metadata.state === 'awaiting_review') status = 'COMPLETE';
    else if (result.metadata.state === 'underway') status = 'UNDERWAY';

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        name: tournamentName,
        status: status as any, // Cast to enum
        standings: result.standings as any,
        stations: result.stations as any,
        activityLog: result.log as any,
        updatedAt: new Date()
      }
    });

    // Reset Participants for this tournament
    await prisma.tournamentParticipant.deleteMany({ where: { tournamentId } });
    
    // Insert new links
    for (const pData of participantsData) {
      // Use upsert to be safe against unique constraints if multiple challonge IDs map to same user (should not happen in valid brackets)
      // Actually, standard insert is fine since we deleted many. But if one user has 2 entries in challonge...
      const exists = await prisma.tournamentParticipant.findFirst({
        where: { tournamentId, userId: pData.userId }
      });

      if (!exists) {
        await prisma.tournamentParticipant.create({ data: pData });
      } else {
        console.warn(`⚠️ User ${pData.userId} matches multiple Challonge entries. Keeping first.`);
      }
    }

    // 5. Sync Matches
    console.log('⚔️ Syncing Matches...');
    for (const m of result.matches) {
      const p1Id = m.player1Id ? challongeIdToUserId.get(m.player1Id) : null;
      const p2Id = m.player2Id ? challongeIdToUserId.get(m.player2Id) : null;
      const winnerId = m.winnerId ? challongeIdToUserId.get(m.winnerId) : null;

      await prisma.tournamentMatch.upsert({
        where: {
          tournamentId_challongeMatchId: {
            tournamentId,
            challongeMatchId: String(m.id)
          }
        },
        create: {
          id: `tm-${tournamentId}-${m.id}`,
          tournamentId,
          challongeMatchId: String(m.id),
          round: m.round,
          player1Id: p1Id,
          player2Id: p2Id,
          winnerId: winnerId,
          score: m.scores,
          state: m.state
        },
        update: {
          player1Id: p1Id,
          player2Id: p2Id,
          winnerId: winnerId,
          score: m.scores,
          state: m.state,
          updatedAt: new Date()
        }
      });
    }

    // 6. Global Ranking Reset (Prepare for recalc)
    console.log('🔄 Global Ranking Reset (setting all profiles to 0)...');
    await prisma.profile.updateMany({
      data: { rankingPoints: 0 }
    });

    console.log(`✅ [${new Date().toLocaleTimeString()}] Sync & Link Complete.`);

  } catch (err: any) {
    console.error('❌ Sync Error:', err.message);
  } finally {
    await scraper.close();
    await prisma.$disconnect();
    cleanup();
  }
}

main();