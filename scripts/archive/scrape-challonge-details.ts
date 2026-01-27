
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

puppeteer.use(StealthPlugin());

async function fetchTournamentDetails() {
  // Le payload JSON complet est souvent injecté dans la page module
  const url = 'https://challonge.com/fr/B_TS1/module';
  console.log(`🚀 Démarrage du scraping complet pour : ${url}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Masquer le webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    console.log('🌍 Navigation vers la page module...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Attente de stabilisation
    await new Promise(r => setTimeout(r, 5000));

    // Extraction des données via le contexte du navigateur
    // On passe une chaîne de caractères pour éviter toute interférence de bundler/transpileur (tsx/esbuild)
    const data = await page.evaluate(`
      (function() {
        // Tentative de récupération du store global Challonge
        // Souvent dans window._initialStoreState['TournamentStore']
        
        let tournamentStore = null;
        
        // Méthode 1: _initialStoreState
        // @ts-ignore
        if (window._initialStoreState && window._initialStoreState['TournamentStore']) {
            tournamentStore = window._initialStoreState['TournamentStore'];
        }
        
        return {
          source: 'window._initialStoreState',
          data: tournamentStore
        };
      })()
    `);

    // Sauvegarde JSON
    const outputPath = path.resolve(process.cwd(), 'data/B_TS1_full_details.json');
    // Création du dossier data s'il n'existe pas
    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ Données extraites et sauvegardées dans : ${outputPath}`);
    
    // Screenshot pour debug
    await page.screenshot({ path: 'challonge_full_page.png', fullPage: true });

  } catch (error) {
    console.error('❌ Erreur :', error);
  } finally {
    await browser.close();
  }
}

fetchTournamentDetails();
