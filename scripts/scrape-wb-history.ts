import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ChallongeScraper } from '../bot/src/lib/scrapers/challonge-scraper.js';

/**
 * Script pour scraper l'historique des tournois Wild Breakers (Ultime Batailles)
 *
 * Usage: pnpm tsx scripts/scrape-wb-history.ts
 *
 * Source: https://challonge.com/fr/users/wild_breakers/tournaments
 */

// Mapping: Challonge slug → UB number (for consistent file naming)
const TOURNAMENT_MAP: Record<string, number> = {
  WildBreakersUltimeBataille: 1,
  WildBreakersUltimeBataille2: 2,
  WildBreakersUltimeBataille3: 3,
  WildBreakersUltimeBataille4: 4,
  WildBreakersUltimeBataille5: 5,
  fbzzxt43: 6,
  WildBreakersUltimeBataille7: 7,
  WildBreakersUltimeBataille8: 8,
  i2ltr3yr: 9,
  go8qg261: 10,
  WildBreakersUltimeBataille11: 11,
  UB12: 12,
  UB13: 13,
};

// Hors-Série tournaments: Challonge slug → { file key, label }
const HS_TOURNAMENT_MAP: Record<string, { key: string; label: string }> = {
  lif1eofk: { key: 'patoo', label: 'Ultime Défi de Patoo' },
  l6zda4qm: { key: 'jgf', label: 'Japan Geek Festival' },
  UltimeBatailleHS: { key: 'phase2', label: 'UB Hors-Série Phase 2' },
};

async function run() {
  const scraper = new ChallongeScraper();
  await scraper.init();

  const slugs = Object.keys(TOURNAMENT_MAP);
  console.log(`🎯 Tournois ciblés (${slugs.length}) :`, slugs);

  const resultsDir = join(process.cwd(), 'data', 'wb_history');
  await mkdir(resultsDir, { recursive: true });

  for (const slug of slugs) {
    const ubNumber = TOURNAMENT_MAP[slug]!;
    try {
      console.log(`\n--- 🏆 Scraping: UB #${ubNumber} (${slug}) ---`);
      const data = await scraper.scrape(slug);

      const fileName = `wb_ub${ubNumber}.json`;
      await writeFile(join(resultsDir, fileName), JSON.stringify(data, null, 2));
      console.log(`✅ ${data.participants.length} joueurs, ${data.matches.length} matchs → data/wb_history/${fileName}`);
    } catch (error) {
      console.error(`❌ Erreur pour UB #${ubNumber} (${slug}):`, error);
    }
  }

  // Scrape hors-série tournaments
  const hsSlugs = Object.keys(HS_TOURNAMENT_MAP);
  console.log(`\n🎯 Tournois Hors-Série (${hsSlugs.length}) :`, hsSlugs);

  for (const slug of hsSlugs) {
    const hs = HS_TOURNAMENT_MAP[slug]!;
    try {
      console.log(`\n--- 🏆 Scraping HS: ${hs.label} (${slug}) ---`);
      const data = await scraper.scrape(slug);

      const fileName = `wb_hs_${hs.key}.json`;
      await writeFile(join(resultsDir, fileName), JSON.stringify(data, null, 2));
      console.log(`✅ ${data.participants.length} joueurs, ${data.matches.length} matchs → data/wb_history/${fileName}`);
    } catch (error) {
      console.error(`❌ Erreur pour HS ${hs.label} (${slug}):`, error);
    }
  }

  await scraper.close();
  console.log('\n✨ Scraping historique WB terminé.');
}

run().catch(console.error);
