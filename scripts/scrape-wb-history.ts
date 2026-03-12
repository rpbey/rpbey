import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ChallongeScraper } from '../bot/src/lib/scrapers/challonge-scraper.js';

/**
 * Script pour scraper l'historique des tournois Wild Breakers (Ultim Batailles)
 *
 * Usage: pnpm tsx scripts/scrape-wb-history.ts
 *
 * Les slugs des tournois doivent être ajoutés manuellement ci-dessous
 * après avoir vérifié la page Challonge :
 * https://challonge.com/fr/users/wild_breakers/tournaments
 */

async function run() {
  const scraper = new ChallongeScraper();
  await scraper.init();

  // Liste des slugs de tournois Wild Breakers (Ultim Batailles)
  // À compléter avec les vrais slugs depuis Challonge
  const uniqueSlugs = [
    // Exemples - remplacer par les vrais slugs :
    // 'wb_ub1',
    // 'wb_ub2',
    // etc.
  ];

  if (uniqueSlugs.length === 0) {
    console.log('⚠️  Aucun slug de tournoi configuré.');
    console.log('   Éditez scripts/scrape-wb-history.ts pour ajouter les slugs.');
    console.log('   Consultez : https://challonge.com/fr/users/wild_breakers/tournaments');
    await scraper.close();
    return;
  }

  console.log(`🎯 Tournois ciblés (${uniqueSlugs.length}) :`, uniqueSlugs);

  const resultsDir = join(process.cwd(), 'data', 'wb_history');
  await mkdir(resultsDir, { recursive: true });

  for (const slug of uniqueSlugs) {
    try {
      console.log(`\n--- 🏆 Scraping: ${slug} ---`);
      const data = await scraper.scrape(slug);

      const fileName = `${slug}.json`;
      await writeFile(join(resultsDir, fileName), JSON.stringify(data, null, 2));
      console.log(`✅ ${data.participants.length} joueurs, ${data.matches.length} matchs sauvegardés dans data/wb_history/${fileName}`);
    } catch (error) {
      console.error(`❌ Erreur pour ${slug}:`, error);
    }
  }

  await scraper.close();
  console.log('\n✨ Scraping historique WB terminé.');
}

run().catch(console.error);
