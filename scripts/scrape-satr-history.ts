import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ChallongeScraper } from '../bot/src/lib/scrapers/challonge-scraper.js';

/**
 * Script pour scraper l'historique des tournois SATR (BBT 14 à 21)
 */

async function run() {
  const scraper = new ChallongeScraper();
  await scraper.init();

  // Liste manuelle car la découverte automatique a échoué (souvent à cause de la structure complexe de Challonge)
  const uniqueSlugs = [
    'satr_bbt21',
    'satr_bbt20',
    'satr_bbt19',
    'satr_bbt18',
    'satr_bbt17',
    'satr_bbt16',
    'satr_bbt15',
    'satr_bbt14',
  ];

  console.log(`🎯 Tournois ciblés (${uniqueSlugs.length}) :`, uniqueSlugs);

  const resultsDir = join(process.cwd(), 'data', 'satr_history');
  await mkdir(resultsDir, { recursive: true });

  for (const slug of uniqueSlugs) {
    try {
      console.log(`\n--- 🏆 Scraping: ${slug} ---`);
      // Le scraper utilise déjà le initialStoreState, ce qui est très robuste
      const data = await scraper.scrape(slug);
      
      const fileName = `${slug}.json`;
      await writeFile(join(resultsDir, fileName), JSON.stringify(data, null, 2));
      console.log(`✅ ${data.participants.length} joueurs, ${data.matches.length} matchs sauvegardés dans data/satr_history/${fileName}`);
    } catch (error) {
      console.error(`❌ Erreur pour ${slug}:`, error);
    }
  }

  await scraper.close();
  console.log('\n✨ Scraping historique terminé.');
}

run().catch(console.error);
