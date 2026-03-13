/**
 * Re-scrape B_TS2 from Challonge and rebuild B_TS2.json
 * with accurate exactWins/exactLosses computed from match data.
 */
import 'dotenv/config';
import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ChallongeScraper } from '../bot/src/lib/scrapers/challonge-scraper.js';

const EXPORTS_DIR = resolve(process.cwd(), 'data/exports');
const OUTPUT_FILE = resolve(EXPORTS_DIR, 'B_TS2.json');
const MAPPER_FILE = resolve(EXPORTS_DIR, 'participants_map.json');

async function main() {
  const scraper = new ChallongeScraper();

  try {
    console.log('🚀 Re-scraping B_TS2 depuis Challonge...');
    const result = await scraper.scrape('fr/B_TS2');

    console.log(`\n📊 Résultats du scrape:`);
    console.log(`  Participants: ${result.participants.length}`);
    console.log(`  Matches: ${result.matches.length}`);
    console.log(`  Standings: ${result.standings.length}`);

    // 1. Build stats from matches (most reliable source)
    const statsFromMatches = new Map<
      number,
      { wins: number; losses: number; wbWins: number; lbWins: number }
    >();

    let completeMatches = 0;
    for (const m of result.matches) {
      if (m.state !== 'complete') continue;
      completeMatches++;

      if (m.winnerId) {
        const w = statsFromMatches.get(m.winnerId) || {
          wins: 0,
          losses: 0,
          wbWins: 0,
          lbWins: 0,
        };
        w.wins++;
        if (m.round > 0) w.wbWins++;
        else w.lbWins++;
        statsFromMatches.set(m.winnerId, w);
      }
      if (m.loserId) {
        const l = statsFromMatches.get(m.loserId) || {
          wins: 0,
          losses: 0,
          wbWins: 0,
          lbWins: 0,
        };
        l.losses++;
        statsFromMatches.set(m.loserId, l);
      }
    }

    console.log(`  Complete matches: ${completeMatches}`);
    console.log(`  Players with match stats: ${statsFromMatches.size}`);

    // 2. Build standings lookup
    const standingsMap = new Map<string, { rank: number; wins: number; losses: number }>();
    for (const s of result.standings) {
      const cleanName = s.name.replace(/✅/g, '').trim();
      standingsMap.set(cleanName.toLowerCase(), {
        rank: s.rank,
        wins: s.wins,
        losses: s.losses,
      });
    }

    // 3. Load mapper for aliases
    let mapper: Record<string, { primaryName: string; challongeUsername: string; aliases: string[] }> = {};
    try {
      mapper = JSON.parse(readFileSync(MAPPER_FILE, 'utf-8'));
    } catch {
      console.warn('⚠️ participants_map.json not found');
    }

    // 4. Build export participants
    const participants = result.participants.map((p) => {
      const cleanName = (p.name || '').replace(/✅/g, '').trim();
      const matchStats = statsFromMatches.get(p.id);
      const standing = standingsMap.get(cleanName.toLowerCase());

      // Priority: match-computed stats > standings > 0
      const exactWins = matchStats?.wins ?? standing?.wins ?? 0;
      const exactLosses = matchStats?.losses ?? standing?.losses ?? 0;

      // Build match history from matches (W/L sequence by round order)
      const playerMatches = result.matches
        .filter(
          (m) =>
            m.state === 'complete' &&
            (m.player1Id === p.id || m.player2Id === p.id),
        )
        .sort((a, b) => {
          // Sort: positive rounds ascending, then negative rounds descending (WB first, then LB)
          if (a.round > 0 && b.round > 0) return a.round - b.round;
          if (a.round < 0 && b.round < 0) return b.round - a.round; // -1 before -2
          if (a.round > 0) return -1;
          return 1;
        });

      const matchHistory: string[] = [];
      for (const m of playerMatches) {
        if (m.winnerId === p.id) matchHistory.push('W');
        else matchHistory.push('L');
      }

      return {
        name: cleanName,
        rank: standing?.rank ?? p.finalRank ?? 0,
        challongeUsername: p.challongeUsername || null,
        challongeUrl: p.challongeProfileUrl || null,
        exactWins,
        exactLosses,
        matchHistory,
        avatarUrl: null as string | null,
      };
    });

    // Sort by rank
    participants.sort((a, b) => (a.rank || 999) - (b.rank || 999));

    // 5. Build standings for export
    const standings = result.standings.map((s) => ({
      name: s.name.replace(/✅/g, '').trim(),
      rank: s.rank,
    }));

    // 6. Build matches for export
    const matches = result.matches.map((m) => ({
      id: m.id,
      round: m.round,
      player1Id: m.player1Id,
      player2Id: m.player2Id,
      winnerId: m.winnerId,
      loserId: m.loserId,
      scores: m.scores,
      state: m.state,
    }));

    // 7. Write output
    const output = {
      url: `https://challonge.com/fr/B_TS2`,
      scrapedAt: new Date().toISOString(),
      participantsCount: participants.length,
      matchesCount: matches.length,
      participants,
      matches,
      standings,
    };

    writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

    // 8. Report
    console.log(`\n✅ B_TS2.json mis à jour avec ${participants.length} participants\n`);

    console.log('=== Stats par joueur ===\n');
    console.log(
      'Nom'.padEnd(25),
      'Rank'.padEnd(6),
      'W'.padEnd(4),
      'L'.padEnd(4),
      'History',
    );
    console.log('-'.repeat(70));
    for (const p of participants) {
      if (p.name === 'Inscription') continue;
      console.log(
        p.name.padEnd(25),
        String(p.rank).padEnd(6),
        String(p.exactWins).padEnd(4),
        String(p.exactLosses).padEnd(4),
        p.matchHistory.join(',') || '(none)',
      );
    }
  } catch (err: any) {
    console.error('❌ Erreur:', err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    await scraper.close();
  }
}

main();
