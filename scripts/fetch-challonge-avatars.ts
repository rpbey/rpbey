import { ChallongeScraper } from '../src/lib/scrapers/challonge-scraper';
import { prisma } from '../src/lib/prisma';

function getPureUsername(s: string | null | undefined): string {
  if (!s) return 'anonyme';
  return s.toLowerCase()
          .replace(/^(satr_|satr |teamarc|team arc |bts[1-3]_|fr_b_ts[1-3]_|@|rnsx_|rnsx)/g, '')
          .replace(/[^a-z0-9]/g, '')
          .replace(/[0-9]+$/, '')
          .trim() || 'blader';
}

async function fetchAvatars(slug: string) {
    const scraper = new ChallongeScraper();
    try {
        console.log(`📸 Récupération des avatars pour ${slug}...`);
        const result = await scraper.scrape(slug);
        
        let count = 0;
        for (const p of result.participants) {
            // Dans le scraper, l'image est souvent dans p.challongeProfileUrl ou on peut la déduire
            // Si le scraper ne l'a pas capturé, on peut tenter une approche directe si on a l'ID
            if (p.portraitUrl) {
                const pureUsername = getPureUsername(p.name);
                const user = await prisma.user.findUnique({ where: { username: pureUsername } });
                
                if (user) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { image: p.portraitUrl }
                    });
                    console.log(`✅ Avatar mis à jour pour ${pureUsername}`);
                    count++;
                }
            }
        }
        console.log(`🎉 ${count} avatars récupérés pour ${slug}.`);
    } catch (e: any) {
        console.error(`❌ Erreur avatars ${slug}:`, e.message);
    } finally {
        await scraper.close();
    }
}

async function main() {
    await fetchAvatars('fr/B_TS2');
    await fetchAvatars('fr/B_TS3');
}

main().finally(() => prisma.$disconnect());
