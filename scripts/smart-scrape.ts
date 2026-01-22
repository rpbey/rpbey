
import { ChallongeScraper } from '../src/lib/scrapers/challonge-scraper';
import fs from 'fs';
import path from 'path';

// Utilisation : npx tsx scripts/smart-scrape.ts <url_ou_slug> [output_file]

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('❌ Usage: npx tsx scripts/smart-scrape.ts <url_or_slug> [output_path]');
    process.exit(1);
  }

  const slug = args[0];
  const outputPath = args[1] || `data/${slug.replace(/\//g, '_')}_smart.json`;

  console.log(`🤖 Smart Scraper v1.0`);
  console.log(`🎯 Cible : ${slug}`);

  const scraper = new ChallongeScraper();

  try {
    await scraper.init();
    const data = await scraper.scrape(slug);

    // Sauvegarde
    const absolutePath = path.resolve(process.cwd(), outputPath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // On sauvegarde une version "propre" (sans le raw qui est énorme)
    const { raw, ...cleanData } = data;
    
    fs.writeFileSync(absolutePath, JSON.stringify(cleanData, null, 2));
    console.log(`✅ Succès ! Données sauvegardées dans : ${outputPath}`);
    console.log(`📊 Résumé :`);
    console.log(`   - Nom : ${data.metadata.name}`);
    console.log(`   - Participants : ${data.metadata.participantsCount}`);
    console.log(`   - Matchs : ${data.matches.length}`);
    if (data.standings && data.standings.length > 0) {
        console.log(`   - Top 1 : ${data.standings[0].name}`);
    }

  } catch (error) {
    console.error('❌ Erreur fatale :', error);
  } finally {
    await scraper.close();
  }
}

main();
