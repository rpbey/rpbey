import { ChallongeScraper } from '../src/lib/scrapers/challonge-scraper';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

async function run() {
  const scraper = new ChallongeScraper();
  const slugs = ['fr/B_TS2', 'fr/B_TS3'];
  const outputDir = resolve(process.cwd(), 'data/exports');

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log("🚀 Démarrage de l'extraction...");

  for (const slug of slugs) {
    console.log(`\n🌐 Scraping : ${slug}`);
    try {
      const data = await scraper.scrape(slug);
      const fileName = `${slug.split('/').pop()}.json`;
      const filePath = resolve(outputDir, fileName);

      const result = {
        name: data.metadata.name,
        url: data.metadata.url,
        scrapedAt: new Date().toISOString(),
        participantsCount: data.participants.length,
        matchesCount: data.matches.length,
        participants: data.participants,
        matches: data.matches,
        standings: data.standings
      };

      writeFileSync(filePath, JSON.stringify(result, null, 2));
      console.log(`✅ Fichier généré : ${filePath}`);
    } catch (err) {
      console.error(`❌ Erreur pour ${slug}:`, err);
    }
  }
  await scraper.close();
  console.log("\n🏁 Fin de l'extraction.");
}

run();
