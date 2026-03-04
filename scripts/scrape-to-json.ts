import { ChallongeScraper } from '../src/lib/scrapers/challonge-scraper';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

async function scrapeToJson() {
    const scraper = new ChallongeScraper();
    const slugs = ['fr/B_TS2', 'fr/B_TS3'];
    const exportDir = resolve(process.cwd(), 'data/exports');

    try {
        mkdirSync(exportDir, { recursive: true });
    } catch (err) {
        // Ignore if exists
    }

    console.log("🚀 DEMARRAGE DU SCRAPING VERS JSON...");

    for (const slug of slugs) {
        const fileName = slug.split('/').pop() + '.json';
        const filePath = resolve(exportDir, fileName);

        console.log(`🔍 Scraping ${slug}...`);
        try {
            const data = await scraper.scrape(slug);
            
            // On nettoie un peu les données pour le JSON
            const exportData = {
                metadata: data.metadata,
                participants: data.participants,
                matches: data.matches,
                standings: data.standings,
                scrapedAt: new Date().toISOString()
            };

            writeFileSync(filePath, JSON.stringify(exportData, null, 2));
            console.log(`✅ Données sauvegardées dans : ${filePath}`);
            console.log(`   - Participants: ${exportData.participants.length}`);
            console.log(`   - Matchs: ${exportData.matches.length}`);
        } catch (error) {
            console.error(`❌ Erreur lors du scraping de ${slug}:`, error);
        }
    }

    await scraper.close();
    console.log("🏁 TOUT EST TERMINE.");
}

scrapeToJson().catch(console.error);
