import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ChallongeScraper } from '../src/lib/scrapers/challonge-scraper';

async function main() {
  const scraper = new ChallongeScraper();

  try {
    console.log('Scraping B_TS1...');
    const result = await scraper.scrape('fr/B_TS1');

    // Dump raw data to investigate
    writeFileSync(
      '/tmp/bts1_raw.json',
      JSON.stringify(
        {
          metadata: result.metadata,
          participantCount: result.participants.length,
          standingsCount: result.standings.length,
          matchCount: result.matches.length,
          standingsSample: result.standings.slice(0, 5),
          participantsSample: result.participants.slice(0, 5),
          rawKeys: result.raw ? Object.keys(result.raw) : [],
        },
        null,
        2,
      ),
    );
    console.log('Dumped to /tmp/bts1_raw.json');

    // If standings have participants, build from those
    if (result.standings.length > 0) {
      console.log(`Found ${result.standings.length} standings!`);

      // Build match stats from matches data
      const statsMap = new Map<
        number,
        { wins: number; losses: number; history: string[] }
      >();
      for (const m of result.matches) {
        if (m.state === 'complete' && m.winnerId) {
          const w = statsMap.get(m.winnerId) || {
            wins: 0,
            losses: 0,
            history: [],
          };
          w.wins++;
          w.history.push('W');
          statsMap.set(m.winnerId, w);
          if (m.loserId) {
            const l = statsMap.get(m.loserId) || {
              wins: 0,
              losses: 0,
              history: [],
            };
            l.losses++;
            l.history.push('L');
            statsMap.set(m.loserId, l);
          }
        }
      }

      // Build participants from standings
      const participants = result.standings.map(
        (s: { rank: number; name: string }) => ({
          name: s.name,
          rank: s.rank,
          challongeUsername: null,
          challongeUrl: null,
          exactWins: 0,
          exactLosses: 0,
          matchHistory: [] as string[],
        }),
      );

      const exportData = {
        url: result.metadata.url || 'https://challonge.com/fr/B_TS1',
        scrapedAt: new Date().toISOString(),
        participantsCount: participants.length,
        matchesCount: result.matches.length,
        participants,
      };

      const outPath = join(process.cwd(), 'data/exports/B_TS1.json');
      writeFileSync(outPath, JSON.stringify(exportData, null, 2));
      console.log(`Saved ${participants.length} participants to ${outPath}`);
    } else {
      console.log('No standings found either.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await scraper.close();
  }
}

main();
